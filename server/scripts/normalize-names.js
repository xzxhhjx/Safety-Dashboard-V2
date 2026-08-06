/**
 * Submitter name normalization migration script.
 *
 * Reads every observation, re-runs normalizeSubmitter(),
 * and UPDATEs only rows where the name changed.
 *
 * Usage: node scripts/normalize-names.js
 */

import mysql from 'mysql2/promise';
import { normalizeSubmitter } from '../src/lib/classifier.js';

const DB = {
  host: '127.0.0.1',
  port: 13306,
  user: 'safety',
  password: 'iahjx@iahjx',
  database: 'safety_dashboard',
};

async function main() {
  const conn = await mysql.createConnection(DB);
  console.log('Connected to MySQL');

  // 1. Fetch all records
  const [rows] = await conn.query('SELECT id, submitter FROM observations');
  console.log(`Fetched ${rows.length} records`);

  // 2. Normalize and diff
  const updates = [];
  const stats = {};

  for (const row of rows) {
    const oldName = row.submitter || '';
    const newName = normalizeSubmitter(oldName);

    if (oldName !== newName) {
      updates.push({ id: row.id, old: oldName, new: newName });
      const key = `${oldName} → ${newName}`;
      stats[key] = (stats[key] || 0) + 1;
    }
  }

  console.log(`\n${updates.length} records need updating:\n`);

  for (const [key, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${key}: ${count}`);
  }

  if (updates.length === 0) {
    console.log('\nNothing to update.');
    await conn.end();
    return;
  }

  // 3. Apply updates in batches
  const BATCH = 500;
  let done = 0;

  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH);
    const cases = batch.map(u => `WHEN id = '${u.id.replace(/'/g, "''")}' THEN '${u.new.replace(/'/g, "''")}'`).join(' ');
    const ids = batch.map(u => `'${u.id.replace(/'/g, "''")}'`).join(', ');

    await conn.query(
      `UPDATE observations SET submitter = CASE ${cases} ELSE submitter END WHERE id IN (${ids})`
    );
    done += batch.length;
    console.log(`  Progress: ${done}/${updates.length}`);
  }

  console.log(`\nDone. ${updates.length} records updated.`);
  await conn.end();
}

main().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
