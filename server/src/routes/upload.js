import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { downloadAndCacheImages } from '../lib/storage.js';
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
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    // Map Excel columns to DB columns using keyword matching
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
    if (rows.length > 0) {
      for (const [field, keys] of Object.entries(COL_KEYS)) {
        colMap[field] = findCol(rows[0], keys);
      }
    }

    const records = rows.map((row, idx) => ({
      id: (colMap.id && row[colMap.id]) ? String(row[colMap.id]) : `AUTO-${idx + 1}`,
      hazard: colMap.hazard ? row[colMap.hazard] : null,
      status: colMap.status ? row[colMap.status] : null,
      dept: colMap.dept ? row[colMap.dept] : null,
      description: colMap.description ? row[colMap.description] : null,
      obs_time: colMap.obs_time ? parseDate(row[colMap.obs_time]) : null,
      submitter: colMap.submitter ? row[colMap.submitter] : null,
      obs_type: colMap.obs_type ? row[colMap.obs_type] : null,
      area: colMap.area ? row[colMap.area] : null,
      who: colMap.who ? row[colMap.who] : null,
      photos: colMap.photos ? parsePhotos(row[colMap.photos]) : [],
    })).filter(r => r.hazard || r.description);

    const fields = [
      'id', 'hazard', 'status', 'dept', 'description', 'obs_time',
      'submitter', 'obs_type', 'area', 'who', 'photos',
    ];

    let count = 0;
    let imagesDownloaded = 0;
    for (const record of records) {
      if (!record.id) continue;

      // Download external images before inserting
      if (Array.isArray(record.photos) && record.photos.length > 0) {
        const localPaths = await downloadAndCacheImages(record.id, record.photos);
        record.photos = localPaths;
        imagesDownloaded++;
      }

      const values = fields.map(f => record[f] ?? null);
      const placeholders = fields.map(() => '?').join(', ');
      const updates = fields.map(f => `${f} = VALUES(${f})`).join(', ');

      await pool.query(
        `INSERT INTO observations (${fields.join(', ')}) VALUES (${placeholders})
         ON DUPLICATE KEY UPDATE ${updates}`,
        values
      );
      count++;
    }

    return { success: true, count, total: rows.length, imagesDownloaded };
  });
}

function parseDate(val) {
  if (!val) return null;
  // Excel serial number
  if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400 * 1000);
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }
  const d = new Date(String(val));
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 19).replace('T', ' ');
}

function parsePhotos(val) {
  if (!val) return [];
  const str = String(val).trim();
  if (!str) return [];
  // Try JSON array
  try { const p = JSON.parse(str); return Array.isArray(p) ? p : [str]; } catch {}
  // Split by common delimiters
  return str.split(/[,;\n\r]+/).map(s => s.trim()).filter(Boolean);
}
