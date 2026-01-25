import { App, TFile, TFolder } from "obsidian";
import {
  CONTENT_PATH,
  DATA_PATH,
  type ContentManifest,
  type ProjectEntry,
  type BlogEntry,
  type PageEntry,
} from "../types";

export class ManifestService {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  private get manifestPath(): string {
    return `${CONTENT_PATH}/manifest.json`;
  }

  async loadManifest(): Promise<ContentManifest | null> {
    try {
      const file = this.app.vault.getAbstractFileByPath(this.manifestPath);
      if (!file || !(file instanceof TFile)) {
        console.error("Manifest file not found:", this.manifestPath);
        return null;
      }

      const content = await this.app.vault.read(file);
      return JSON.parse(content) as ContentManifest;
    } catch (error) {
      console.error("Failed to load manifest:", error);
      return null;
    }
  }

  async saveManifest(manifest: ContentManifest): Promise<boolean> {
    try {
      const file = this.app.vault.getAbstractFileByPath(this.manifestPath);
      if (!file || !(file instanceof TFile)) {
        // Create manifest file if it doesn't exist
        await this.app.vault.create(
          this.manifestPath,
          JSON.stringify(manifest, null, 2)
        );
        return true;
      }

      await this.app.vault.modify(file, JSON.stringify(manifest, null, 2));
      return true;
    } catch (error) {
      console.error("Failed to save manifest:", error);
      return false;
    }
  }

  async addProject(entry: ProjectEntry): Promise<boolean> {
    const manifest = await this.loadManifest();
    if (!manifest) return false;

    // Check if project already exists
    if (manifest.projects.some((p) => p.slug === entry.slug)) {
      console.error("Project already exists:", entry.slug);
      return false;
    }

    manifest.projects.push(entry);
    return await this.saveManifest(manifest);
  }

  async removeProject(slug: string): Promise<boolean> {
    const manifest = await this.loadManifest();
    if (!manifest) return false;

    manifest.projects = manifest.projects.filter((p) => p.slug !== slug);
    return await this.saveManifest(manifest);
  }

  async addBlogPost(entry: BlogEntry): Promise<boolean> {
    const manifest = await this.loadManifest();
    if (!manifest) return false;

    // Check if blog post already exists
    if (manifest.blog.some((b) => b.path === entry.path)) {
      console.error("Blog post already exists:", entry.path);
      return false;
    }

    manifest.blog.push(entry);
    return await this.saveManifest(manifest);
  }

  async removeBlogPost(path: string): Promise<boolean> {
    const manifest = await this.loadManifest();
    if (!manifest) return false;

    manifest.blog = manifest.blog.filter((b) => b.path !== path);
    return await this.saveManifest(manifest);
  }

  async addPage(entry: PageEntry): Promise<boolean> {
    const manifest = await this.loadManifest();
    if (!manifest) return false;

    // Check if page already exists
    if (manifest.pages.some((p) => p.path === entry.path)) {
      console.error("Page already exists:", entry.path);
      return false;
    }

    manifest.pages.push(entry);
    return await this.saveManifest(manifest);
  }

  async removePage(path: string): Promise<boolean> {
    const manifest = await this.loadManifest();
    if (!manifest) return false;

    manifest.pages = manifest.pages.filter((p) => p.path !== path);
    return await this.saveManifest(manifest);
  }

  async addProjectPost(projectSlug: string, postPath: string): Promise<boolean> {
    const manifest = await this.loadManifest();
    if (!manifest) return false;

    const project = manifest.projects.find((p) => p.slug === projectSlug);
    if (!project) {
      console.error("Project not found:", projectSlug);
      return false;
    }

    if (!project.posts) {
      project.posts = [];
    }

    project.posts.push({ path: postPath });
    return await this.saveManifest(manifest);
  }

  // Helper to ensure directory exists
  async ensureDirectory(path: string): Promise<void> {
    const parts = path.split("/");
    let currentPath = "";

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const existing = this.app.vault.getAbstractFileByPath(currentPath);

      if (!existing) {
        await this.app.vault.createFolder(currentPath);
      }
    }
  }

  // Get content base path
  get contentBasePath(): string {
    return CONTENT_PATH;
  }

  // Get data base path
  get dataBasePath(): string {
    return DATA_PATH;
  }
}
