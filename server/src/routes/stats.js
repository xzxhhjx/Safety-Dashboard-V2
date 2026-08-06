import { pool } from '../db.js';
import { VALID_AREAS } from '../lib/classifier.js';

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

    // Closed count — "跳过", "关闭", "Closed", "已关闭", "Done" all count as closed
    const [[{ closedCount }]] = await pool.query(
      `SELECT COUNT(*) AS closedCount FROM observations ${where}
       ${conditions.length ? 'AND' : 'WHERE'} (
         status LIKE '%Closed%' OR status LIKE '%已关闭%' OR status LIKE '%关闭%'
         OR status LIKE '%跳过%' OR status LIKE '%Done%'
       )`,
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
       GROUP BY COALESCE(NULLIF(ai_category_cn, ''), '其他'), COALESCE(NULLIF(ai_category, ''), 'Others')
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

    // Hazard sub-distribution — raw hazard names grouped by AI category (for accordion list)
    const [hazardSubRaw] = await pool.query(
      `SELECT
         COALESCE(NULLIF(ai_category, ''), 'Others') AS category,
         COALESCE(NULLIF(ai_category_cn, ''), '其他') AS category_cn,
         hazard AS sub_name,
         COUNT(*) AS value
       FROM observations ${where}
       GROUP BY category, category_cn, hazard
       ORDER BY category, value DESC`,
      params
    );
    // Group sub-categories by parent category, push Others last
    const hazardSubDist = [];
    let othersSubs = null;
    for (const row of hazardSubRaw) {
      if (row.category === 'Others') {
        if (!othersSubs) othersSubs = { category: 'Others', category_cn: '其他', subs: [] };
        othersSubs.subs.push({ name: row.sub_name || '(未分类)', value: row.value });
      } else {
        let entry = hazardSubDist.find(e => e.category === row.category);
        if (!entry) {
          entry = { category: row.category, category_cn: row.category_cn, subs: [] };
          hazardSubDist.push(entry);
        }
        entry.subs.push({ name: row.sub_name || '(未分类)', value: row.value });
      }
    }
    if (othersSubs) hazardSubDist.push(othersSubs);

    // Area distribution — normalized to canonical site areas, everything else → Others
    const areaCase = VALID_AREAS.map(a => `WHEN area = '${a}' THEN '${a}'`).join(' ');
    const [areaDist] = await pool.query(
      `SELECT
         CASE ${areaCase} ELSE 'Others' END AS name,
         COUNT(*) AS value
       FROM observations ${where}
       GROUP BY name
       ORDER BY value DESC`,
      params
    );

    // Department ranking
    const [deptRank] = await pool.query(
      `SELECT dept AS name, COUNT(*) AS value FROM observations ${where} GROUP BY dept ORDER BY value DESC`,
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
      `SELECT submitter AS name, COUNT(*) AS value FROM observations ${where} GROUP BY submitter ORDER BY value DESC`,
      params
    );

    // Heatmap data — area × hazard category cross-tabulation
    const [heatmapRaw] = await pool.query(
      `SELECT
         area,
         COALESCE(NULLIF(ai_category, ''), 'Others') AS hazard_category,
         COUNT(*) AS cnt
       FROM observations ${where}
       GROUP BY area, hazard_category
       ORDER BY cnt DESC`,
      params
    );

    // Weekly top submitters (last 7 days, top 5)
    const [weeklySubmitterRank] = await pool.query(
      `SELECT submitter AS name, COUNT(*) AS value FROM observations ${where}
       ${conditions.length ? 'AND' : 'WHERE'} obs_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY submitter ORDER BY value DESC LIMIT 5`,
      params
    );

    return {
      totalCount,
      closedRate: totalCount > 0 ? Math.round((closedCount / totalCount) * 100) : 0,
      areaCount,
      monthNew,
      hazardDist,
      hazardSubDist,
      areaDist,
      deptRank,
      statusDist,
      monthlyTrend,
      submitterRank,
      weeklySubmitterRank,
      heatmapRaw,
    };
  });
}
