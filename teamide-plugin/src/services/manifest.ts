/**
 * Manifest service - manage content manifest for Static Portfolio Generator
 */

import { readFile, writeFile, ensureDirectory } from './files';
import {
  CONTENT_PATH,
  type ContentManifest,
  type ProjectEntry,
  type BlogEntry,
  type PageEntry
} from '../types';

const MANIFEST_PATH = `${CONTENT_PATH}/manifest.json`;

/**
 * Load the content manifest from the project
 */
export async function loadManifest(projectId: string): Promise<ContentManifest | null> {
  try {
    const content = await readFile(projectId, MANIFEST_PATH);
    return JSON.parse(content) as ContentManifest;
  } catch (error) {
    console.error('Failed to load manifest:', error);
    return null;
  }
}

/**
 * Save the content manifest to the project
 */
export async function saveManifest(projectId: string, manifest: ContentManifest): Promise<boolean> {
  try {
    await writeFile(projectId, MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save manifest:', error);
    return false;
  }
}

/**
 * Add a project to the manifest
 */
export async function addProject(projectId: string, entry: ProjectEntry): Promise<boolean> {
  const manifest = await loadManifest(projectId);
  if (!manifest) return false;

  // Check if project already exists
  if (manifest.projects.some((p) => p.slug === entry.slug)) {
    console.error('Project already exists:', entry.slug);
    return false;
  }

  manifest.projects.push(entry);
  return await saveManifest(projectId, manifest);
}

/**
 * Remove a project from the manifest
 */
export async function removeProject(projectId: string, slug: string): Promise<boolean> {
  const manifest = await loadManifest(projectId);
  if (!manifest) return false;

  manifest.projects = manifest.projects.filter((p) => p.slug !== slug);
  return await saveManifest(projectId, manifest);
}

/**
 * Add a blog post to the manifest
 */
export async function addBlogPost(projectId: string, entry: BlogEntry): Promise<boolean> {
  const manifest = await loadManifest(projectId);
  if (!manifest) return false;

  // Check if blog post already exists
  if (manifest.blog.some((b) => b.path === entry.path)) {
    console.error('Blog post already exists:', entry.path);
    return false;
  }

  manifest.blog.push(entry);
  return await saveManifest(projectId, manifest);
}

/**
 * Remove a blog post from the manifest
 */
export async function removeBlogPost(projectId: string, path: string): Promise<boolean> {
  const manifest = await loadManifest(projectId);
  if (!manifest) return false;

  manifest.blog = manifest.blog.filter((b) => b.path !== path);
  return await saveManifest(projectId, manifest);
}

/**
 * Add a page to the manifest
 */
export async function addPage(projectId: string, entry: PageEntry): Promise<boolean> {
  const manifest = await loadManifest(projectId);
  if (!manifest) return false;

  // Check if page already exists
  if (manifest.pages.some((p) => p.path === entry.path)) {
    console.error('Page already exists:', entry.path);
    return false;
  }

  manifest.pages.push(entry);
  return await saveManifest(projectId, manifest);
}

/**
 * Remove a page from the manifest
 */
export async function removePage(projectId: string, path: string): Promise<boolean> {
  const manifest = await loadManifest(projectId);
  if (!manifest) return false;

  manifest.pages = manifest.pages.filter((p) => p.path !== path);
  return await saveManifest(projectId, manifest);
}

/**
 * Add a post to a project
 */
export async function addProjectPost(
  projectId: string,
  projectSlug: string,
  postPath: string
): Promise<boolean> {
  const manifest = await loadManifest(projectId);
  if (!manifest) return false;

  const project = manifest.projects.find((p) => p.slug === projectSlug);
  if (!project) {
    console.error('Project not found:', projectSlug);
    return false;
  }

  if (!project.posts) {
    project.posts = [];
  }

  project.posts.push({ path: postPath });
  return await saveManifest(projectId, manifest);
}

/**
 * Get content base path
 */
export function getContentBasePath(): string {
  return CONTENT_PATH;
}

/**
 * Ensure content directories exist
 */
export async function ensureContentDirectories(projectId: string): Promise<void> {
  await ensureDirectory(projectId, `${CONTENT_PATH}/projects`);
  await ensureDirectory(projectId, `${CONTENT_PATH}/blog`);
  await ensureDirectory(projectId, `${CONTENT_PATH}/pages`);
}
