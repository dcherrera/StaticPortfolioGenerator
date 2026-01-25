# Content Templates

Use these templates to manually add content to your portfolio.

## Project

Copy the entire `project/` folder to `app/public/content/projects/your-project-name/`

```bash
cp -r templates/project app/public/content/projects/my-new-project
```

Then edit:
- `index.md` - Update frontmatter and content
- `config.yaml` - Set your GitHub repo for commit fetching

**Project Status Options:**
- `active` - Currently in development
- `maintained` - Stable, receiving updates
- `paused` - Development on hold
- `archived` - No longer maintained
- `concept` - Idea/prototype stage

## Blog Post

Copy `blog-post.md` to `app/public/content/blog/` with a dated filename:

```bash
cp templates/blog-post.md app/public/content/blog/2024-01-15-my-post-title.md
```

**Filename format:** `YYYY-MM-DD-slug.md`

## Page

Copy `page.md` to `app/public/content/pages/`:

```bash
cp templates/page.md app/public/content/pages/about.md
```

Common pages: `about.md`, `resume.md`, `contact.md`, `uses.md`

## After Adding Content

The manifest auto-generates on build, so just run:

```bash
cd app
npm run dev    # Development
npm run build  # Production
```

Or if using Obsidian, the plugin will update the manifest automatically.
