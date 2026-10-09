// Prints visitors' "what should we add?" notes, newest first. Usage: npm run suggestions [-- 50]
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const file = join(process.env.DATA_DIR || join(process.cwd(), 'data'), 'ektukhani.db');
const limit = Number(process.argv[2]) || 30;
let rows = [];
try {
  rows = new DatabaseSync(file, { readOnly: true }).prepare('SELECT tool, text, created_at FROM suggestions ORDER BY id DESC LIMIT ?').all(limit);
} catch {
  console.log(`No suggestions yet (${file} not found).`);
}
for (const row of rows) console.log(`${new Date(row.created_at).toISOString().slice(0, 16)}  [${row.tool}]  ${row.text}`);
