-- Turtlelet D1 Schema v4
-- wrangler d1 execute turtlelet-db --file=worker/schema.sql

CREATE TABLE IF NOT EXISTS timeline (
  id TEXT PRIMARY KEY, year TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '', title_zh TEXT NOT NULL DEFAULT '',
  desc_en TEXT NOT NULL DEFAULT '', desc_zh TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS note_categories (
  id TEXT PRIMARY KEY, name_en TEXT NOT NULL, name_zh TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📄', sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY, title_en TEXT NOT NULL, title_zh TEXT NOT NULL,
  desc_en TEXT NOT NULL DEFAULT '', desc_zh TEXT NOT NULL DEFAULT '',
  category_id TEXT NOT NULL DEFAULT 'other',
  tags TEXT NOT NULL DEFAULT '[]', file_key TEXT, file_type TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS resource_links (
  id TEXT PRIMARY KEY, title_en TEXT NOT NULL, title_zh TEXT NOT NULL,
  url TEXT NOT NULL, desc_en TEXT NOT NULL DEFAULT '', desc_zh TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '🔗', sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS songs (
  id TEXT PRIMARY KEY, title_en TEXT NOT NULL, title_zh TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT '', album TEXT NOT NULL DEFAULT '',
  audio_key TEXT, cover_key TEXT, duration INTEGER NOT NULL DEFAULT 0,
  review TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY, title_en TEXT NOT NULL, title_zh TEXT NOT NULL,
  composer TEXT NOT NULL DEFAULT '', score_type TEXT NOT NULL DEFAULT 'mixed',
  file_key TEXT, file_type TEXT, preview_key TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY, title_en TEXT NOT NULL, title_zh TEXT NOT NULL,
  desc_en TEXT NOT NULL DEFAULT '', desc_zh TEXT NOT NULL DEFAULT '',
  software TEXT NOT NULL DEFAULT '', preview_key TEXT, file_key TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS honors (
  id TEXT PRIMARY KEY, title_en TEXT NOT NULL, title_zh TEXT NOT NULL,
  org_en TEXT NOT NULL DEFAULT '', org_zh TEXT NOT NULL DEFAULT '',
  year INTEGER NOT NULL, emoji TEXT NOT NULL DEFAULT '🏆',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY, title_en TEXT NOT NULL, title_zh TEXT NOT NULL,
  desc_en TEXT NOT NULL DEFAULT '', desc_zh TEXT NOT NULL DEFAULT '',
  is_open_source INTEGER NOT NULL DEFAULT 0,
  tech_stack TEXT NOT NULL DEFAULT '', version TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '', preview_key TEXT,
  tab TEXT NOT NULL DEFAULT 'mine',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS guest_requests (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  email TEXT NOT NULL,
  contact TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_notes_cat      ON notes(category_id);
CREATE INDEX IF NOT EXISTS idx_songs_artist   ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_scores_type    ON scores(score_type);
CREATE INDEX IF NOT EXISTS idx_projects_tab   ON projects(tab);
CREATE INDEX IF NOT EXISTS idx_guests_status  ON guest_requests(status);

-- Alter existing songs table to add review column (safe with IF NOT EXISTS workaround)
-- If songs table already exists without review, run this manually:
-- ALTER TABLE songs ADD COLUMN review TEXT NOT NULL DEFAULT '';

INSERT OR IGNORE INTO note_categories (id,name_en,name_zh,icon,sort_order) VALUES
  ('mathematics','Mathematics','数学','📐',0),('engineering','Engineering','工程','⚙️',1),
  ('cs','CS / Code','计算机','💻',2),('physics','Physics','物理','⚛️',3),
  ('chemistry','Chemistry','化学','🧪',4),('other','Other','其他','📄',5);
