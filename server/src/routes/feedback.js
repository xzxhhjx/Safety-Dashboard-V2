import { pool } from '../db.js';

export default async function feedbackRoutes(app) {
  app.post('/api/feedback', async (request, reply) => {
    const { type, content, contact } = request.body || {};

    if (!content || !content.trim()) {
      return reply.status(400).send({ error: 'Content is required' });
    }

    await pool.query(
      'INSERT INTO feedback (type, content, contact) VALUES (?, ?, ?)',
      [type || 'other', content.trim(), contact || '']
    );

    return { success: true };
  });
}
