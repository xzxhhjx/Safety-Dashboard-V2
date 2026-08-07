import { PassThrough } from 'node:stream';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { downloadAndCacheImages, isExternalUrl } from '../lib/storage.js';
import { normalizeArea, normalizeSubmitter } from '../lib/classifier.js';
import { config } from '../config.js';
import xlsx from 'xlsx';

export default async function uploadRoutes(app) {
  app.post('/api/upload/excel', { preHandler: [authMiddleware] }, async (request, reply) => {
    const file = await request.file();

    if (!file) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    const filename = (file.filename || '').toLowerCase();
    const allowedExts = ['.xlsx', '.xls', '.csv'];
    if (!allowedExts.some(ext => filename.endsWith(ext))) {
      return reply.status(400).send({ error: 'Invalid file type. Allowed: .xlsx, .xls, .csv' });
    }

    const buffer = await file.toBuffer();
    const stream = new PassThrough();

    const send = (data) => {
      stream.write(JSON.stringify(data) + '\n');
    };

    // Start streamed response — processing happens after reply.send()
    reply.type('application/x-ndjson').send(stream);

    try {
      // --- Phase 1: Parse Excel ---
      send({ type: 'log', phase: 'parse', message: `Reading ${filename}...` });
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
      send({ type: 'log', phase: 'parse', message: `Parsed ${rows.length} rows from sheet "${sheetName}"` });

      if (rows.length === 0) {
        send({ type: 'done', count: 0, total: 0, imagesDownloaded: 0 });
        stream.end();
        return;
      }

      // --- Phase 2: Map columns ---
      const COL_KEYS = {
        id: ['序号', 'No', 'id', 'ID', '编号', '单据流水号'],
        hazard: ['Type of hazard', '隐患分类', '观察项目', '问题类型'],
        status: ['Status of the finding', '观察项状态', 'Status', '状态', 'Finding Status', '情况', '观察状态', '处理进度'],
        dept: ['Company', 'Department', '单位', '部门', '单位/部门'],
        description: ['Description', '观察项描述', '观察描述'],
        obs_time: ['提交时间', 'Time', 'Date', '日期', '发起时间'],
        submitter: ['Created by', 'Submitter', '填报人', '提交人', '1.', 'NAME', '姓名', 'Name', '观察人姓名'],
        obs_type: ['Type of the observation', '观察项分类', '观察者类型'],
        area: ['Where', 'Area', '区域', '具体位置'],
        who: ['Who', 'Personnel', 'involved', '当事人', '涉及人员', '责任人'],
        measures: ['采取的措施', '已采取的措施', '措施', 'Action taken', 'Measures', 'Actions'],
        photos: ['Photo', '图片', '现场照片'],
      };

      function findCol(row, keys) {
        for (const key of keys) {
          for (const col of Object.keys(row)) {
            if (col.toLowerCase().includes(key.toLowerCase())) return col;
          }
        }
        return null;
      }

      const colMap = {};
      for (const [field, keys] of Object.entries(COL_KEYS)) {
        colMap[field] = findCol(rows[0], keys);
      }

      const found = Object.entries(colMap).filter(([, v]) => v).map(([k]) => k);
      const missing = Object.entries(colMap).filter(([, v]) => !v).map(([k]) => k);
      send({ type: 'log', phase: 'map', message: `Matched columns: ${found.join(', ')}` });
      if (missing.length > 0) {
        send({ type: 'log', phase: 'map', message: `Not found: ${missing.join(', ')}` });
      }

      // --- Phase 3: Parse records ---
      const getRowVal = (row, field) => colMap[field] ? row[colMap[field]] : null;

      const records = rows.map((row, idx) => {
        const rawTime = getRowVal(row, 'obs_time');
        const rawName = getRowVal(row, 'submitter');
        const rawId = getRowVal(row, 'id');

        let id;
        if (rawId && String(rawId).trim()) {
          id = String(rawId).trim();
        } else {
          const timeStr = rawTime ? String(rawTime).replace(/[^0-9]/g, '').slice(0, 8) : '';
          const namePart = rawName ? String(rawName).replace(/[^a-zA-Z0-9一-鿿]/g, '').slice(0, 10) : '';
          id = `GEN-${timeStr}-${namePart}-${idx + 1}`;
        }

        return {
          id,
          hazard: colMap.hazard ? row[colMap.hazard] : null,
          status: colMap.status ? row[colMap.status] : null,
          dept: colMap.dept ? row[colMap.dept] : null,
          description: colMap.description ? row[colMap.description] : null,
          obs_time: rawTime ? parseDate(rawTime) : null,
          submitter: normalizeSubmitter(rawName) || null,
          obs_type: getRowVal(row, 'obs_type') || null,
          area: normalizeArea(getRowVal(row, 'area')) || null,
          who: getRowVal(row, 'who') || null,
          measures: getRowVal(row, 'measures') || null,
          photos: colMap.photos ? parsePhotos(row[colMap.photos]) : [],
        };
      }).filter(r => r.hazard || r.description);

      send({ type: 'log', phase: 'parse', message: `${records.length} valid records to insert` });

      // --- Phase 4: Fetch existing records for diff ---
      const recordIds = records.map(r => r.id).filter(Boolean);
      const existingMap = new Map(); // id → status

      if (recordIds.length > 0) {
        // Batch SELECT in chunks of 500 to avoid oversized queries
        const CHUNK = 500;
        for (let i = 0; i < recordIds.length; i += CHUNK) {
          const chunk = recordIds.slice(i, i + CHUNK);
          const placeholders = chunk.map(() => '?').join(', ');
          const [rows] = await pool.query(
            `SELECT id, status FROM observations WHERE id IN (${placeholders})`,
            chunk
          );
          for (const row of rows) {
            existingMap.set(row.id, row.status);
          }
        }
      }
      send({ type: 'log', phase: 'diff', message: `Found ${existingMap.size} existing records in DB` });

      // --- Phase 5: Insert / Update / Skip ---
      const fields = [
        'id', 'hazard', 'status', 'dept', 'description', 'obs_time',
        'submitter', 'obs_type', 'area', 'who', 'measures', 'photos',
      ];

      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let imagesDownloaded = 0;
      let errors = 0;
      const total = records.length;

      // Normalize status for comparison — treat these as "open"
      const OPEN_STATUSES = new Set(['open', 'in progress', 'pending', 'overdue', 'open', '进行中', '待处理', '逾期']);
      const CLOSED_STATUSES = new Set(['closed', 'done', '已关闭', '已完成']);

      function normalizeStatus(s) {
        if (!s) return 'unknown';
        const lower = String(s).toLowerCase().trim();
        if (CLOSED_STATUSES.has(lower) || lower.includes('closed') || lower.includes('关闭') || lower.includes('完成') || lower.includes('done')) return 'closed';
        if (OPEN_STATUSES.has(lower) || lower.includes('open') || lower.includes('进行') || lower.includes('待') || lower.includes('逾期') || lower.includes('overdue') || lower.includes('pending')) return 'open';
        return lower;
      }

      function isOpen(s) { return normalizeStatus(s) === 'open'; }
      function isClosed(s) { return normalizeStatus(s) === 'closed'; }

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        if (!record.id) {
          errors++;
          continue;
        }

        try {
          const existingStatus = existingMap.get(record.id);

          if (!existingStatus) {
            // --- New record: download external images to server, then INSERT ---
            if (Array.isArray(record.photos) && record.photos.length > 0) {
              const hasExternal = record.photos.some(u => typeof u === 'string' && isExternalUrl(u));
              if (hasExternal) {
                send({ type: 'log', phase: 'image', message: `[${i + 1}/${total}] Downloading ${record.photos.length} image(s) for #${record.id}...` });
                const localPaths = await downloadAndCacheImages(record.id, record.photos);
                record.photos = localPaths;
                imagesDownloaded++;
              }
            }

            const values = fields.map(f => {
              const val = record[f] ?? null;
              return f === 'photos' ? JSON.stringify(val) : val;
            });
            const placeholders = fields.map(() => '?').join(', ');

            await pool.query(
              `INSERT INTO observations (${fields.join(', ')}) VALUES (${placeholders})`,
              values
            );
            inserted++;
          } else if (isOpen(existingStatus) && isClosed(record.status)) {
            // --- Status changed Open→Closed: UPDATE status only ---
            await pool.query(
              `UPDATE observations SET status = ? WHERE id = ?`,
              [record.status, record.id]
            );
            updated++;
          } else {
            // --- No meaningful change: repair photos if local files are missing ---
            const [existingRows] = await pool.query(
              'SELECT photos FROM observations WHERE id = ?', [record.id]
            );
            const existingPhotos = existingRows.length > 0 ? safeParsePhotos(existingRows[0].photos) : [];
            const hasMissingLocal = existingPhotos.some(p =>
              p && p.startsWith('/uploads/') && !existsSync(join(config.uploadDir, p.replace('/uploads/', '')))
            );
            if (hasMissingLocal && Array.isArray(record.photos) && record.photos.some(u => isExternalUrl(u))) {
              send({ type: 'log', phase: 'image', message: `[${i + 1}/${total}] Re-downloading ${record.photos.length} image(s) for #${record.id}...` });
              const localPaths = await downloadAndCacheImages(record.id, record.photos);
              await pool.query('UPDATE observations SET photos = ? WHERE id = ?', [JSON.stringify(localPaths), record.id]);
              imagesDownloaded++;
            }
            skipped++;
          }
        } catch (err) {
          errors++;
          send({ type: 'log', phase: 'error', message: `Row ${i + 1} (#${record.id}) failed: ${err.message}` });
        }

        // Progress update every 50 records
        if ((i + 1) % 50 === 0 || i === records.length - 1) {
          send({ type: 'progress', current: i + 1, total, inserted, updated, skipped, images: imagesDownloaded, errors });
        }
      }

      send({ type: 'done', inserted, updated, skipped, total, imagesDownloaded, errors });
      stream.end();
    } catch (err) {
      send({ type: 'error', message: err.message });
      stream.end();
    }
  });
}

function parseDate(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400 * 1000);
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }

  let str = String(val).trim();

  // Format: "27 11月 2025 16:28:50 (UTC+08:00) China Standard Time (Shanghai)"
  const chineseMonthMatch = str.match(
    /^(\d{1,2})\s+(\d{1,2})月\s+(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/
  );
  if (chineseMonthMatch) {
    const [, d, m, y, hh, mm, ss] = chineseMonthMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')} ${hh.padStart(2, '0')}:${mm}:${ss}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }

  return null;
}

function parsePhotos(val) {
  if (!val) return [];
  const str = String(val).trim();
  if (!str) return [];
  try { const p = JSON.parse(str); return Array.isArray(p) ? p : [str]; } catch {}
  return str.split(/[,;\n\r]+/).map(s => s.trim()).filter(Boolean);
}

function safeParsePhotos(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const p = JSON.parse(String(val));
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}
