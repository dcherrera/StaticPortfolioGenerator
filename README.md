# Static Portfolio Generator

A markdown-driven static site generator for developer portfolios. Write your content in markdown, manage it with Obsidian (or any editor), and deploy anywhere.

## Features

- **Markdown as source of truth** - All content lives as markdown files in git
- **GitHub integration** - Auto-fetch commits and READMEs from your repositories
- **Obsidian plugin** - Visual content management with project creation, commit curation, and site structure overview
- **Project showcases** - Display projects with status badges, tech tags, and commit activity
- **Private repo support** - Works with private repositories (hides source links, shows lock icon)
- **Dark mode** - Because we're developers
- **Deploy anywhere** - Vercel, Netlify, or self-hosted with Docker

## Getting Started

### 1. Fork the Repository

**Important:** Fork, don't clone directly. This will be your portfolio's repo.

1. Click "Fork" on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/StaticPortfolioGenerator.git
   cd StaticPortfolioGenerator
   ```

### 2. Security Setup

Your GitHub token and other secrets should **never** be committed. The `.gitignore` is pre-configured to protect you, but verify:

**Protected by .gitignore:**
- `.env` and `.env.*` files
- `.obsidian/plugins/*/data.json` (contains plugin settings including your token)
- `app/public/_data/` (build-time data)

**Safe places for your token:**
- **Local development**: Obsidian plugin settings (stored in `data.json`, gitignored)
- **Vercel/Netlify**: Environment variables in dashboard (never in code)
- **Self-hosted**: Environment variables or secrets manager

**Never do this:**
```bash
# WRONG - token in code
GITHUB_TOKEN="ghp_xxxxx" # Don't put this in any tracked file!
```

### 3. Install and Run

```bash
cd app
npm install
npm run dev
```

Visit http://localhost:9000

### 4. Add Your Content

**Option A: Use Obsidian (Recommended)**

1. Open the repo root as a vault in Obsidian
2. Enable "Static Portfolio Generator" plugin in Settings → Community Plugins
3. Configure your GitHub token in plugin settings
4. Use the Site Structure panel to create projects

**Option B: Edit Files Directly**

Use the templates in the `templates/` folder as starting points:

```bash
# Add a new project
cp -r templates/project app/public/content/projects/my-project

# Add a blog post
cp templates/blog-post.md app/public/content/blog/2024-01-15-my-post.md

# Add a page
cp templates/page.md app/public/content/pages/about.md
```

Or just add markdown files to the right directories:

```
app/public/content/
├── projects/
│   └── my-project/
│       ├── index.md      # Required - project page
│       └── config.yaml   # Optional - GitHub repo settings
├── blog/
│   └── 2024-01-15-post.md
└── pages/
    └── about.md
```

The manifest is auto-generated on build - no manual tracking needed.

### 5. Deploy

Push to your fork. Set up Vercel/Netlify to build from your repo (see Deployment section below).

## Obsidian Plugin

The plugin provides a visual interface for managing your portfolio content.

### Features

- **Site Structure Panel** - View all projects, blog posts, and pages in one place
- **Create Content** - Click "+" buttons to create new projects, posts, or pages
- **Delete Content** - Remove projects, posts, or pages with confirmation
- **Project Creation** - Select from your GitHub repos, auto-pulls README and images
- **Commit Curation** - Hide/show commits per project
- **Git Integration** - Stage, commit, and push changes directly from Obsidian
- **Code File Editing** - Edit .vue, .ts, .js, and other code files directly in Obsidian

### Commands

| Command | Description |
|---------|-------------|
| New Project | Create a new project from a GitHub repo |
| New Blog Post | Create a new blog post |
| New Page | Create a new static page |
| Pull README | Pull README from GitHub into current project |
| Refresh Commits | Fetch latest commits from GitHub |
| Open Site Structure | Open the site structure panel |
| Open Commit Curation | Open the commit curation panel |
| Open Git | Open the git panel for staging/committing/pushing |

### Setup

1. Get a GitHub Personal Access Token with `repo` scope
2. Open plugin settings and paste the token
3. Use the Site Structure panel or commands to manage content

## Content Structure

```
content/
├── projects/
│   └── my-project/
│       ├── index.md          # Project page (frontmatter + content)
│       ├── config.yaml       # GitHub repo settings
│       └── posts/            # Project updates
│           └── 2024-01-15-update.md
├── blog/
│   └── 2024-01-15-post.md    # Blog posts
└── pages/
    ├── about.md              # Static pages
    └── resume.md
```

### Project Frontmatter

```yaml
---
title: My Project
tagline: A short description
status: active          # active | maintained | paused | archived | concept
featured: true          # Show on homepage
order: 1                # Sort order
tech:
  - TypeScript
  - Vue
private: true           # Hide source link, show lock icon
links:
  repo: https://github.com/user/repo
  demo: https://myproject.com
---
```

### Project Config (config.yaml)

```yaml
repo: owner/repo-name
commitsLimit: 20
hiddenCommits:
  - abc123    # SHA of commits to hide
```

## Markdown Components

Use HTML within your markdown pages to add interactive elements.

### Buttons

```html
<a href="/projects" class="btn">Default Button</a>
<a href="/projects" class="btn btn-primary">Primary Button</a>
<a href="/about" class="btn btn-secondary">Secondary Button</a>
<a href="/contact" class="btn btn-success">Success Button</a>
```

**Button group** (horizontal layout):

```html
<div class="btn-group">
  <a href="/projects" class="btn btn-primary">View Projects</a>
  <a href="/about" class="btn">Learn More</a>
  <a href="https://github.com" class="btn btn-secondary">GitHub</a>
</div>
```

### Card Grid

For product pages, team members, or any grid layout:

```html
<div class="card-grid">
  <div class="card">
    <h4>Product One</h4>
    <p>Description of the product.</p>
    <a href="/products/one" class="btn btn-primary">View</a>
  </div>
  <div class="card">
    <h4>Product Two</h4>
    <p>Another product description.</p>
    <a href="/products/two" class="btn btn-primary">View</a>
  </div>
</div>
```

Cards auto-arrange in a responsive grid (minimum 250px per card).

## Deployment

### Vercel (Recommended)

1. Connect your forked repo to Vercel
2. Set **Root Directory** to `app`
3. Add environment variable in Vercel Dashboard:
   - Name: `GITHUB_TOKEN`
   - Value: Your GitHub Personal Access Token with `repo` scope
4. Deploy - build settings are auto-configured via `vercel.json`

Vercel will rebuild on each push to main.

### Netlify

1. Connect your forked repo to Netlify
2. Set **Base directory** to `app`
3. Add environment variable `GITHUB_TOKEN` in Netlify Dashboard
4. Configure build:
   - Build command: `npm run build`
   - Publish directory: `dist/spa`

### Self-Hosted (Docker)

**Option 1: Using docker-compose (Recommended)**

```bash
cd app

# Create .env file with your token (this file is gitignored)
echo "GITHUB_TOKEN=ghp_your_token_here" > .env

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

**Option 2: Using docker directly**

```bash
cd app

# Build with GitHub token for commit fetching
docker build --build-arg GITHUB_TOKEN=ghp_your_token_here -t portfolio .

# Or build without commits (simpler, no token needed)
docker build -t portfolio .

# Run the container
docker run -d --name portfolio -p 80:80 portfolio

# Stop and remove
docker stop portfolio && docker rm portfolio
```

The site will be available at http://localhost (port 80).

### Auto-Update Commits (Self-Hosted)

Set up a cron job for daily rebuilds. Store your token securely (e.g., in a file with restricted permissions, not in crontab):

```bash
# /etc/cron.d/portfolio-rebuild
0 6 * * * root /path/to/scripts/rebuild.sh >> /var/log/portfolio.log 2>&1
```

In `rebuild.sh`, source your token from a secure location:
```bash
source /etc/portfolio/.env  # Contains GITHUB_TOKEN=ghp_xxx
```

See `scripts/rebuild.sh` for the full script.

## Development

### Site Generator (Quasar)

```bash
cd app
npm install
npm run dev              # Development server (auto-generates manifest)
npm run build            # Production build (auto-generates manifest)
npm run generate-manifest  # Manually regenerate content manifest
npm run fetch-commits    # Fetch commits from GitHub
```

### Obsidian Plugin

```bash
cd obsidian-plugin
npm install
npm run dev         # Watch mode
npm run build       # Production build
```

## Tech Stack

- **Site**: Quasar Framework (Vue 3) with SSG
- **Markdown**: markdown-it with syntax highlighting (Shiki)
- **GitHub API**: Octokit
- **Plugin**: Obsidian API

## License

MIT
