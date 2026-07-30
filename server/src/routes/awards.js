import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

export default async function awardRoutes(app) {
  app.get('/api/awards', async () => {
    const [data] = await pool.query('SELECT * FROM safety_awards ORDER BY score DESC');
    return { data };
  });

  app.put('/api/awards', { preHandler: [authMiddleware] }, async (request, reply) => {
    const awards = request.body;
    if (!Array.isArray(awards)) {
      return reply.status(400).send({ error: 'Array of award records required' });
    }

    await pool.query('START TRANSACTION');
    try {
      for (const a of awards) {
        await pool.query(
          `INSERT INTO safety_awards (id, score, level) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE score = VALUES(score), level = VALUES(level)`,
          [a.id, a.score || 0, a.level || 'normal']
        );
      }
      await pool.query('COMMIT');
      return { success: true, count: awards.length };
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  });
}
