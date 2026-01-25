import { App, Modal, Setting, Notice } from "obsidian";
import type StaticPortfolioPlugin from "../main";
import { VIEW_TYPE_STRUCTURE, type ProjectStatus } from "../types";
import {
  generateProjectIndexMd,
  generateProjectConfigYaml,
  slugify,
} from "../services/templates";
import { SiteStructureView } from "../views/SiteStructureView";

interface RepoInfo {
  fullName: string;
  name: string;
  private: boolean;
  description: string | null;
}

export class NewProjectModal extends Modal {
  plugin: StaticPortfolioPlugin;

  private title: string = "";
  private slug: string = "";
  private tagline: string = "";
  private status: ProjectStatus = "concept";
  private techStack: string = "";
  private selectedRepo: RepoInfo | null = null;
  private repos: RepoInfo[] = [];
  private isLoading: boolean = true;

  constructor(app: App, plugin: StaticPortfolioPlugin) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Create New Project" });

    // Show loading state while fetching repos
    const loadingEl = contentEl.createEl("p", { text: "Loading repositories..." });

    // Fetch repos in background
    this.fetchRepos().then(() => {
      loadingEl.remove();
      this.renderForm();
    });
  }

  private async fetchRepos() {
    if (!this.plugin.settings.githubToken) {
      this.repos = [];
      this.isLoading = false;
      return;
    }

    try {
      this.repos = await this.plugin.githubService?.fetchUserRepos() || [];
    } catch (error) {
      console.error("Failed to fetch repos:", error);
      this.repos = [];
    }
    this.isLoading = false;
  }

  private renderForm() {
    const { contentEl } = this;

    // Store input references for auto-population
    let titleInput: any;
    let slugInput: any;
    let taglineInput: any;

    // GitHub repo dropdown - moved to top so it can populate other fields
    const repoSetting = new Setting(contentEl)
      .setName("GitHub Repository")
      .setDesc("Select a repository from your GitHub account");

    if (!this.plugin.settings.githubToken) {
      repoSetting.setDesc("Configure GitHub token in settings to see your repositories");
      repoSetting.addText((text) =>
        text
          .setPlaceholder("owner/repo")
          .onChange((value) => {
            this.selectedRepo = value ? { fullName: value, name: value, private: false, description: null } : null;
          })
      );
    } else if (this.repos.length === 0) {
      repoSetting.setDesc("No repositories found or failed to load");
      repoSetting.addText((text) =>
        text
          .setPlaceholder("owner/repo")
          .onChange((value) => {
            this.selectedRepo = value ? { fullName: value, name: value, private: false, description: null } : null;
          })
      );
    } else {
      repoSetting.addDropdown((dropdown) => {
        dropdown.addOption("", "-- Select a repository --");

        for (const repo of this.repos) {
          const label = repo.private ? `🔒 ${repo.fullName}` : repo.fullName;
          dropdown.addOption(repo.fullName, label);
        }

        dropdown.onChange((value) => {
          this.selectedRepo = this.repos.find((r) => r.fullName === value) || null;

          // Auto-populate fields from selected repo
          if (this.selectedRepo) {
            this.title = this.selectedRepo.name;
            this.slug = slugify(this.selectedRepo.name);
            this.tagline = this.selectedRepo.description || "";

            // Update input fields
            if (titleInput) titleInput.setValue(this.title);
            if (slugInput) slugInput.setValue(this.slug);
            if (taglineInput) taglineInput.setValue(this.tagline);
          }
        });
      });
    }

    // Title
    new Setting(contentEl)
      .setName("Title")
      .setDesc("Project display name")
      .addText((text) => {
        titleInput = text;
        text.setPlaceholder("My Awesome Project").onChange((value) => {
          this.title = value;
          // Auto-generate slug from title
          if (!this.slug || this.slug === slugify(this.title)) {
            this.slug = slugify(value);
            slugInput.setValue(this.slug);
          }
        });
      });

    // Slug
    new Setting(contentEl)
      .setName("Slug")
      .setDesc("URL-friendly identifier (auto-generated from title)")
      .addText((text) => {
        slugInput = text;
        text.setPlaceholder("my-awesome-project").onChange((value) => {
          this.slug = value;
        });
      });

    // Tagline
    new Setting(contentEl)
      .setName("Tagline")
      .setDesc("Brief description")
      .addText((text) => {
        taglineInput = text;
        text.setPlaceholder("A short description").onChange((value) => {
          this.tagline = value;
        });
      });

    // Status
    new Setting(contentEl)
      .setName("Status")
      .setDesc("Current project status")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("concept", "Concept")
          .addOption("active", "Active")
          .addOption("maintained", "Maintained")
          .addOption("paused", "Paused")
          .addOption("archived", "Archived")
          .setValue(this.status)
          .onChange((value) => {
            this.status = value as ProjectStatus;
          })
      );

    // Tech stack
    new Setting(contentEl)
      .setName("Tech Stack")
      .setDesc("Comma-separated list of technologies")
      .addText((text) =>
        text.setPlaceholder("TypeScript, Vue, Node.js").onChange((value) => {
          this.techStack = value;
        })
      );

    // Create button
    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Create Project")
        .setCta()
        .onClick(async () => {
          await this.createProject();
        })
    );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  private async createProject() {
    if (!this.title || !this.slug) {
      new Notice("Title and slug are required");
      return;
    }

    const manifestService = this.plugin.manifestService;
    if (!manifestService) {
      new Notice("Manifest service not initialized");
      return;
    }

    try {
      // Parse tech stack
      const tech = this.techStack
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Get repo info
      const repoUrl = this.selectedRepo?.fullName || "";
      const isPrivate = this.selectedRepo?.private || false;

      // Create project directory first
      const projectDir = `${manifestService.contentBasePath}/projects/${this.slug}`;
      await manifestService.ensureDirectory(projectDir);

      // Fetch README if repo is selected
      let readmeContent = "";
      if (this.selectedRepo && this.plugin.githubService) {
        new Notice("Fetching README from GitHub...");
        const [owner, repo] = this.selectedRepo.fullName.split("/");
        try {
          readmeContent = await this.plugin.githubService.fetchReadmeFromRepo(owner, repo) || "";

          // Fetch images referenced in README
          if (readmeContent) {
            const imagePaths = this.plugin.githubService.extractImagePaths(readmeContent);
            if (imagePaths.length > 0) {
              new Notice(`Fetching ${imagePaths.length} images...`);

              for (const imagePath of imagePaths) {
                try {
                  const imageData = await this.plugin.githubService.fetchFileFromRepo(owner, repo, imagePath);
                  if (imageData) {
                    // Ensure directory exists for the image
                    const imageDir = imagePath.includes('/')
                      ? `${projectDir}/${imagePath.substring(0, imagePath.lastIndexOf('/'))}`
                      : projectDir;
                    await manifestService.ensureDirectory(imageDir);

                    // Save image
                    const imageSavePath = `${projectDir}/${imagePath}`;
                    await this.app.vault.createBinary(imageSavePath, imageData);
                  }
                } catch (imgError) {
                  console.log(`Failed to fetch image ${imagePath}:`, imgError);
                }
              }
            }
          }
        } catch (e) {
          console.log("No README found or failed to fetch:", e);
        }
      }

      // Create index.md with README content
      let indexContent = generateProjectIndexMd(
        this.title,
        this.tagline || "A new project",
        this.status,
        tech,
        repoUrl,
        isPrivate
      );

      // Append README content if available
      if (readmeContent) {
        // Remove the template content and use README instead
        const frontmatterEnd = indexContent.indexOf("---", 4) + 3;
        const frontmatter = indexContent.substring(0, frontmatterEnd);
        indexContent = frontmatter + "\n\n" + readmeContent;
      }

      await this.app.vault.create(`${projectDir}/index.md`, indexContent);

      // Create config.yaml
      const configContent = generateProjectConfigYaml(repoUrl);
      await this.app.vault.create(`${projectDir}/config.yaml`, configContent);

      // Create posts directory
      await manifestService.ensureDirectory(`${projectDir}/posts`);

      // Update manifest
      await manifestService.addProject({
        slug: this.slug,
        indexPath: `/content/projects/${this.slug}/index.md`,
        configPath: `/content/projects/${this.slug}/config.yaml`,
        posts: [],
      });

      new Notice(`Project "${this.title}" created successfully!`);
      this.close();

      // Refresh Site Structure view
      const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_STRUCTURE);
      for (const leaf of leaves) {
        const view = leaf.view as SiteStructureView;
        await view.refresh();
      }

      // Open the new project file
      const file = this.app.vault.getAbstractFileByPath(`${projectDir}/index.md`);
      if (file) {
        await this.app.workspace.getLeaf().openFile(file as any);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      new Notice(`Failed to create project: ${error}`);
    }
  }
}
