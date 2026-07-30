import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { classifyWithGemini } from '../lib/gemini.js';
import { keywordClassify } from '../lib/classifier.js';

export default async function aiRoutes(app) {
  app.post('/api/ai/classify', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { docId, photoUrls, desc, hazard } = request.body || {};

    if (!docId) {
      return reply.status(400).send({ error: 'docId required' });
    }

    // Get photos from DB if not provided
    let urls = photoUrls;
    let description = desc;
    let hazardLabel = hazard;

    if (!urls || !description) {
      const [rows] = await pool.query('SELECT * FROM observations WHERE id = ?', [docId]);
      if (rows.length === 0) {
        return reply.status(404).send({ error: 'Observation not found' });
      }
      const record = rows[0];
      if (!urls) {
        try { urls = typeof record.photos === 'string' ? JSON.parse(record.photos) : record.photos; } catch { urls = []; }
      }
      if (!description) description = record.description;
      if (!hazardLabel) hazardLabel = record.hazard;
    }

    if (!Array.isArray(urls)) urls = [];

    // Try Gemini, fallback to keyword
    let result;
    if (urls.length > 0) {
      result = await classifyWithGemini(urls, description, hazardLabel);
      if (result.confidence === 'low' && result.reasoning && result.reasoning.includes('No readable images')) {
        result = { ...keywordClassify(description, hazardLabel), confidence: 'low' };
      }
    } else {
      result = { ...keywordClassify(description, hazardLabel), method: 'keyword' };
    }

    result.method = result.method || 'gemini';

    // Write back to DB
    await pool.query(
      `UPDATE observations SET
        ai_category = ?, ai_category_cn = ?, ai_confidence = ?,
        ai_method = ?, ai_reasoning = ?, ai_analyzed_at = NOW()
       WHERE id = ?`,
      [result.category, result.categoryCN, result.confidence, result.method, result.reasoning || '', docId]
    );

    return { success: true, docId, classification: result };
  });

  app.post('/api/ai/classify-batch', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { docIds, scope } = request.body || {};

    let ids = docIds || [];
    if (scope === 'unanalyzed') {
      const [rows] = await pool.query("SELECT id FROM observations WHERE ai_category IS NULL OR ai_category = ''");
      ids = rows.map(r => r.id);
    } else if (scope === 'others') {
      const [rows] = await pool.query("SELECT id FROM observations WHERE ai_category = 'Others'");
      ids = rows.map(r => r.id);
    } else if (scope === 'all' || ids.length === 0) {
      const [rows] = await pool.query('SELECT id FROM observations');
      ids = rows.map(r => r.id);
    }

    return { success: true, queued: ids.length, docIds: ids };
  });
}
