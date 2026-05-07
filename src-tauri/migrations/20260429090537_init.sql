-- Add migration script here
CREATE TABLE IF NOT EXISTS holiday (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    year TEXT NOT NULL,
    date TEXT NOT NULL UNIQUE,
    name TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
