-- ============================================================
--  Turtlelet D1 Schema
--  运行方式: wrangler d1 execute turtlelet-db --file=worker/schema.sql
-- ============================================================

-- 时间轴 / 心路历程
CREATE TABLE IF NOT EXISTS timeline (
  id          TEXT PRIMARY KEY,
  year        TEXT NOT NULL,
  title_en    TEXT NOT NULL,
  title_zh    TEXT NOT NULL,
  desc_en     TEXT NOT NULL DEFAULT '',
  desc_zh     TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- 笔记卡片
CREATE TABLE IF NOT EXISTS notes (
  id          TEXT PRIMARY KEY,
  title_en    TEXT NOT NULL,
  title_zh    TEXT NOT NULL,
  desc_en     TEXT NOT NULL DEFAULT '',
  desc_zh     TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT 'other',  -- mathematics|engineering|cs|physics|chemistry|other
  tags        TEXT NOT NULL DEFAULT '[]',      -- JSON array string
  file_key    TEXT,                            -- R2 key
  file_type   TEXT,                            -- 'pdf' | 'markdown'
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- 音乐卡片
CREATE TABLE IF NOT EXISTS music (
  id          TEXT PRIMARY KEY,
  title_en    TEXT NOT NULL,
  title_zh    TEXT NOT NULL,
  instrument  TEXT NOT NULL DEFAULT '',
  pages       INTEGER NOT NULL DEFAULT 0,
  sheet_key   TEXT,                            -- R2 key for PDF
  audio_key   TEXT,                            -- R2 key for audio
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- 建模卡片
CREATE TABLE IF NOT EXISTS models (
  id          TEXT PRIMARY KEY,
  title_en    TEXT NOT NULL,
  title_zh    TEXT NOT NULL,
  desc_en     TEXT NOT NULL DEFAULT '',
  desc_zh     TEXT NOT NULL DEFAULT '',
  software    TEXT NOT NULL DEFAULT '',
  preview_key TEXT,                            -- R2 key for preview image
  file_key    TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- 荣誉卡片
CREATE TABLE IF NOT EXISTS honors (
  id          TEXT PRIMARY KEY,
  title_en    TEXT NOT NULL,
  title_zh    TEXT NOT NULL,
  org_en      TEXT NOT NULL DEFAULT '',
  org_zh      TEXT NOT NULL DEFAULT '',
  year        INTEGER NOT NULL,
  emoji       TEXT NOT NULL DEFAULT '🏆',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category);
CREATE INDEX IF NOT EXISTS idx_notes_created  ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_music_created  ON music(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_models_created ON models(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_honors_year    ON honors(year DESC);
