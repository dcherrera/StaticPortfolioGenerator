/**
 * Shared TypeScript interfaces for the Static Portfolio Generator plugin
 */

// Plugin settings
export interface PluginSettings {
  githubToken: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  githubToken: "",
};

// Fixed paths - vault is always the repo root
export const CONTENT_PATH = "app/public/content";
export const DATA_PATH = "app/public/_data";

// Content manifest structure
export interface ContentManifest {
  projects: ProjectEntry[];
  blog: BlogEntry[];
  pages: PageEntry[];
}

export interface ProjectEntry {
  slug: string;
  indexPath: string;
  configPath?: string;
  posts?: PostEntry[];
}

export interface BlogEntry {
  path: string;
}

export interface PageEntry {
  path: string;
}

export interface PostEntry {
  path: string;
}

// Project frontmatter
export interface ProjectFrontmatter {
  title: string;
  tagline?: string;
  status: ProjectStatus;
  featured?: boolean;
  order?: number;
  tech?: string[];
  links?: {
    repo?: string;
    demo?: string;
    docs?: string;
  };
}

export type ProjectStatus = "active" | "maintained" | "paused" | "archived" | "concept";

// Project config.yaml
export interface ProjectConfig {
  repo?: string;
  commitsLimit?: number;
  hiddenCommits?: string[];
}

// Blog post frontmatter
export interface BlogPostFrontmatter {
  title: string;
  date: string;
  tags?: string[];
  project?: string;
  excerpt?: string;
}

// Page frontmatter
export interface PageFrontmatter {
  title: string;
  layout?: string;
}

// GitHub commit
export interface Commit {
  sha: string;
  message: string;
  date: string;
  author: string;
  url: string;
  hidden?: boolean;
}

// Commits cache
export interface CommitsCache {
  [projectSlug: string]: {
    repo: string;
    lastFetched: string;
    latestSha?: string;
    commits: Commit[];
  };
}

// View types
export const VIEW_TYPE_COMMITS = "spg-commits-view";
export const VIEW_TYPE_STRUCTURE = "spg-structure-view";
