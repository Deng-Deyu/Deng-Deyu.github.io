# Turtlelet 个人网站 — 完整部署指南

## 架构总览

```
Cloudflare Pages          Cloudflare Worker          Cloudflare R2
(前端 React 静态页面)  →   (API + 鉴权 + 代理)   →   (PDF/音频/图片文件)
        ↓                          ↓
  GitHub 仓库             Cloudflare D1
  (自动 CI/CD)            (SQLite 数据库)
```

---

## 第一步：安装 Wrangler CLI

```bash
npm install -g wrangler
wrangler login   # 用浏览器登录你的 Cloudflare 账号
```

---

## 第二步：创建 D1 数据库

```bash
# 创建数据库
wrangler d1 create turtlelet-db

# 命令输出里会有这一行，复制 database_id：
# [[d1_databases]]
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# 把这个 ID 填入 wrangler.toml 的 database_id 字段

# 运行 schema 初始化数据库表
wrangler d1 execute turtlelet-db --file=worker/schema.sql
```

---

## 第三步：创建 R2 存储桶

```bash
wrangler r2 bucket create turtlelet-files
```

---

## 第四步：设置 Worker 环境变量（密钥）

在 Cloudflare Dashboard → Workers & Pages → turtlelet-api → Settings → Variables，
添加以下**加密**环境变量：

| 变量名           | 值                                      |
|------------------|-----------------------------------------|
| `JWT_SECRET`     | 随机长字符串，例如用 `openssl rand -hex 32` 生成 |
| `ADMIN_PASSWORD` | 你的管理员密码（自定义，不要太简单）    |
| `ALLOWED_ORIGIN` | `https://deng-deyu.github.io`（你的网站域名）|

---

## 第五步：部署 Cloudflare Worker

```bash
# 在项目根目录
wrangler deploy
```

部署成功后会显示 Worker URL，格式为：
`https://turtlelet-api.YOUR-SUBDOMAIN.workers.dev`

---

## 第六步：配置前端环境变量

### 本地开发：
```bash
cp .env.example .env.local
# 编辑 .env.local，填入上面得到的 Worker URL
```

### 生产（Cloudflare Pages）：
在 Cloudflare Dashboard → Pages → Deng-Deyu.github.io → Settings → Environment Variables，添加：

| 变量名           | 值                                            |
|------------------|-----------------------------------------------|
| `VITE_API_BASE`  | `https://turtlelet-api.YOUR-SUBDOMAIN.workers.dev` |

---

## 第七步：推送代码到 GitHub

```bash
git add .
git commit -m "feat: React + Cloudflare full-stack site"
git push origin main
```

Cloudflare Pages 会自动触发构建（已连接 GitHub 仓库）。

---

## 本地开发

```bash
npm install
npm run dev          # 启动 Vite 开发服务器 → http://localhost:5173

# Worker 本地调试（可选）
wrangler dev worker/index.ts --local
```

---

## 日常使用：管理员操作

### 登录
1. 访问你的网站
2. 点击右上角 🛡️ 图标
3. 输入 `ADMIN_PASSWORD`（你在第四步设置的密码）
4. 登录后，所有区块会出现 **铅笔 ✏️ / 删除 🗑️ / + 添加** 按钮

### 添加笔记
- 点击笔记区的「+ Add note」
- 填写中英文标题、描述、分类、标签
- 上传 PDF 或 .md 文件
- 保存 → 卡片立即出现

### 添加音乐
- 点击「+ Add piece」
- 上传乐谱 PDF 和音频文件（mp3/wav/flac）
- 访客可点击 ▶ 试听、↓ 下载乐谱

### 查看文件
- 访客点击任意笔记卡片 → 跳转到 `/view/:id`
- PDF 直接在浏览器内渲染
- Markdown 渲染为格式化文章

---

## 文件结构说明

```
turtlelet-site/
├── index.html                  # 入口 HTML
├── vite.config.ts              # Vite 配置
├── wrangler.toml               # Cloudflare Worker 配置
├── worker/
│   ├── index.ts                # API Worker（路由、鉴权、R2 代理）
│   └── schema.sql              # D1 数据库 Schema
└── src/
    ├── main.tsx                # React 入口
    ├── App.tsx                 # 路由根组件
    ├── styles/
    │   └── globals.css         # CSS 变量 + 全局样式
    ├── types/
    │   └── index.ts            # TypeScript 类型定义
    ├── store/
    │   └── index.ts            # Zustand 全局状态（lang/theme/auth）
    ├── lib/
    │   └── api.ts              # API 请求封装
    ├── hooks/
    │   └── useScrollReveal.ts  # 滚动动画 hook
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx       # 导航栏（语言/主题/登录）
    │   │   └── Footer.tsx       # 页脚
    │   ├── admin/
    │   │   ├── LoginModal.tsx   # 管理员登录弹窗
    │   │   └── CardEditor.tsx   # 通用卡片编辑器（新增/编辑）
    │   └── sections/
    │       ├── HeroSection.tsx      # 首页 Hero
    │       ├── JourneySection.tsx   # 心路历程 + 时间轴
    │       ├── NotesSection.tsx     # 笔记（分类筛选 + 跳转文件查看）
    │       ├── MusicSection.tsx     # 音乐（试听 + 下载乐谱）
    │       ├── VideosSection.tsx    # 视频（抖音 + B 站链接）
    │       ├── ModelingSection.tsx  # 建模（预览图 + 下载）
    │       ├── HonorsSection.tsx    # 荣誉
    │       └── ContactSection.tsx  # 联系方式
    └── pages/
        ├── HomePage.tsx        # 首页（组合所有 Section）
        └── FileViewer.tsx      # 文件查看页（PDF / Markdown）
```

---

## 更新网站内容（迭代）

| 想做什么 | 操作 |
|----------|------|
| 添加新笔记/荣誉/模型 | 登录后在 UI 点击「+」按钮 |
| 修改卡片内容 | 登录后点击 ✏️ 编辑 |
| 删除内容 | 登录后点击 🗑️ |
| 修改个人简介 | 编辑 `JourneySection.tsx` 里的文字 |
| 新增联系方式 | 编辑 `ContactSection.tsx` 的 `CONTACT_LINKS` 数组 |
| 修改视频平台链接 | 编辑 `VideosSection.tsx` 的 `PLATFORMS` 数组 |
| 修改网站配色 | 编辑 `globals.css` 里的 CSS 变量 |
| 新增笔记分类 | 在 `CardEditor.tsx` 的 category options + `NotesSection.tsx` 的 CATEGORIES 里各加一行 |

---

## 云存储方案说明

| 需求 | 推荐服务 | 免费额度 |
|------|----------|---------|
| **PDF / 音频 / 图片**（当前已用）| Cloudflare R2 | 10 GB 存储，每月 100 万次请求 |
| **数据库**（当前已用） | Cloudflare D1 | 5 GB，每天 500 万次读 |
| **大型视频文件** | Cloudflare Stream 或 B 站/抖音 | Stream 按量计费；B 站/抖音免费 |
| **代码/项目备份** | GitHub（已有）| 无限公开仓库 |
| **大型附件（>10GB）** | Backblaze B2 | 10 GB 免费，超出 $0.006/GB |

---

## 常见问题

**Q：登录后刷新页面需要重新登录吗？**
A：不需要，Token 存在 localStorage，有效期 24 小时。

**Q：上传文件大小限制？**
A：Cloudflare Workers 单次请求限制 100MB（免费版）。对于大型音频/视频，建议上传到 B 站/抖音，然后在网站放外链。

**Q：访客能下载我的文件吗？**
A：能，这是设计如此——文件查看和下载是公开的，只有**添加/修改/删除**需要管理员权限。如果你想限制下载，可以在 Worker 的 `/api/file/` 路由加上 token 校验。

**Q：如何修改 API 域名（Worker URL）？**
A：在 Cloudflare Pages 的环境变量里修改 `VITE_API_BASE`，然后重新触发一次构建（push 任意 commit）。
