import { ItemView, WorkspaceLeaf, TFile } from "obsidian";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type StaticPortfolioPlugin from "../main";
import { CONTENT_PATH, DATA_PATH, VIEW_TYPE_COMMITS, type ProjectConfig } from "../types";

export class CommitCurationView extends ItemView {
  plugin: StaticPortfolioPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: StaticPortfolioPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_COMMITS;
  }

  getDisplayText(): string {
    return "Commit Curation";
  }

  getIcon(): string {
    return "git-commit";
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
    header.createEl("h4", { text: "Commit Curation" });

    const refreshBtn = header.createEl("button", { text: "Refresh" });
    refreshBtn.addEventListener("click", async () => {
      await this.plugin.refreshCommits();
    });

    // Load manifest and commits
    const manifest = await this.plugin.manifestService?.loadManifest();
    if (!manifest) {
      container.createEl("p", { text: "Could not load manifest" });
      return;
    }

    if (manifest.projects.length === 0) {
      container.createEl("p", {
        text: "No projects found. Create a project first.",
        cls: "spg-empty-state",
      });
      return;
    }

    // Load commits cache
    const cacheFile = this.app.vault.getAbstractFileByPath(
      `${DATA_PATH}/commits-cache.json`
    );

    let commitsCache: Record<string, any> = {};
    if (cacheFile && cacheFile instanceof TFile) {
      try {
        const content = await this.app.vault.read(cacheFile);
        commitsCache = JSON.parse(content);
      } catch {
        // Cache doesn't exist or is invalid
      }
    }

    // Render each project's commits
    for (const project of manifest.projects) {
      const projectSection = container.createEl("div", { cls: "spg-project-section" });

      const projectHeader = projectSection.createEl("div", { cls: "spg-project-header" });
      projectHeader.createEl("h5", { text: project.slug });

      const projectCommits = commitsCache[project.slug]?.commits || [];

      if (projectCommits.length === 0) {
        projectSection.createEl("p", {
          text: "No commits. Click Refresh to fetch.",
          cls: "spg-empty-state",
        });
        continue;
      }

      // Load project config to get hidden commits
      let hiddenCommits: string[] = [];
      if (project.configPath) {
        const configPath = `${CONTENT_PATH}${project.configPath.replace("/content", "")}`;
        const configFile = this.app.vault.getAbstractFileByPath(configPath);
        if (configFile && configFile instanceof TFile) {
          try {
            const configContent = await this.app.vault.read(configFile);
            const config = parseYaml(configContent) as ProjectConfig;
            hiddenCommits = config.hiddenCommits || [];
          } catch {
            // Config doesn't exist or is invalid
          }
        }
      }

      const commitsList = projectSection.createEl("div", { cls: "spg-commits-list" });

      for (const commit of projectCommits) {
        const isHidden = hiddenCommits.includes(commit.sha);

        const commitItem = commitsList.createEl("div", {
          cls: `spg-commit-item ${isHidden ? "spg-commit-hidden" : ""}`,
        });

        const checkbox = commitItem.createEl("input", { type: "checkbox" });
        checkbox.checked = !isHidden;
        checkbox.addEventListener("change", async () => {
          await this.toggleCommitVisibility(project.slug, commit.sha, !checkbox.checked);
        });

        const commitInfo = commitItem.createEl("div", { cls: "spg-commit-info" });

        const message = commit.message.split("\n")[0];
        commitInfo.createEl("span", {
          text: message.length > 50 ? message.substring(0, 50) + "..." : message,
          cls: "spg-commit-message",
        });

        const meta = commitInfo.createEl("div", { cls: "spg-commit-meta" });
        meta.createEl("span", { text: commit.sha.substring(0, 7) });
        meta.createEl("span", { text: " • " });
        meta.createEl("span", { text: this.formatDate(commit.date) });
      }
    }
  }

  private async toggleCommitVisibility(
    projectSlug: string,
    sha: string,
    hidden: boolean
  ) {
    const manifest = await this.plugin.manifestService?.loadManifest();
    if (!manifest) return;

    const project = manifest.projects.find((p) => p.slug === projectSlug);
    if (!project?.configPath) return;

    const configPath = `${CONTENT_PATH}${project.configPath.replace("/content", "")}`;
    const configFile = this.app.vault.getAbstractFileByPath(configPath);

    if (!configFile || !(configFile instanceof TFile)) return;

    try {
      const content = await this.app.vault.read(configFile);
      const config = parseYaml(content) as ProjectConfig;

      if (!config.hiddenCommits) {
        config.hiddenCommits = [];
      }

      if (hidden) {
        if (!config.hiddenCommits.includes(sha)) {
          config.hiddenCommits.push(sha);
        }
      } else {
        config.hiddenCommits = config.hiddenCommits.filter((s) => s !== sha);
      }

      await this.app.vault.modify(configFile, stringifyYaml(config));
      await this.render();
    } catch (error) {
      console.error("Failed to update commit visibility:", error);
    }
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  }
}
