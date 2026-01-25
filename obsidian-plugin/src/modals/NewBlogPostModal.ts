import { App, Modal, Setting, Notice } from "obsidian";
import type StaticPortfolioPlugin from "../main";
import { generateBlogPostMd, slugify, formatDate } from "../services/templates";

export class NewBlogPostModal extends Modal {
  plugin: StaticPortfolioPlugin;

  private title: string = "";
  private date: string = formatDate(new Date());
  private tags: string = "";
  private project: string = "";

  constructor(app: App, plugin: StaticPortfolioPlugin) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Create New Blog Post" });

    // Load projects for dropdown
    const manifest = await this.plugin.manifestService?.loadManifest();
    const projects = manifest?.projects || [];

    // Title
    new Setting(contentEl)
      .setName("Title")
      .setDesc("Blog post title")
      .addText((text) =>
        text.setPlaceholder("My Blog Post").onChange((value) => {
          this.title = value;
        })
      );

    // Date
    new Setting(contentEl)
      .setName("Date")
      .setDesc("Publication date (YYYY-MM-DD)")
      .addText((text) =>
        text.setValue(this.date).onChange((value) => {
          this.date = value;
        })
      );

    // Tags
    new Setting(contentEl)
      .setName("Tags")
      .setDesc("Comma-separated list of tags")
      .addText((text) =>
        text.setPlaceholder("tech, tutorial, announcement").onChange((value) => {
          this.tags = value;
        })
      );

    // Project link
    new Setting(contentEl)
      .setName("Related Project")
      .setDesc("Optional: Link to a project")
      .addDropdown((dropdown) => {
        dropdown.addOption("", "None");
        for (const project of projects) {
          dropdown.addOption(project.slug, project.slug);
        }
        dropdown.onChange((value) => {
          this.project = value;
        });
      });

    // Create button
    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Create Blog Post")
        .setCta()
        .onClick(async () => {
          await this.createBlogPost();
        })
    );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  private async createBlogPost() {
    if (!this.title) {
      new Notice("Title is required");
      return;
    }

    const manifestService = this.plugin.manifestService;
    if (!manifestService) {
      new Notice("Manifest service not initialized");
      return;
    }

    try {
      // Parse tags
      const tags = this.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Generate filename
      const slug = slugify(this.title);
      const filename = `${this.date}-${slug}.md`;
      const filePath = `${manifestService.contentBasePath}/blog/${filename}`;

      // Ensure blog directory exists
      await manifestService.ensureDirectory(`${manifestService.contentBasePath}/blog`);

      // Create blog post
      const content = generateBlogPostMd(
        this.title,
        this.date,
        tags,
        this.project || undefined
      );
      await this.app.vault.create(filePath, content);

      // Update manifest
      await manifestService.addBlogPost({
        path: `/content/blog/${filename}`,
      });

      new Notice(`Blog post "${this.title}" created successfully!`);
      this.close();

      // Open the new blog post
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (file) {
        await this.app.workspace.getLeaf().openFile(file as any);
      }
    } catch (error) {
      console.error("Failed to create blog post:", error);
      new Notice(`Failed to create blog post: ${error}`);
    }
  }
}
