import { App, PluginSettingTab, Setting } from "obsidian";
import type StaticPortfolioPlugin from "./main";
import type { PluginSettings } from "./types";

export class SettingsTab extends PluginSettingTab {
  plugin: StaticPortfolioPlugin;

  constructor(app: App, plugin: StaticPortfolioPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Static Portfolio Generator Settings" });

    // GitHub token setting
    containerEl.createEl("h3", { text: "GitHub Integration" });

    const tokenSetting = new Setting(containerEl)
      .setName("GitHub Personal Access Token")
      .addText((text) =>
        text
          .setPlaceholder("ghp_xxxxxxxxxxxx")
          .setValue(this.plugin.settings.githubToken)
          .onChange(async (value) => {
            this.plugin.settings.githubToken = value;
            await this.plugin.saveSettings();
          })
      );

    // Add description with clickable link
    const descEl = tokenSetting.descEl;
    descEl.appendText("Required for fetching commits and README files. ");
    const link = descEl.createEl("a", {
      text: "Create a token here",
      href: "https://github.com/settings/tokens/new",
    });
    link.setAttr("target", "_blank");

    // Required scopes info
    const scopesEl = containerEl.createEl("div", { cls: "spg-token-scopes" });
    scopesEl.createEl("p", { text: "Required token scopes:" });
    const scopesList = scopesEl.createEl("ul");
    scopesList.createEl("li", { text: "repo (for private repositories)" });
    scopesList.createEl("li", { text: "public_repo (for public repositories only)" });
    const noteEl = scopesEl.createEl("p", { cls: "spg-token-note" });
    noteEl.appendText("Tip: Select ");
    noteEl.createEl("strong", { text: "public_repo" });
    noteEl.appendText(" if you only use public repos. Select ");
    noteEl.createEl("strong", { text: "repo" });
    noteEl.appendText(" for private repos.");

    // Help text
    containerEl.createEl("h3", { text: "Quick Start" });
    const helpEl = containerEl.createEl("div", { cls: "spg-settings-help" });
    helpEl.createEl("p", {
      text: "Use the command palette (Cmd/Ctrl + P) to access plugin commands:",
    });
    const commandList = helpEl.createEl("ul");
    commandList.createEl("li", { text: "SPG: New Project - Create a new project" });
    commandList.createEl("li", { text: "SPG: New Blog Post - Create a blog post" });
    commandList.createEl("li", { text: "SPG: New Page - Create a static page" });
    commandList.createEl("li", { text: "SPG: Pull README - Fetch README from GitHub" });
    commandList.createEl("li", { text: "SPG: Refresh Commits - Update commits cache" });
  }
}
