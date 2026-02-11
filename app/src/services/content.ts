/**
 * Content Loader Service
 *
 * This service loads content from the public/content folder using fetch.
 * A manifest.json file lists all content files to load.
 */

import { parse as parseYaml } from 'yaml'
import {
  parseMarkdown,
  extractExcerpt,
  getSlugFromFilename,
  getDateFromFilename
} from './markdown'
import type {
  Project,
  ProjectConfig,
  ProjectFrontmatter,
  Post,
  PostFrontmatter,
  Page,
  PageFrontmatter,
  CommitsCache,
  SiteConfig
} from 'src/types/content'

// Content manifest structure
interface ContentManifest {
  projects: Array<{
    slug: string
    indexPath: string
    configPath?: string
    posts?: Array<{ path: string }>
  }>
  blog: Array<{ path: string }>
  pages: Array<{ path: string }>
}

// Fetch a text file
async function fetchText(path: string): Promise<string | null> {
  try {
    const response = await fetch(path)
    if (!response.ok) {
      console.warn(`Failed to fetch ${path}: ${response.status}`)
      return null
    }
    return await response.text()
  } catch (error) {
    console.warn(`Error fetching ${path}:`, error)
    return null
  }
}

// Load the content manifest
async function loadManifest(): Promise<ContentManifest | null> {
  const text = await fetchText('/content/manifest.json')
  if (!text) return null
  try {
    return JSON.parse(text) as ContentManifest
  } catch {
    console.error('Failed to parse content manifest')
    return null
  }
}

// Load project configuration
async function loadProjectConfig(configPath?: string): Promise<ProjectConfig> {
  if (!configPath) return {}

  const raw = await fetchText(configPath)
  if (!raw) return {}

  try {
    return parseYaml(raw) as ProjectConfig
  } catch {
    console.warn(`Failed to parse config: ${configPath}`)
    return {}
  }
}

// Load posts for a project (in parallel)
async function loadProjectPosts(posts?: Array<{ path: string }>): Promise<Post[]> {
  if (!posts || posts.length === 0) return []

  const results = await Promise.all(
    posts.map(async ({ path }) => {
      const raw = await fetchText(path)
      if (!raw) return null

      const filename = path.split('/').pop() ?? ''
      const postSlug = getSlugFromFilename(filename)
      const dateFromFilename = getDateFromFilename(filename)
      const parsed = await parseMarkdown<PostFrontmatter>(raw)

      return {
        slug: postSlug,
        title: parsed.frontmatter.title ?? postSlug,
        date: parsed.frontmatter.date ?? dateFromFilename ?? new Date().toISOString(),
        tags: parsed.frontmatter.tags,
        excerpt: parsed.frontmatter.excerpt ?? extractExcerpt(parsed.rawContent),
        content: parsed.content,
        rawContent: parsed.rawContent
      } as Post
    })
  )

  return results
    .filter((p): p is Post => p !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// Load a single project
async function loadProject(
  projectDef: { slug: string; indexPath: string; configPath?: string; posts?: Array<{ path: string }> },
  commitsCache: CommitsCache
): Promise<Project | null> {
  const raw = await fetchText(projectDef.indexPath)
  if (!raw) return null

  const basePath = projectDef.indexPath.substring(0, projectDef.indexPath.lastIndexOf('/'))
  const [parsed, config, posts] = await Promise.all([
    parseMarkdown<ProjectFrontmatter>(raw, basePath),
    loadProjectConfig(projectDef.configPath),
    loadProjectPosts(projectDef.posts)
  ])
  const commits = commitsCache[projectDef.slug]?.commits ?? []

  const dates: Date[] = []
  if (commits.length > 0) {
    dates.push(new Date(commits[0].date))
  }
  if (posts.length > 0) {
    dates.push(new Date(posts[0].date))
  }
  const lastUpdated = dates.length > 0
    ? new Date(Math.max(...dates.map(d => d.getTime()))).toISOString()
    : undefined

  return {
    slug: projectDef.slug,
    title: parsed.frontmatter.title ?? projectDef.slug,
    tagline: parsed.frontmatter.tagline,
    status: parsed.frontmatter.status ?? 'concept',
    featured: parsed.frontmatter.featured ?? false,
    order: parsed.frontmatter.order,
    tech: parsed.frontmatter.tech,
    links: parsed.frontmatter.links,
    content: parsed.content,
    rawContent: parsed.rawContent,
    config,
    posts,
    commits,
    lastUpdated
  }
}

// Load all projects (in parallel)
export async function loadProjects(commitsCache: CommitsCache): Promise<Project[]> {
  const manifest = await loadManifest()
  if (!manifest) return []

  const results = await Promise.all(
    manifest.projects.map(def => loadProject(def, commitsCache))
  )

  return results
    .filter((p): p is Project => p !== null)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}

// Load all blog posts (in parallel)
export async function loadBlogPosts(): Promise<Post[]> {
  const manifest = await loadManifest()
  if (!manifest) return []

  const results = await Promise.all(
    manifest.blog.map(async ({ path }) => {
      const raw = await fetchText(path)
      if (!raw) return null

      const filename = path.split('/').pop() ?? ''
      const slug = getSlugFromFilename(filename)
      const dateFromFilename = getDateFromFilename(filename)
      const parsed = await parseMarkdown<PostFrontmatter>(raw)

      return {
        slug,
        title: parsed.frontmatter.title ?? slug,
        date: parsed.frontmatter.date ?? dateFromFilename ?? new Date().toISOString(),
        tags: parsed.frontmatter.tags,
        project: parsed.frontmatter.project,
        excerpt: parsed.frontmatter.excerpt ?? extractExcerpt(parsed.rawContent),
        content: parsed.content,
        rawContent: parsed.rawContent
      } as Post
    })
  )

  return results
    .filter((p): p is Post => p !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// Load all static pages
export async function loadPages(): Promise<Page[]> {
  const manifest = await loadManifest()
  if (!manifest) return []

  const pages: Page[] = []

  for (const { path } of manifest.pages) {
    const raw = await fetchText(path)
    if (!raw) continue

    const filename = path.split('/').pop() ?? ''
    const slug = getSlugFromFilename(filename)

    const parsed = await parseMarkdown<PageFrontmatter>(raw)

    pages.push({
      slug,
      title: parsed.frontmatter.title ?? slug,
      layout: parsed.frontmatter.layout,
      content: parsed.content,
      rawContent: parsed.rawContent
    })
  }

  return pages
}

// Load commits cache
export async function loadCommitsCache(): Promise<CommitsCache> {
  const text = await fetchText('/_data/commits-cache.json')
  if (!text) return {}

  try {
    return JSON.parse(text) as CommitsCache
  } catch {
    console.warn('Failed to parse commits cache')
    return {}
  }
}

// Default site config
const defaultSiteConfig: SiteConfig = {
  site: {
    title: 'My Portfolio',
    description: 'Developer portfolio'
  },
  header: {
    title: 'My Name',
    nav: [
      { label: 'Projects', path: '/projects' },
      { label: 'Blog', path: '/blog' },
      { label: 'About', path: '/about' }
    ]
  },
  footer: {
    copyright: `${new Date().getFullYear()} My Name`,
    github: 'https://github.com/username'
  },
  homepage: {
    hero: {
      title: "Hi, I'm [Name]",
      subtitle: ['Software Developer'],
      buttons: [
        { label: 'View Projects', path: '/projects', style: 'primary' },
        { label: 'About Me', path: '/about', style: 'outline' }
      ]
    },
    showFeaturedProjects: true,
    showRecentPosts: true,
    projectsLimit: 4,
    postsLimit: 3
  }
}

// Load site configuration
export async function loadSiteConfig(): Promise<SiteConfig> {
  const text = await fetchText('/content/site.yaml')
  if (!text) return defaultSiteConfig

  try {
    const config = parseYaml(text) as Partial<SiteConfig>
    // Merge with defaults
    return {
      site: { ...defaultSiteConfig.site, ...config.site },
      header: { ...defaultSiteConfig.header, ...config.header },
      footer: { ...defaultSiteConfig.footer, ...config.footer },
      homepage: { ...defaultSiteConfig.homepage, ...config.homepage }
    }
  } catch {
    console.warn('Failed to parse site config')
    return defaultSiteConfig
  }
}

// Load all content
export async function loadAllContent() {
  const [commitsCache, siteConfig] = await Promise.all([
    loadCommitsCache(),
    loadSiteConfig()
  ])

  const [projects, blogPosts, pages] = await Promise.all([
    loadProjects(commitsCache),
    loadBlogPosts(),
    loadPages()
  ])

  return {
    projects,
    blogPosts,
    pages,
    commitsCache,
    siteConfig
  }
}
