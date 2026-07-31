import { pool } from '../db.js';

export default async function statsRoutes(app) {
  app.get('/api/observations/stats', async (request, reply) => {
    const { status, area, hazard, startDate, endDate } = request.query;

    const conditions = [];
    const params = [];

    if (status) { conditions.push('status = ?'); params.push(status); }
    if (area) { conditions.push('area = ?'); params.push(area); }
    if (hazard) { conditions.push('hazard = ?'); params.push(hazard); }
    if (startDate) { conditions.push('obs_time >= ?'); params.push(startDate); }
    if (endDate) { conditions.push('obs_time <= ?'); params.push(endDate); }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Total count
    const [[{ totalCount }]] = await pool.query(`SELECT COUNT(*) AS totalCount FROM observations ${where}`, params);

    // Closed count
    const [[{ closedCount }]] = await pool.query(
      `SELECT COUNT(*) AS closedCount FROM observations ${where} ${conditions.length ? 'AND' : 'WHERE'} status IN ('Closed', '已关闭', 'Done')`,
      params
    );

    // Active areas
    const [[{ areaCount }]] = await pool.query(
      `SELECT COUNT(DISTINCT area) AS areaCount FROM observations ${where}`,
      params
    );

    // This month new
    const [[{ monthNew }]] = await pool.query(
      `SELECT COUNT(*) AS monthNew FROM observations ${where}
       ${conditions.length ? 'AND' : 'WHERE'} MONTH(obs_time) = MONTH(CURDATE()) AND YEAR(obs_time) = YEAR(CURDATE())`,
      params
    );

    // Hazard distribution — grouped by AI category (falls back to 其他 for unclassified)
    const [hazardDistRaw] = await pool.query(
      `SELECT
         COALESCE(NULLIF(ai_category_cn, ''), '其他') AS name,
         COALESCE(NULLIF(ai_category, ''), 'Others') AS category,
         COUNT(*) AS value
       FROM observations ${where}
       GROUP BY name, category
       ORDER BY value DESC`,
      params
    );
    // Push "其他 / Others" to the end
    const hazardDist = [];
    let othersEntry = null;
    for (const row of hazardDistRaw) {
      if (row.category === 'Others') { othersEntry = row; }
      else { hazardDist.push(row); }
    }
    if (othersEntry) hazardDist.push(othersEntry);

    // Area distribution
    const [areaDist] = await pool.query(
      `SELECT area AS name, COUNT(*) AS value FROM observations ${where} GROUP BY area ORDER BY value DESC`,
      params
    );

    // Department ranking
    const [deptRank] = await pool.query(
      `SELECT dept AS name, COUNT(*) AS value FROM observations ${where} GROUP BY dept ORDER BY value DESC LIMIT 10`,
      params
    );

    // Status distribution
    const [statusDist] = await pool.query(
      `SELECT status AS name, COUNT(*) AS value FROM observations ${where} GROUP BY status`,
      params
    );

    // Monthly trend
    const [monthlyTrend] = await pool.query(
      `SELECT DATE_FORMAT(obs_time, '%Y-%m') AS month, COUNT(*) AS count
       FROM observations ${where} GROUP BY month ORDER BY month ASC`,
      params
    );

    // Submitter ranking
    const [submitterRank] = await pool.query(
      `SELECT submitter AS name, COUNT(*) AS value FROM observations ${where} GROUP BY submitter ORDER BY value DESC LIMIT 10`,
      params
    );

    return {
      totalCount,
      closedRate: totalCount > 0 ? Math.round((closedCount / totalCount) * 100) : 0,
      areaCount,
      monthNew,
      hazardDist,
      areaDist,
      deptRank,
      statusDist,
      monthlyTrend,
      submitterRank,
    };
  });
}
