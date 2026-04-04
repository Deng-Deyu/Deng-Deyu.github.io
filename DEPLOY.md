# Turtlelet Site v6 - Deploy Guide

## 1. Update D1 Database
```powershell
wrangler d1 execute turtlelet-db --file=worker/schema.sql
```

### Migration from v5 (if upgrading, not fresh install):
```powershell
# Add parent_id to note_categories
wrangler d1 execute turtlelet-db --command="ALTER TABLE note_categories ADD COLUMN parent_id TEXT"

# Add url to models
wrangler d1 execute turtlelet-db --command="ALTER TABLE models ADD COLUMN url TEXT NOT NULL DEFAULT ''"

# Create note_files table
wrangler d1 execute turtlelet-db --command="CREATE TABLE IF NOT EXISTS note_files (id TEXT PRIMARY KEY, note_id TEXT NOT NULL, file_key TEXT NOT NULL, file_type TEXT NOT NULL DEFAULT 'pdf', filename TEXT NOT NULL DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0)"

# Create index
wrangler d1 execute turtlelet-db --command="CREATE INDEX IF NOT EXISTS idx_note_files_note ON note_files(note_id)"
```

## 2. Deploy Worker
```powershell
wrangler deploy
```

## 3. Set Worker Environment Variables (Cloudflare Dashboard)
- JWT_SECRET = (any long random string)
- ADMIN_PASSWORD = (your admin password)
- ALLOWED_ORIGIN = https://deng-deyu-github-io.pages.dev
- RESEND_API_KEY = re_xxxxxxxxxx (from resend.com)
- ADMIN_EMAIL = 3288979284@qq.com
- NOTIFY_FROM = onboarding@resend.dev

## 4. Push to GitHub (Cloudflare Pages auto-deploys)
```powershell
git add -A
git commit -m "feat: v6 - multi-file notes, 3-level categories, GrabCAD models, animated BG, kaiti font"
git push origin main --force
```
