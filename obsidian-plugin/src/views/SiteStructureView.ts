import { ItemView, WorkspaceLeaf, TFile, TFolder, Notice } from "obsidian";
import type StaticPortfolioPlugin from "../main";
import { CONTENT_PATH, VIEW_TYPE_STRUCTURE } from "../types";
import { NewProjectModal } from "../modals/NewProjectModal";
import { NewBlogPostModal } from "../modals/NewBlogPostModal";
import { NewPageModal } from "../modals/NewPageModal";
import { ConfirmDeleteModal } from "../modals/ConfirmDeleteModal";

export class SiteStructureView extends ItemView {
  plugin: StaticPortfolioPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: StaticPortfolioPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_STRUCTURE;
  }

  getDisplayText(): string {
    return "Site Structure";
  }

  getIcon(): string {
    return "folder-tree";
  }

  async onOpen() {
    await this.render();
  }

  async onClose() {
    // Cleanup
  }

  async refresh() {
    await this.render();
  }

  private async render() {
    const container = this.containerEl.children[1];
    container.empty();

    // Header
    const header = container.createEl("div", { cls: "spg-view-header" });
    header.createEl("h4", { text: "Site Structure" });

    const refreshBtn = header.createEl("button", { text: "Refresh" });
    refreshBtn.addEventListener("click", async () => {
      await this.render();
    });

    // Load manifest
    const manifest = await this.plugin.manifestService?.loadManifest();
    if (!manifest) {
      container.createEl("p", { text: "Could not load manifest" });
      return;
    }

    // Projects section
    const projectsSection = container.createEl("div", { cls: "spg-structure-section" });
    const projectsHeader = projectsSection.createEl("div", {
      cls: "spg-section-header",
    });
    projectsHeader.createEl("span", { text: "Projects", cls: "spg-section-title" });
    projectsHeader.createEl("span", {
      text: `(${manifest.projects.length})`,
      cls: "spg-section-count",
    });
    const addProjectBtn = projectsHeader.createEl("button", {
      text: "+",
      cls: "spg-add-btn",
      attr: { "aria-label": "New Project" },
    });
    addProjectBtn.addEventListener("click", () => {
      new NewProjectModal(this.app, this.plugin).open();
    });

    if (manifest.projects.length === 0) {
      projectsSection.createEl("p", {
        text: "No projects",
        cls: "spg-empty-state",
      });
    } else {
      const projectsList = projectsSection.createEl("div", { cls: "spg-items-list" });

      for (const project of manifest.projects) {
        const item = projectsList.createEl("div", { cls: "spg-structure-item" });

        // Status indicator
        const statusDot = item.createEl("span", {
          cls: `spg-status-dot spg-status-concept`, // Default, would need to read frontmatter for actual status
        });

        const link = item.createEl("a", {
          text: project.slug,
          cls: "spg-structure-link",
        });
        link.addEventListener("click", async (e) => {
          e.preventDefault();
          await this.openFile(project.indexPath);
        });

        // Show post count if any
        if (project.posts && project.posts.length > 0) {
          item.createEl("span", {
            text: `(${project.posts.length} posts)`,
            cls: "spg-item-meta",
          });
        }

        // Refresh README button
        const refreshBtn = item.createEl("button", {
          text: "↻",
          cls: "spg-refresh-btn",
          attr: { "aria-label": "Update README from GitHub" },
        });
        refreshBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          await this.refreshProjectReadme(project.slug, refreshBtn);
        });

        // Delete button
        const deleteBtn = item.createEl("button", {
          text: "×",
          cls: "spg-delete-btn",
          attr: { "aria-label": "Delete project" },
        });
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          new ConfirmDeleteModal(
            this.app,
            project.slug,
            "Project",
            async () => {
              await this.deleteProject(project.slug);
            }
          ).open();
        });
      }
    }

    // Blog section
    const blogSection = container.createEl("div", { cls: "spg-structure-section" });
    const blogHeader = blogSection.createEl("div", { cls: "spg-section-header" });
    blogHeader.createEl("span", { text: "Blog Posts", cls: "spg-section-title" });
    blogHeader.createEl("span", {
      text: `(${manifest.blog.length})`,
      cls: "spg-section-count",
    });
    const addBlogBtn = blogHeader.createEl("button", {
      text: "+",
      cls: "spg-add-btn",
      attr: { "aria-label": "New Blog Post" },
    });
    addBlogBtn.addEventListener("click", () => {
      new NewBlogPostModal(this.app, this.plugin).open();
    });

    if (manifest.blog.length === 0) {
      blogSection.createEl("p", {
        text: "No blog posts",
        cls: "spg-empty-state",
      });
    } else {
      const blogList = blogSection.createEl("div", { cls: "spg-items-list" });

      for (const post of manifest.blog) {
        const item = blogList.createEl("div", { cls: "spg-structure-item" });

        const filename = post.path.split("/").pop() || post.path;
        const displayName = filename.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(".md", "");

        const link = item.createEl("a", {
          text: displayName,
          cls: "spg-structure-link",
        });
        link.addEventListener("click", async (e) => {
          e.preventDefault();
          await this.openFile(post.path);
        });

        // Delete button
        const deleteBtn = item.createEl("button", {
          text: "×",
          cls: "spg-delete-btn",
          attr: { "aria-label": "Delete blog post" },
        });
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          new ConfirmDeleteModal(
            this.app,
            displayName,
            "Blog Post",
            async () => {
              await this.deleteBlogPost(post.path);
            }
          ).open();
        });
      }
    }

    // Pages section
    const pagesSection = container.createEl("div", { cls: "spg-structure-section" });
    const pagesHeader = pagesSection.createEl("div", { cls: "spg-section-header" });
    pagesHeader.createEl("span", { text: "Pages", cls: "spg-section-title" });
    pagesHeader.createEl("span", {
      text: `(${manifest.pages.length})`,
      cls: "spg-section-count",
    });
    const addPageBtn = pagesHeader.createEl("button", {
      text: "+",
      cls: "spg-add-btn",
      attr: { "aria-label": "New Page" },
    });
    addPageBtn.addEventListener("click", () => {
      new NewPageModal(this.app, this.plugin).open();
    });

    if (manifest.pages.length === 0) {
      pagesSection.createEl("p", {
        text: "No pages",
        cls: "spg-empty-state",
      });
    } else {
      const pagesList = pagesSection.createEl("div", { cls: "spg-items-list" });

      for (const page of manifest.pages) {
        const item = pagesList.createEl("div", { cls: "spg-structure-item" });

        const filename = page.path.split("/").pop() || page.path;
        const displayName = filename.replace(".md", "");

        const link = item.createEl("a", {
          text: displayName,
          cls: "spg-structure-link",
        });
        link.addEventListener("click", async (e) => {
          e.preventDefault();
          await this.openFile(page.path);
        });

        // Delete button
        const deleteBtn = item.createEl("button", {
          text: "×",
          cls: "spg-delete-btn",
          attr: { "aria-label": "Delete page" },
        });
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          new ConfirmDeleteModal(
            this.app,
            displayName,
            "Page",
            async () => {
              await this.deletePage(page.path);
            }
          ).open();
        });
      }
    }
  }

  private async openFile(contentPath: string) {
    // Convert /content/... path to vault path
    const vaultPath = `${CONTENT_PATH}${contentPath.replace("/content", "")}`;

    const file = this.app.vault.getAbstractFileByPath(vaultPath);
    if (file && file instanceof TFile) {
      await this.app.workspace.getLeaf().openFile(file);
    }
  }

  private async deleteProject(slug: string) {
    try {
      // Delete project folder
      const projectPath = `${CONTENT_PATH}/projects/${slug}`;
      const folder = this.app.vault.getAbstractFileByPath(projectPath);

      if (folder && folder instanceof TFolder) {
        await this.app.vault.delete(folder, true);
      }

      // Remove from manifest
      await this.plugin.manifestService?.removeProject(slug);

      new Notice(`Project "${slug}" deleted`);
      await this.refresh();
    } catch (error) {
      console.error("Failed to delete project:", error);
      new Notice(`Failed to delete project: ${error}`);
    }
  }

  private async deleteBlogPost(contentPath: string) {
    try {
      const vaultPath = `${CONTENT_PATH}${contentPath.replace("/content", "")}`;
      const file = this.app.vault.getAbstractFileByPath(vaultPath);

      if (file && file instanceof TFile) {
        await this.app.vault.delete(file);
      }

      // Remove from manifest
      await this.plugin.manifestService?.removeBlogPost(contentPath);

      const filename = contentPath.split("/").pop() || contentPath;
      new Notice(`Blog post "${filename}" deleted`);
      await this.refresh();
    } catch (error) {
      console.error("Failed to delete blog post:", error);
      new Notice(`Failed to delete blog post: ${error}`);
    }
  }

  private async deletePage(contentPath: string) {
    try {
      const vaultPath = `${CONTENT_PATH}${contentPath.replace("/content", "")}`;
      const file = this.app.vault.getAbstractFileByPath(vaultPath);

      if (file && file instanceof TFile) {
        await this.app.vault.delete(file);
      }

      // Remove from manifest
      await this.plugin.manifestService?.removePage(contentPath);

      const filename = contentPath.split("/").pop() || contentPath;
      new Notice(`Page "${filename}" deleted`);
      await this.refresh();
    } catch (error) {
      console.error("Failed to delete page:", error);
      new Notice(`Failed to delete page: ${error}`);
    }
  }

  private async refreshProjectReadme(slug: string, button: HTMLButtonElement) {
    const originalText = button.textContent;
    button.textContent = "⟳";
    button.disabled = true;

    try {
      if (!this.plugin.githubService) {
        throw new Error("GitHub service not available");
      }

      await this.plugin.githubService.updateProjectReadme(slug);
      new Notice(`README updated for "${slug}"`);
    } catch (error) {
      console.error("Failed to update README:", error);
      new Notice(`Failed to update README: ${error}`);
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  }
}
