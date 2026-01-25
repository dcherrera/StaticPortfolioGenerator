/**
 * Generate manifest.json from content directory structure
 *
 * Scans public/content/ and generates manifest.json automatically.
 * Run before build so you can just add files and deploy.
 */

import * as fs from 'fs'
import * as path from 'path'

const CONTENT_DIR = path.join(__dirname, '../public/content')
const MANIFEST_PATH = path.join(CONTENT_DIR, 'manifest.json')

interface ProjectManifest {
  slug: string
  indexPath: string
  configPath?: string
  posts?: Array<{ path: string }>
}

interface Manifest {
  projects: ProjectManifest[]
  blog: Array<{ path: string }>
  pages: Array<{ path: string }>
}

function getFiles(dir: string, extension: string): string[] {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir)
    .filter(f => f.endsWith(extension))
    .sort()
}

function getDirectories(dir: string): string[] {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir)
    .filter(f => fs.statSync(path.join(dir, f)).isDirectory())
    .sort()
}

function scanProjects(): ProjectManifest[] {
  const projectsDir = path.join(CONTENT_DIR, 'projects')
  const projects: ProjectManifest[] = []

  for (const slug of getDirectories(projectsDir)) {
    const projectDir = path.join(projectsDir, slug)
    const indexPath = path.join(projectDir, 'index.md')

    // Must have index.md
    if (!fs.existsSync(indexPath)) continue

    const project: ProjectManifest = {
      slug,
      indexPath: `/content/projects/${slug}/index.md`
    }

    // Check for config.yaml
    const configPath = path.join(projectDir, 'config.yaml')
    if (fs.existsSync(configPath)) {
      project.configPath = `/content/projects/${slug}/config.yaml`
    }

    // Scan posts directory
    const postsDir = path.join(projectDir, 'posts')
    const postFiles = getFiles(postsDir, '.md')
    if (postFiles.length > 0) {
      project.posts = postFiles.map(f => ({
        path: `/content/projects/${slug}/posts/${f}`
      }))
    }

    projects.push(project)
  }

  return projects
}

function scanBlog(): Array<{ path: string }> {
  const blogDir = path.join(CONTENT_DIR, 'blog')
  return getFiles(blogDir, '.md').map(f => ({
    path: `/content/blog/${f}`
  }))
}

function scanPages(): Array<{ path: string }> {
  const pagesDir = path.join(CONTENT_DIR, 'pages')
  return getFiles(pagesDir, '.md').map(f => ({
    path: `/content/pages/${f}`
  }))
}

function generateManifest(): void {
  const manifest: Manifest = {
    projects: scanProjects(),
    blog: scanBlog(),
    pages: scanPages()
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))

  console.log('Generated manifest.json:')
  console.log(`  - ${manifest.projects.length} projects`)
  console.log(`  - ${manifest.blog.length} blog posts`)
  console.log(`  - ${manifest.pages.length} pages`)
}

generateManifest()
