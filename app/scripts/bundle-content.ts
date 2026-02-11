/**
 * Bundle Content Script
 *
 * Reads all content files discovered by manifest.json and bundles them
 * into a single content-bundle.json file. This reduces ~45 HTTP requests
 * at runtime down to 1, dramatically improving load time.
 *
 * Run after generate-manifest in the build pipeline.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const CONTENT_DIR = join(__dirname, '../public/content')
const DATA_DIR = join(__dirname, '../public/_data')
const MANIFEST_PATH = join(CONTENT_DIR, 'manifest.json')
const BUNDLE_PATH = join(__dirname, '../public/content-bundle.json')

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

interface BundledProject {
  slug: string
  indexRaw: string
  configRaw?: string
  posts: Array<{ filename: string; raw: string }>
}

interface ContentBundle {
  siteConfig: string
  commitsCache: Record<string, unknown>
  projects: BundledProject[]
  blog: Array<{ filename: string; raw: string }>
  pages: Array<{ filename: string; raw: string }>
}

function readContentFile(webPath: string): string | null {
  const fsPath = join(__dirname, '../public', webPath)
  if (!existsSync(fsPath)) {
    console.warn(`  Warning: ${webPath} not found`)
    return null
  }
  return readFileSync(fsPath, 'utf-8')
}

function bundleContent(): void {
  if (!existsSync(MANIFEST_PATH)) {
    console.error('manifest.json not found. Run generate-manifest first.')
    process.exit(1)
  }

  const manifest: Manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'))

  // Site config
  const siteConfigPath = join(CONTENT_DIR, 'site.yaml')
  const siteConfig = existsSync(siteConfigPath)
    ? readFileSync(siteConfigPath, 'utf-8')
    : ''

  // Commits cache
  const commitsCachePath = join(DATA_DIR, 'commits-cache.json')
  const commitsCache = existsSync(commitsCachePath)
    ? JSON.parse(readFileSync(commitsCachePath, 'utf-8'))
    : {}

  // Projects
  const projects: BundledProject[] = []
  for (const proj of manifest.projects) {
    const indexRaw = readContentFile(proj.indexPath)
    if (!indexRaw) continue

    const bundled: BundledProject = {
      slug: proj.slug,
      indexRaw,
      posts: []
    }

    if (proj.configPath) {
      const configRaw = readContentFile(proj.configPath)
      if (configRaw) bundled.configRaw = configRaw
    }

    if (proj.posts) {
      for (const post of proj.posts) {
        const raw = readContentFile(post.path)
        if (!raw) continue
        bundled.posts.push({
          filename: post.path.split('/').pop() ?? '',
          raw
        })
      }
    }

    projects.push(bundled)
  }

  // Blog posts
  const blog: Array<{ filename: string; raw: string }> = []
  for (const entry of manifest.blog) {
    const raw = readContentFile(entry.path)
    if (!raw) continue
    blog.push({
      filename: entry.path.split('/').pop() ?? '',
      raw
    })
  }

  // Pages
  const pages: Array<{ filename: string; raw: string }> = []
  for (const entry of manifest.pages) {
    const raw = readContentFile(entry.path)
    if (!raw) continue
    pages.push({
      filename: entry.path.split('/').pop() ?? '',
      raw
    })
  }

  const bundle: ContentBundle = {
    siteConfig,
    commitsCache,
    projects,
    blog,
    pages
  }

  writeFileSync(BUNDLE_PATH, JSON.stringify(bundle))

  const sizeKB = (Buffer.byteLength(JSON.stringify(bundle)) / 1024).toFixed(1)
  console.log(`Generated content-bundle.json (${sizeKB} KB):`)
  console.log(`  - ${projects.length} projects`)
  console.log(`  - ${blog.length} blog posts`)
  console.log(`  - ${pages.length} pages`)
  console.log(`  - commits cache: ${Object.keys(commitsCache).length} repos`)
}

bundleContent()
