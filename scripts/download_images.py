#!/usr/bin/env python3
"""
批量下载外部图片到服务器本地磁盘。
只处理 photos 字段中包含 http:// 或 https:// 的记录。

用法:
  python3 download_images.py --batch 50           # 每次处理50条
  python3 download_images.py --batch 100 --dry-run # 查看有多少条待下载，不实际下载
  python3 download_images.py --batch 50 --retry-failed  # 重试之前失败的链接
"""

import os
import sys
import time
import json
import argparse
from pathlib import Path
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed

# ── 读取 .env ──────────────────────────────────────────────
def load_env():
    """从同目录或上级目录的 .env 文件加载配置"""
    script_dir = Path(__file__).resolve().parent
    for loc in [script_dir / '.env', script_dir.parent / '.env']:
        if loc.exists():
            with open(loc) as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue
                    if '=' in line:
                        k, v = line.split('=', 1)
                        os.environ.setdefault(k.strip(), v.strip())
            print(f'[env] Loaded {loc}')
            return
    print('[env] WARNING: .env not found, using os.environ')

load_env()

# ── 配置 ───────────────────────────────────────────────────
DB_HOST = os.getenv('MYSQL_HOST', '127.0.0.1')
DB_PORT = int(os.getenv('MYSQL_PORT', 13306))
DB_USER = os.getenv('MYSQL_USER', 'safety')
DB_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
DB_NAME = os.getenv('MYSQL_DATABASE', 'safety_dashboard')
UPLOAD_DIR = Path(os.getenv('UPLOAD_DIR', './data/uploads'))

# 下载超时（秒）
TIMEOUT = 30
# 并发下载线程数
CONCURRENT = 4

# ── 数据库连接 ─────────────────────────────────────────────
def get_db():
    import pymysql
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset='utf8mb4',
    )

# ── 下载逻辑 ───────────────────────────────────────────────
def download_one_image(url, save_dir, idx):
    """下载单张图片，返回本地路径或 __FAILED__ 标记"""
    if not url or not (url.startswith('http://') or url.startswith('https://')):
        return url  # 已经是本地路径

    try:
        import requests
        resp = requests.get(url, timeout=TIMEOUT, headers={
            'User-Agent': 'SafetyDashboard/3.0'
        })
        resp.raise_for_status()

        # 推断扩展名
        parsed = urlparse(url)
        ext = Path(parsed.path).suffix.split('?')[0] or '.jpg'
        if ext.lower() not in ('.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'):
            ext = '.jpg'

        filename = f'{int(time.time())}-{idx}{ext}'
        save_dir.mkdir(parents=True, exist_ok=True)
        filepath = save_dir / filename
        filepath.write_bytes(resp.content)

        # 返回相对于 /uploads 的路径
        return f'/uploads/observations/{save_dir.name}/{filename}'

    except Exception as e:
        return f'__FAILED__{e}::{url}'

def process_record(cursor, doc_id, photos):
    """处理一条记录的所有图片"""
    if isinstance(photos, str):
        try:
            photos = json.loads(photos)
        except json.JSONDecodeError:
            photos = [p.strip() for p in photos.split(',') if p.strip()]

    if not photos or not isinstance(photos, list):
        return True, 0  # 没有图片或格式不对

    # 检查是否有外部 URL 需要下载
    external = [p for p in photos if p and (p.startswith('http://') or p.startswith('https://'))]
    if not external:
        return True, 0  # 全是本地路径，跳过

    save_dir = UPLOAD_DIR / 'observations' / doc_id
    new_photos = []
    failed = 0

    for i, url in enumerate(photos):
        if url and (url.startswith('http://') or url.startswith('https://')):
            result = download_one_image(url, save_dir, i)
            if result.startswith('__FAILED__'):
                failed += 1
                print(f'  ✗ FAILED: {doc_id} [{i}] {url[:80]}')
            new_photos.append(result)
        else:
            new_photos.append(url)

    # 更新数据库
    cursor.execute(
        'UPDATE observations SET photos = %s WHERE id = %s',
        (json.dumps(new_photos), doc_id)
    )
    return False, failed  # succeeded, failed_count

# ── 主逻辑 ─────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description='批量下载外部图片到服务器本地')
    parser.add_argument('--batch', type=int, default=50, help='每批处理条数 (默认50)')
    parser.add_argument('--concurrent', type=int, default=CONCURRENT, help=f'并发线程数 (默认{CONCURRENT})')
    parser.add_argument('--dry-run', action='store_true', help='仅统计待下载数量，不实际下载')
    parser.add_argument('--retry-failed', action='store_true', help='重试之前标记为 __FAILED__ 的链接')
    args = parser.parse_args()

    db = get_db()
    cursor = db.cursor()

    # 统计总数
    if args.retry_failed:
        cursor.execute(
            "SELECT COUNT(*) FROM observations WHERE photos LIKE '%__FAILED__%'"
        )
    else:
        cursor.execute(
            "SELECT COUNT(*) FROM observations WHERE photos LIKE '%http://%' OR photos LIKE '%https://%'"
        )
    total = cursor.fetchone()[0]
    print(f'\n{"[DRY RUN] " if args.dry_run else ""}待处理记录数: {total}')

    if total == 0:
        print('没有需要下载的图片。')
        cursor.close()
        db.close()
        return

    if args.dry_run:
        cursor.close()
        db.close()
        return

    # 分批查询和处理
    offset = 0
    processed_total = 0
    failed_total = 0

    while offset < total:
        if args.retry_failed:
            cursor.execute(
                "SELECT id, photos FROM observations WHERE photos LIKE '%__FAILED__%' "
                "LIMIT %s OFFSET %s",
                (args.batch, offset)
            )
        else:
            cursor.execute(
                "SELECT id, photos FROM observations "
                "WHERE photos LIKE '%http://%' OR photos LIKE '%https://%' "
                "LIMIT %s OFFSET %s",
                (args.batch, offset)
            )
        rows = cursor.fetchall()

        if not rows:
            break

        batch_failed = 0
        for doc_id, photos in rows:
            ok, f = process_record(cursor, doc_id, photos)
            batch_failed += f if not ok else 0

        db.commit()
        processed_total += len(rows)
        failed_total += batch_failed
        remaining = total - offset - len(rows)

        print(f'[batch] 已处理 {processed_total}/{total}, '
              f'本批失败 {batch_failed}, 剩余 ~{remaining}')
        offset += args.batch

    cursor.close()
    db.close()

    print(f'\n{"="*50}')
    print(f'完成! 共处理 {processed_total} 条记录, 失败 {failed_total} 张图片')
    if failed_total > 0:
        print(f'提示: 失败图片已标记为 __FAILED__，修复网络后可用 --retry-failed 重试')

if __name__ == '__main__':
    main()
