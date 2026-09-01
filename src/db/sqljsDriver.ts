// sql.js (asm.js build — no wasm file to serve) driver. Used on web and in node tests.
import type { SqlDriver, SqlParam, Row } from './driver';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const initSqlJs: (cfg?: object) => Promise<any> = require('sql.js/dist/sql-asm.js');

let SQL: any | null = null;
async function engine() {
  if (!SQL) SQL = await initSqlJs({});
  return SQL;
}

export interface SqlJsOptions {
  /** Load an existing database image (e.g. from localStorage). */
  image?: Uint8Array | null;
  /** Called (debounced) after writes with the exported image. */
  onPersist?: (image: Uint8Array) => void;
}

export async function openSqlJs(opts: SqlJsOptions = {}): Promise<SqlDriver> {
  const E = await engine();
  const db = opts.image ? new E.Database(opts.image) : new E.Database();
  db.run('PRAGMA foreign_keys = ON');
  let depth = 0;
  let dirty = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const schedule = () => {
    if (!opts.onPersist) return;
    dirty = true;
    if (timer) return;
    timer = setTimeout(() => { timer = null; persist(); }, 150);
  };
  const persist = () => {
    if (!opts.onPersist || !dirty) return;
    dirty = false;
    opts.onPersist(db.export());
  };
  const driver: SqlDriver = {
    run(sql: string, params: SqlParam[] = []) { db.run(sql, params as any); schedule(); },
    all<T extends Row = Row>(sql: string, params: SqlParam[] = []): T[] {
      const stmt = db.prepare(sql);
      try {
        stmt.bind(params as any);
        const rows: T[] = [];
        while (stmt.step()) rows.push(stmt.getAsObject() as T);
        return rows;
      } finally { stmt.free(); }
    },
    get<T extends Row = Row>(sql: string, params: SqlParam[] = []): T | undefined { return driver.all<T>(sql, params)[0]; },
    transaction<T>(fn: () => T): T {
      if (depth > 0) return fn(); // nested: join the outer transaction
      db.run('BEGIN'); depth++;
      try { const r = fn(); db.run('COMMIT'); schedule(); return r; }
      catch (e) { db.run('ROLLBACK'); throw e; }
      finally { depth--; }
    },
    persist() { if (timer) { clearTimeout(timer); timer = null; } persist(); },
    close() { driver.persist(); db.close(); },
  };
  return driver;
}
