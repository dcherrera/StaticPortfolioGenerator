import { Plugin, Notice, TFile } from "obsidian";
import { parse as parseYaml } from "yaml";
import { SettingsTab } from "./settings";
import {
  CONTENT_PATH,
  DEFAULT_SETTINGS,
  VIEW_TYPE_COMMITS,
  VIEW_TYPE_STRUCTURE,
  type PluginSettings,
  type ProjectConfig,
} from "./types";
import { ManifestService } from "./services/manifest";
import { GitHubService } from "./services/github";
import { NewProjectModal } from "./modals/NewProjectModal";
import { NewBlogPostModal } from "./modals/NewBlogPostModal";
import { NewPageModal } from "./modals/NewPageModal";
import { CommitCurationView } from "./views/CommitCurationView";
import { SiteStructureView } from "./views/SiteStructureView";
import { CodeEditorView, VIEW_TYPE_CODE } from "./views/CodeEditorView";
import { GitView, VIEW_TYPE_GIT } from "./views/GitView";
import { SiteSettingsView, VIEW_TYPE_SITE_SETTINGS } from "./views/SiteSettingsView";

export default class StaticPortfolioPlugin extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;
  manifestService: ManifestService | null = null;
  githubService: GitHubService | null = null;

  async onload() {
    await this.loadSettings();

    // Enable "Detect all file extensions" so .vue, .ts, .js, etc. show in file explorer
    this.enableAllFileExtensions();

    // Initialize services
    this.manifestService = new ManifestService(this.app);
    this.githubService = new GitHubService(this.app, this.settings);

    // Register views
    this.registerView(
      VIEW_TYPE_COMMITS,
      (leaf) => new CommitCurationView(leaf, this)
    );
    this.registerView(
      VIEW_TYPE_STRUCTURE,
      (leaf) => new SiteStructureView(leaf, this)
    );
    this.registerView(
      VIEW_TYPE_CODE,
      (leaf) => new CodeEditorView(leaf)
    );
    this.registerView(
      VIEW_TYPE_GIT,
      (leaf) => new GitView(leaf, this)
    );
    this.registerView(
      VIEW_TYPE_SITE_SETTINGS,
      (leaf) => new SiteSettingsView(leaf, this)
    );

    // Register code extensions - must happen after view is registered
    this.registerCodeExtensions();

    // Add ribbon icons
    this.addRibbonIcon("git-commit", "Commit Curation", () => {
      this.activateView(VIEW_TYPE_COMMITS);
    });

    this.addRibbonIcon("folder-tree", "Site Structure", () => {
      this.activateView(VIEW_TYPE_STRUCTURE);
    });

    this.addRibbonIcon("arrow-up-down", "Git", () => {
      this.activateView(VIEW_TYPE_GIT);
    });

    this.addRibbonIcon("sliders-horizontal", "Site Settings", () => {
      this.activateView(VIEW_TYPE_SITE_SETTINGS);
    });

    // Register commands
    this.addCommand({
      id: "new-project",
      name: "New Project",
      callback: () => {
        new NewProjectModal(this.app, this).open();
      },
    });

    this.addCommand({
      id: "new-blog-post",
      name: "New Blog Post",
      callback: () => {
        new NewBlogPostModal(this.app, this).open();
      },
    });

    this.addCommand({
      id: "new-page",
      name: "New Page",
      callback: () => {
        new NewPageModal(this.app, this).open();
      },
    });

    this.addCommand({
      id: "pull-readme",
      name: "Pull README from GitHub",
      callback: async () => {
        await this.pullReadme();
      },
    });

    this.addCommand({
      id: "refresh-commits",
      name: "Refresh Commits",
      callback: async () => {
        await this.refreshCommits();
      },
    });

    this.addCommand({
      id: "open-commits-view",
      name: "Open Commit Curation",
      callback: () => {
        this.activateView(VIEW_TYPE_COMMITS);
      },
    });

    this.addCommand({
      id: "open-structure-view",
      name: "Open Site Structure",
      callback: () => {
        this.activateView(VIEW_TYPE_STRUCTURE);
      },
    });

    this.addCommand({
      id: "open-git-view",
      name: "Open Git",
      callback: () => {
        this.activateView(VIEW_TYPE_GIT);
      },
    });

    this.addCommand({
      id: "open-site-settings",
      name: "Open Site Settings",
      callback: () => {
        this.activateView(VIEW_TYPE_SITE_SETTINGS);
      },
    });

    // Add settings tab
    this.addSettingTab(new SettingsTab(this.app, this));

    console.log("Static Portfolio Generator plugin loaded");
  }

  onunload() {
    console.log("Static Portfolio Generator plugin unloaded");
  }

  enableAllFileExtensions() {
    // Enable showing all file types in the file explorer
    const config = (this.app.vault as any).config;
    if (config && !config.showUnsupportedFiles) {
      (this.app.vault as any).setConfig("showUnsupportedFiles", true);
      console.log("Enabled 'Detect all file extensions' for code file editing");
    }
  }

  registerCodeExtensions() {
    const codeExtensions = [
      "vue", "ts", "tsx", "js", "jsx", "mjs", "cjs",
      "html", "htm", "css", "scss", "sass", "less",
      "json", "yaml", "yml", "toml",
      "sh", "bash", "zsh", "fish",
      "py", "rb", "go", "rs", "java", "kt", "swift",
      "c", "cpp", "h", "hpp",
      "sql", "graphql", "gql",
      "xml", "svg",
      "env", "gitignore", "dockerignore",
      "dockerfile", "makefile",
      "conf", "ini", "cfg"
    ];

    // Register each extension individually to handle conflicts
    for (const ext of codeExtensions) {
      try {
        this.registerExtensions([ext], VIEW_TYPE_CODE);
      } catch (e) {
        // Extension may already be registered by another plugin
        console.log(`Extension .${ext} already registered`);
      }
    }
    console.log("Code file extension registration complete");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    // Update GitHub service with new token
    if (this.githubService) {
      this.githubService.updateSettings(this.settings);
    }
  }

  async activateView(viewType: string) {
    const { workspace } = this.app;

    let leaf = workspace.getLeavesOfType(viewType)[0];

    if (!leaf) {
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        leaf = rightLeaf;
        await leaf.setViewState({ type: viewType, active: true });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  async pullReadme() {
    if (!this.settings.githubToken) {
      new Notice("Please set your GitHub token in plugin settings");
      return;
    }

    if (!this.githubService) {
      new Notice("GitHub service not initialized");
      return;
    }

    // Get active file to determine project
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice("No active file. Open a project file first.");
      return;
    }

    // Find project from path
    const manifest = await this.manifestService?.loadManifest();
    if (!manifest) {
      new Notice("Could not load manifest");
      return;
    }

    const project = manifest.projects.find((p) =>
      activeFile.path.includes(`projects/${p.slug}/`)
    );

    if (!project) {
      new Notice("Current file is not in a project folder");
      return;
    }

    // Load project config to get repo URL
    if (!project.configPath) {
      new Notice("Project has no config.yaml - cannot determine repo");
      return;
    }

    const configPath = `${CONTENT_PATH}${project.configPath.replace("/content", "")}`;
    const configFile = this.app.vault.getAbstractFileByPath(configPath);

    if (!configFile || !(configFile instanceof TFile)) {
      new Notice("Could not find project config.yaml");
      return;
    }

    let config: ProjectConfig;
    try {
      const configContent = await this.app.vault.read(configFile);
      config = parseYaml(configContent) as ProjectConfig;
    } catch (error) {
      new Notice(`Failed to parse config.yaml: ${error}`);
      return;
    }

    if (!config.repo) {
      new Notice("No repo configured in config.yaml");
      return;
    }

    const parsed = this.githubService.parseRepoUrl(config.repo);
    if (!parsed) {
      new Notice(`Could not parse repo URL: ${config.repo}`);
      return;
    }

    new Notice(`Pulling README for ${project.slug}...`);

    try {
      // Fetch README content
      const readme = await this.githubService.fetchReadmeFromRepo(parsed.owner, parsed.repo);
      if (!readme) {
        new Notice("Could not fetch README from GitHub");
        return;
      }

      // Find image references in markdown
      // Matches: ![alt](url) where url is relative path or raw GitHub URL
      const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      const images: { match: string; alt: string; url: string }[] = [];
      let match;

      while ((match = imageRegex.exec(readme)) !== null) {
        images.push({ match: match[0], alt: match[1], url: match[2] });
      }

      // Process images and rewrite paths
      let processedReadme = readme;
      const imagesPath = `${CONTENT_PATH}/projects/${project.slug}/images`;

      // Ensure images directory exists
      const imagesDir = this.app.vault.getAbstractFileByPath(imagesPath);
      if (!imagesDir) {
        await this.app.vault.createFolder(imagesPath);
      }

      for (const img of images) {
        let imagePath: string;
        const filename = img.url.split("/").pop() || "image.png";

        // Determine the path to fetch from GitHub
        if (img.url.startsWith("http://") || img.url.startsWith("https://")) {
          // Raw GitHub URL - extract path
          // https://raw.githubusercontent.com/owner/repo/branch/path/to/image.png
          const rawMatch = img.url.match(
            /raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/(.+)$/
          );
          if (rawMatch) {
            imagePath = rawMatch[1];
          } else {
            // External URL - skip, keep as-is
            console.log(`Skipping external image: ${img.url}`);
            continue;
          }
        } else if (img.url.startsWith("./")) {
          // Relative path from repo root
          imagePath = img.url.substring(2);
        } else if (!img.url.startsWith("/")) {
          // Relative path without ./
          imagePath = img.url;
        } else {
          // Absolute path - use as-is
          imagePath = img.url.substring(1);
        }

        // Download the image
        console.log(`Downloading image: ${imagePath}`);
        const imageData = await this.githubService.fetchFileContent(
          parsed.owner,
          parsed.repo,
          imagePath
        );

        if (imageData) {
          // Save image to local vault
          const localPath = `${imagesPath}/${filename}`;
          const existingFile = this.app.vault.getAbstractFileByPath(localPath);

          if (existingFile && existingFile instanceof TFile) {
            await this.app.vault.modifyBinary(existingFile, imageData);
          } else {
            await this.app.vault.createBinary(localPath, imageData);
          }

          // Rewrite path in README
          const newUrl = `/content/projects/${project.slug}/images/${filename}`;
          processedReadme = processedReadme.replace(img.match, `![${img.alt}](${newUrl})`);
          console.log(`Saved image: ${localPath}`);
        } else {
          console.log(`Failed to download image: ${imagePath}`);
        }
      }

      // Append processed README to project index.md
      const indexPath = `${CONTENT_PATH}${project.indexPath.replace("/content", "")}`;
      const file = this.app.vault.getAbstractFileByPath(indexPath);

      if (file && file instanceof TFile) {
        const content = await this.app.vault.read(file);
        const newContent = content + "\n\n---\n\n## From README\n\n" + processedReadme;
        await this.app.vault.modify(file, newContent);
        new Notice(`README pulled with ${images.length} images processed`);
      } else {
        new Notice("Could not find project index.md");
      }
    } catch (error) {
      new Notice(`Failed to pull README: ${error}`);
      console.error("Pull README error:", error);
    }
  }

  async refreshCommits() {
    if (!this.settings.githubToken) {
      new Notice("Please set your GitHub token in plugin settings");
      return;
    }

    new Notice("Refreshing commits...");

    try {
      await this.githubService?.refreshAllCommits(this.manifestService!);
      new Notice("Commits refreshed successfully");

      // Refresh the commits view if open
      const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_COMMITS);
      for (const leaf of leaves) {
        const view = leaf.view as CommitCurationView;
        await view.refresh();
      }
    } catch (error) {
      new Notice(`Failed to refresh commits: ${error}`);
    }
  }
}
