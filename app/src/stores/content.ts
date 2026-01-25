import { defineStore } from 'pinia'
import type {
  Project,
  Post,
  Page,
  Commit,
  CommitsCache,
  SiteConfig,
  ContentState,
  ActivityItem
} from 'src/types/content'

export const useContentStore = defineStore('content', {
  state: (): ContentState => ({
    projects: [],
    blogPosts: [],
    pages: [],
    commitsCache: {},
    siteConfig: {
      site: { title: 'Portfolio', description: '' },
      header: { title: 'Portfolio', nav: [] },
      footer: { copyright: '' },
      homepage: { hero: { title: '', subtitle: '' } }
    },
    isLoaded: false
  }),

  getters: {
    // Get project by slug
    getProject: (state) => (slug: string): Project | undefined => {
      return state.projects.find(p => p.slug === slug)
    },

    // Get page by slug
    getPage: (state) => (slug: string): Page | undefined => {
      return state.pages.find(p => p.slug === slug)
    },

    // Get blog post by slug
    getBlogPost: (state) => (slug: string): Post | undefined => {
      return state.blogPosts.find(p => p.slug === slug)
    },

    // Get project post by project slug and post slug
    getProjectPost: (state) => (projectSlug: string, postSlug: string): Post | undefined => {
      const project = state.projects.find(p => p.slug === projectSlug)
      return project?.posts.find(p => p.slug === postSlug)
    },

    // Get commits for a project (respecting visibility)
    getProjectCommits: (state) => (slug: string): Commit[] => {
      const project = state.projects.find(p => p.slug === slug)
      return project?.commits ?? []
    },

    // Get all featured projects
    featuredProjects: (state): Project[] => {
      return state.projects
        .filter(p => p.featured)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    },

    // Get all projects sorted by status and order
    sortedProjects: (state): Project[] => {
      const statusOrder: Record<string, number> = {
        active: 0,
        maintained: 1,
        paused: 2,
        concept: 3,
        archived: 4
      }

      return [...state.projects].sort((a, b) => {
        const statusDiff = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
        if (statusDiff !== 0) return statusDiff
        return (a.order ?? 999) - (b.order ?? 999)
      })
    },

    // Get recent activity (combined commits and posts)
    recentActivity: (state): ActivityItem[] => {
      const items: ActivityItem[] = []

      // Add commits from all projects
      for (const project of state.projects) {
        for (const commit of project.commits.filter(c => !c.hidden)) {
          items.push({
            id: `commit-${commit.sha}`,
            type: 'commit',
            message: commit.message.split('\n')[0],
            date: commit.date,
            projectSlug: project.slug,
            projectName: project.title,
            url: commit.url
          })
        }

        // Add project posts
        for (const post of project.posts) {
          items.push({
            id: `post-${project.slug}-${post.slug}`,
            type: 'post',
            message: post.title,
            date: post.date,
            projectSlug: project.slug,
            projectName: project.title
          })
        }
      }

      // Add blog posts
      for (const post of state.blogPosts) {
        items.push({
          id: `blog-${post.slug}`,
          type: 'post',
          message: post.title,
          date: post.date,
          projectSlug: post.project,
          projectName: post.project
            ? state.projects.find(p => p.slug === post.project)?.title
            : undefined
        })
      }

      // Sort by date descending
      return items.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    }
  },

  actions: {
    // Set all content (called during SSG build)
    setContent(data: {
      projects: Project[]
      blogPosts: Post[]
      pages: Page[]
      commitsCache: CommitsCache
      siteConfig?: SiteConfig
    }) {
      this.projects = data.projects
      this.blogPosts = data.blogPosts
      this.pages = data.pages
      this.commitsCache = data.commitsCache

      if (data.siteConfig) {
        this.siteConfig = data.siteConfig
      }

      this.isLoaded = true
    },

    // Update commits cache for a project
    updateProjectCommits(projectSlug: string, commits: Commit[]) {
      const project = this.projects.find(p => p.slug === projectSlug)
      if (project) {
        project.commits = commits
      }
    },

    // Toggle commit visibility
    toggleCommitVisibility(projectSlug: string, sha: string) {
      const project = this.projects.find(p => p.slug === projectSlug)
      if (project) {
        const commit = project.commits.find(c => c.sha === sha)
        if (commit) {
          commit.hidden = !commit.hidden
        }
      }
    }
  }
})
