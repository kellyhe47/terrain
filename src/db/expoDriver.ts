// expo-sqlite driver (iOS / Android). Same sync surface as the sql.js driver.
import type { SqlDriver, SqlParam, Row } from './driver';

export async function openExpoSqlite(name = 'terrain.db'): Promise<SqlDriver> {
  const SQLite = await import('expo-sqlite');
  const db = SQLite.openDatabaseSync(name);
  db.execSync('PRAGMA foreign_keys = ON');
  const driver: SqlDriver = {
    run(sql: string, params: SqlParam[] = []) { db.runSync(sql, params as any); },
    all<T extends Row = Row>(sql: string, params: SqlParam[] = []): T[] { return db.getAllSync<T>(sql, params as any); },
    get<T extends Row = Row>(sql: string, params: SqlParam[] = []): T | undefined { return db.getFirstSync<T>(sql, params as any) ?? undefined; },
    transaction<T>(fn: () => T): T { let out!: T; db.withTransactionSync(() => { out = fn(); }); return out; },
    persist() { /* file-backed */ },
    close() { db.closeSync(); },
  };
  return driver;
}
