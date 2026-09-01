import type { SqlDriver } from './driver';

export const SCHEMA_VERSION = 1;

const DDL = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  goal TEXT NOT NULL, goal_text TEXT NOT NULL DEFAULT '', days_per_week INTEGER NOT NULL, minutes_per_session INTEGER NOT NULL,
  equipment TEXT NOT NULL, activities_json TEXT NOT NULL DEFAULT '[]', recurring_json TEXT NOT NULL DEFAULT '[]',
  injuries_text TEXT NOT NULL DEFAULT '', onboarded INTEGER NOT NULL DEFAULT 0, installed_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS targets (key TEXT PRIMARY KEY, value REAL NOT NULL);
CREATE TABLE IF NOT EXISTS signals (
  date TEXT NOT NULL, type TEXT NOT NULL, value REAL NOT NULL, logged_at TEXT NOT NULL, PRIMARY KEY (date, type)
);
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY, date TEXT NOT NULL, type TEXT NOT NULL, name TEXT NOT NULL, source TEXT NOT NULL,
  minutes INTEGER NOT NULL, intensity TEXT NOT NULL, start_time TEXT, detail TEXT, focus TEXT, distance_mi REAL,
  exercises_json TEXT, intervals INTEGER, paused INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS activities_date ON activities(date);
CREATE TABLE IF NOT EXISTS results (
  activity_id TEXT PRIMARY KEY REFERENCES activities(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL, done_count INTEGER, total_count INTEGER, minutes INTEGER, distance_mi REAL,
  difficulty INTEGER, pain INTEGER, pain_where TEXT, note TEXT, sets_json TEXT, subtitle_note TEXT, logged_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS meals (
  id TEXT PRIMARY KEY, date TEXT NOT NULL, time TEXT NOT NULL, name TEXT NOT NULL, image_uri TEXT, confidence TEXT,
  items_json TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS meals_date ON meals(date);
CREATE TABLE IF NOT EXISTS supplements (id TEXT PRIMARY KEY, name TEXT NOT NULL, dose TEXT NOT NULL, nutrient_key TEXT, sort INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS supplement_takes (supplement_id TEXT NOT NULL REFERENCES supplements(id) ON DELETE CASCADE, date TEXT NOT NULL, taken INTEGER NOT NULL, PRIMARY KEY (supplement_id, date));
CREATE TABLE IF NOT EXISTS memory (id TEXT PRIMARY KEY, type TEXT NOT NULL, text TEXT NOT NULL, date TEXT NOT NULL, tags_json TEXT NOT NULL DEFAULT '[]', resolved INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS prs (id TEXT PRIMARY KEY, activity TEXT NOT NULL, kind TEXT NOT NULL, result TEXT NOT NULL, date TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS chat_messages (id TEXT PRIMARY KEY, role TEXT NOT NULL, text TEXT NOT NULL, card_json TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS plan_weeks (week_start TEXT PRIMARY KEY, status TEXT NOT NULL, summary TEXT NOT NULL DEFAULT '', rest_reason TEXT NOT NULL DEFAULT '', generated_at TEXT NOT NULL);
`;

export function migrate(db: SqlDriver): void {
  db.transaction(() => {
    for (const stmt of DDL.split(';').map((s) => s.trim()).filter(Boolean)) db.run(stmt);
    db.run('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', ['schema_version', String(SCHEMA_VERSION)]);
  });
}

export const ALL_TABLES = ['meta', 'profile', 'targets', 'signals', 'activities', 'results', 'meals', 'supplements', 'supplement_takes', 'memory', 'prs', 'chat_messages', 'plan_weeks'];

export function wipe(db: SqlDriver): void {
  db.transaction(() => { for (const t of ALL_TABLES) db.run(`DELETE FROM ${t}`); });
}
