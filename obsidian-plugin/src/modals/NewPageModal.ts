import { App, Modal, Setting, Notice } from "obsidian";
import type StaticPortfolioPlugin from "../main";
import { generatePageMd, slugify } from "../services/templates";

export class NewPageModal extends Modal {
  plugin: StaticPortfolioPlugin;

  private title: string = "";

  constructor(app: App, plugin: StaticPortfolioPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Create New Page" });

    // Title
    new Setting(contentEl)
      .setName("Title")
      .setDesc("Page title (e.g., About, Contact, Resume)")
      .addText((text) =>
        text.setPlaceholder("About").onChange((value) => {
          this.title = value;
        })
      );

    // Create button
    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Create Page")
        .setCta()
        .onClick(async () => {
          await this.createPage();
        })
    );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  private async createPage() {
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
      // Generate filename
      const slug = slugify(this.title);
      const filename = `${slug}.md`;
      const filePath = `${manifestService.contentBasePath}/pages/${filename}`;

      // Ensure pages directory exists
      await manifestService.ensureDirectory(`${manifestService.contentBasePath}/pages`);

      // Create page
      const content = generatePageMd(this.title);
      await this.app.vault.create(filePath, content);

      // Update manifest
      await manifestService.addPage({
        path: `/content/pages/${filename}`,
      });

      new Notice(`Page "${this.title}" created successfully!`);
      this.close();

      // Open the new page
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (file) {
        await this.app.workspace.getLeaf().openFile(file as any);
      }
    } catch (error) {
      console.error("Failed to create page:", error);
      new Notice(`Failed to create page: ${error}`);
    }
  }
}
