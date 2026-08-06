import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

export default async function observationRoutes(app) {
  // GET paginated list
  app.get('/api/observations', async (request, reply) => {
    const {
      page = 1,
      pageSize = 50,
      status,
      area,
      hazard,
      keyword,
      startDate,
      endDate,
    } = request.query;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const conditions = [];
    const params = [];

    if (request.query.unclosed === 'true') {
      conditions.push(`(status NOT LIKE '%Closed%' AND status NOT LIKE '%已关闭%' AND status NOT LIKE '%关闭%' AND status NOT LIKE '%跳过%' AND status NOT LIKE '%Done%')`);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (area) {
      conditions.push('area = ?');
      params.push(area);
    }
    if (hazard) {
      conditions.push('hazard = ?');
      params.push(hazard);
    }
    if (request.query.ai_category) {
      conditions.push('ai_category = ?');
      params.push(request.query.ai_category);
    }
    if (keyword) {
      conditions.push('(description LIKE ? OR who LIKE ? OR submitter LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }
    if (startDate) {
      conditions.push('obs_time >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('obs_time <= ?');
      params.push(endDate);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total FROM observations ${where}`,
      params
    );
    const total = countResult[0].total;

    const [data] = await pool.query(
      `SELECT * FROM observations ${where} ORDER BY obs_time DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    return { data, total, page: parseInt(page), pageSize: parseInt(pageSize) };
  });

  // GET single
  app.get('/api/observations/:id', async (request, reply) => {
    const [rows] = await pool.query('SELECT * FROM observations WHERE id = ?', [request.params.id]);
    if (rows.length === 0) {
      return reply.status(404).send({ error: 'Not found' });
    }
    return rows[0];
  });

  // POST batch insert (admin)
  app.post('/api/observations', { preHandler: [authMiddleware] }, async (request, reply) => {
    const records = request.body;
    if (!Array.isArray(records) || records.length === 0) {
      return reply.status(400).send({ error: 'Array of observation records required' });
    }

    const fields = [
      'id', 'hazard', 'status', 'dept', 'description', 'obs_time',
      'submitter', 'obs_type', 'area', 'sub_area', 'who', 'measures', 'photos',
      'ai_category', 'ai_category_cn', 'ai_confidence', 'ai_method',
      'ai_reasoning', 'ai_analyzed_at',
    ];

    let inserted = 0;

    await pool.query('START TRANSACTION');
    try {
      for (const record of records) {
        if (!record.id) continue;
        const values = fields.map(f => {
          const val = record[f] ?? null;
          return f === 'photos' ? JSON.stringify(val) : val;
        });
        const placeholders = fields.map(() => '?').join(', ');
        const updates = fields.map(f => `${f} = VALUES(${f})`).join(', ');

        await pool.query(
          `INSERT INTO observations (${fields.join(', ')}) VALUES (${placeholders})
           ON DUPLICATE KEY UPDATE ${updates}`,
          values
        );
        inserted++;
      }
      await pool.query('COMMIT');
      return { success: true, count: inserted };
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  });

  // PUT update single (admin)
  app.put('/api/observations/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const allowedFields = [
      'hazard', 'status', 'dept', 'description', 'obs_time',
      'submitter', 'obs_type', 'area', 'sub_area', 'who', 'measures', 'photos',
      'ai_category', 'ai_category_cn', 'ai_confidence', 'ai_method',
      'ai_reasoning', 'ai_analyzed_at',
    ];

    const sets = [];
    const values = [];
    for (const [key, val] of Object.entries(request.body)) {
      if (allowedFields.includes(key)) {
        sets.push(`${key} = ?`);
        values.push(val);
      }
    }

    if (sets.length === 0) {
      return reply.status(400).send({ error: 'No valid fields to update' });
    }

    values.push(request.params.id);
    const [result] = await pool.query(
      `UPDATE observations SET ${sets.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return reply.status(404).send({ error: 'Observation not found' });
    }

    return { success: true };
  });
}
