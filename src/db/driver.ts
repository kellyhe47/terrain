// SqlDriver: the seam between the repositories and a concrete SQLite engine.
// Sync by design — every domain service is deterministic and synchronous (PRD §1, R66).
export type SqlParam = string | number | null | Uint8Array;
export type Row = Record<string, unknown>;

export interface SqlDriver {
  run(sql: string, params?: SqlParam[]): void;
  all<T extends Row = Row>(sql: string, params?: SqlParam[]): T[];
  get<T extends Row = Row>(sql: string, params?: SqlParam[]): T | undefined;
  transaction<T>(fn: () => T): T;
  /** Flush to durable storage where the engine needs it (sql.js on web). No-op elsewhere. */
  persist(): void;
  close(): void;
}
