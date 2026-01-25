// Project status types
export type ProjectStatus = 'active' | 'maintained' | 'paused' | 'archived' | 'concept'

// Project configuration (from config.yaml)
export interface ProjectConfig {
  repo?: string              // GitHub repo: owner/repo
  commitsLimit?: number      // Max commits to display (default: 20)
  hiddenCommits?: string[]   // List of hidden commit SHAs
}

// Project frontmatter (from index.md)
export interface ProjectFrontmatter {
  title: string
  tagline?: string
  status: ProjectStatus
  featured?: boolean
  order?: number
  tech?: string[]
  private?: boolean          // Hide repo link and show "Private" indicator
  links?: {
    repo?: string
    demo?: string
    docs?: string
    [key: string]: string | undefined
  }
}

// Full project with content
export interface Project extends ProjectFrontmatter {
  slug: string
  content: string           // Rendered HTML
  rawContent: string        // Original markdown
  config: ProjectConfig
  posts: Post[]
  commits: Commit[]
  lastUpdated?: string      // ISO date of latest activity
}

// Post frontmatter
export interface PostFrontmatter {
  title: string
  date: string              // ISO date
  tags?: string[]
  project?: string          // Project slug (for blog posts linked to projects)
  excerpt?: string
}

// Full post with content
export interface Post extends PostFrontmatter {
  slug: string
  content: string           // Rendered HTML
  rawContent: string        // Original markdown
}

// Static page frontmatter
export interface PageFrontmatter {
  title: string
  layout?: string
}

// Full page with content
export interface Page extends PageFrontmatter {
  slug: string
  content: string           // Rendered HTML
  rawContent: string        // Original markdown
}

// Commit data (from GitHub API / cache)
export interface Commit {
  sha: string
  message: string
  date: string              // ISO date
  author?: string
  url?: string              // Link to GitHub commit
  hidden: boolean           // Whether to hide from website
}

// Commits cache structure
export interface CommitsCache {
  [projectSlug: string]: {
    repo: string
    lastFetched: string     // ISO date
    latestSha?: string
    commits: Commit[]
  }
}

// Activity feed item
export interface ActivityItem {
  id: string
  type: 'commit' | 'post' | 'project'
  message: string
  date: string              // ISO date
  projectSlug?: string
  projectName?: string
  url?: string
}

// Navigation link
export interface NavLink {
  label: string
  path: string
}

// Social link
export interface SocialLink {
  label: string
  url: string
}

// Hero button
export interface HeroButton {
  label: string
  path: string
  style: 'primary' | 'outline'
}

// Site configuration (from site.yaml)
export interface SiteConfig {
  site: {
    title: string
    description?: string
  }
  header: {
    title: string
    logo?: string
    nav: NavLink[]
  }
  footer: {
    copyright: string
    github?: string
    socialLinks?: SocialLink[]
  }
  homepage: {
    hero: {
      title: string
      subtitle?: string[]
      buttons?: HeroButton[]
    }
    showFeaturedProjects?: boolean
    showRecentPosts?: boolean
    projectsLimit?: number
    postsLimit?: number
  }
}

// Content store state
export interface ContentState {
  projects: Project[]
  blogPosts: Post[]
  pages: Page[]
  commitsCache: CommitsCache
  siteConfig: SiteConfig
  isLoaded: boolean
}
