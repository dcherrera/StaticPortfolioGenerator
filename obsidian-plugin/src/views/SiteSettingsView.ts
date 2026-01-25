import { ItemView, WorkspaceLeaf, Notice, TFile } from "obsidian";
import type StaticPortfolioPlugin from "../main";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { CONTENT_PATH } from "../types";

export const VIEW_TYPE_SITE_SETTINGS = "spg-site-settings-view";

interface NavLink {
  label: string;
  path: string;
}

interface SocialLink {
  label: string;
  url: string;
}

interface HeroButton {
  label: string;
  path: string;
  style: "primary" | "outline";
}

interface SiteConfig {
  site: {
    title: string;
    description?: string;
  };
  header: {
    title: string;
    logo?: string;
    nav: NavLink[];
  };
  footer: {
    copyright: string;
    github?: string;
    socialLinks?: SocialLink[];
  };
  homepage: {
    hero: {
      title: string;
      subtitle?: string[];
      buttons?: HeroButton[];
    };
    showFeaturedProjects?: boolean;
    showRecentPosts?: boolean;
    projectsLimit?: number;
    postsLimit?: number;
  };
}

const defaultConfig: SiteConfig = {
  site: {
    title: "My Portfolio",
    description: "Developer portfolio",
  },
  header: {
    title: "My Name",
    nav: [
      { label: "Projects", path: "/projects" },
      { label: "Blog", path: "/blog" },
      { label: "About", path: "/about" },
    ],
  },
  footer: {
    copyright: `${new Date().getFullYear()} My Name`,
    github: "https://github.com/username",
    socialLinks: [],
  },
  homepage: {
    hero: {
      title: "Hi, I'm [Name]",
      subtitle: ["Software Developer"],
      buttons: [
        { label: "View Projects", path: "/projects", style: "primary" },
        { label: "About Me", path: "/about", style: "outline" },
      ],
    },
    showFeaturedProjects: true,
    showRecentPosts: true,
    projectsLimit: 4,
    postsLimit: 3,
  },
};

export class SiteSettingsView extends ItemView {
  plugin: StaticPortfolioPlugin;
  config: SiteConfig = defaultConfig;

  constructor(leaf: WorkspaceLeaf, plugin: StaticPortfolioPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_SITE_SETTINGS;
  }

  getDisplayText(): string {
    return "Site Settings";
  }

  getIcon(): string {
    return "settings";
  }

  async onOpen() {
    await this.loadConfig();
    await this.render();
  }

  async onClose() {
    // Cleanup
  }

  async loadConfig() {
    const configPath = `${CONTENT_PATH}/site.yaml`;
    const file = this.app.vault.getAbstractFileByPath(configPath);

    if (file && file instanceof TFile) {
      try {
        const content = await this.app.vault.read(file);
        this.config = { ...defaultConfig, ...parseYaml(content) };
      } catch (error) {
        console.error("Failed to load site config:", error);
        this.config = defaultConfig;
      }
    } else {
      this.config = defaultConfig;
    }
  }

  async saveConfig() {
    const configPath = `${CONTENT_PATH}/site.yaml`;
    const content = stringifyYaml(this.config);

    const file = this.app.vault.getAbstractFileByPath(configPath);
    if (file && file instanceof TFile) {
      await this.app.vault.modify(file, content);
    } else {
      await this.app.vault.create(configPath, content);
    }

    new Notice("Site settings saved");
  }

  async render() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("spg-site-settings");

    // Header
    const header = container.createEl("div", { cls: "spg-settings-header" });
    header.createEl("h4", { text: "Site Settings" });
    const saveBtn = header.createEl("button", { text: "Save", cls: "spg-save-btn" });
    saveBtn.addEventListener("click", () => this.saveConfig());

    // Site Section
    this.renderSection(container, "Site", [
      { key: "site.title", label: "Site Title", value: this.config.site.title },
      { key: "site.description", label: "Description", value: this.config.site.description || "" },
    ]);

    // Header Section
    this.renderSection(container, "Header", [
      { key: "header.title", label: "Header Title", value: this.config.header.title },
    ]);

    // Nav Links
    this.renderNavLinks(container);

    // Footer Section
    this.renderSection(container, "Footer", [
      { key: "footer.copyright", label: "Copyright Text", value: this.config.footer.copyright },
      { key: "footer.github", label: "GitHub URL", value: this.config.footer.github || "" },
    ]);

    // Social Links
    this.renderSocialLinks(container);

    // Homepage Section
    this.renderSection(container, "Homepage Hero", [
      { key: "homepage.hero.title", label: "Hero Title", value: this.config.homepage.hero.title },
    ]);

    // Subtitle Lines
    this.renderSubtitleLines(container);

    // Hero Buttons
    this.renderHeroButtons(container);
  }

  renderHeroButtons(container: HTMLElement) {
    const section = container.createEl("div", { cls: "spg-settings-section" });
    const headerEl = section.createEl("div", { cls: "spg-section-header-row" });
    headerEl.createEl("h5", { text: "Hero Buttons", cls: "spg-section-title" });

    const addBtn = headerEl.createEl("button", { text: "+", cls: "spg-add-btn-small" });
    addBtn.addEventListener("click", () => {
      if (!this.config.homepage.hero.buttons) {
        this.config.homepage.hero.buttons = [];
      }
      this.config.homepage.hero.buttons.push({ label: "New Button", path: "/", style: "outline" });
      this.render();
    });

    const list = section.createEl("div", { cls: "spg-links-list" });

    (this.config.homepage.hero.buttons || []).forEach((btn, index) => {
      const item = list.createEl("div", { cls: "spg-link-item" });

      const labelInput = item.createEl("input", {
        type: "text",
        value: btn.label,
        placeholder: "Label",
        cls: "spg-input spg-input-small",
      });
      labelInput.addEventListener("change", (e) => {
        if (this.config.homepage.hero.buttons) {
          this.config.homepage.hero.buttons[index].label = (e.target as HTMLInputElement).value;
        }
      });

      const pathInput = item.createEl("input", {
        type: "text",
        value: btn.path,
        placeholder: "Path",
        cls: "spg-input spg-input-small",
      });
      pathInput.addEventListener("change", (e) => {
        if (this.config.homepage.hero.buttons) {
          this.config.homepage.hero.buttons[index].path = (e.target as HTMLInputElement).value;
        }
      });

      const styleSelect = item.createEl("select", { cls: "spg-select" });
      const primaryOpt = styleSelect.createEl("option", { value: "primary", text: "Primary" });
      const outlineOpt = styleSelect.createEl("option", { value: "outline", text: "Outline" });
      if (btn.style === "primary") primaryOpt.selected = true;
      else outlineOpt.selected = true;

      styleSelect.addEventListener("change", (e) => {
        if (this.config.homepage.hero.buttons) {
          this.config.homepage.hero.buttons[index].style = (e.target as HTMLSelectElement).value as "primary" | "outline";
        }
      });

      const removeBtn = item.createEl("button", { text: "×", cls: "spg-remove-btn" });
      removeBtn.addEventListener("click", () => {
        if (this.config.homepage.hero.buttons) {
          this.config.homepage.hero.buttons.splice(index, 1);
          this.render();
        }
      });
    });
  }

  renderSubtitleLines(container: HTMLElement) {
    const section = container.createEl("div", { cls: "spg-settings-section" });
    const headerEl = section.createEl("div", { cls: "spg-section-header-row" });
    headerEl.createEl("h5", { text: "Hero Subtitle Lines", cls: "spg-section-title" });

    const addBtn = headerEl.createEl("button", { text: "+", cls: "spg-add-btn-small" });
    addBtn.addEventListener("click", () => {
      if (!this.config.homepage.hero.subtitle) {
        this.config.homepage.hero.subtitle = [];
      }
      this.config.homepage.hero.subtitle.push("New line");
      this.render();
    });

    const list = section.createEl("div", { cls: "spg-links-list" });

    (this.config.homepage.hero.subtitle || []).forEach((line, index) => {
      const item = list.createEl("div", { cls: "spg-link-item" });

      const input = item.createEl("input", {
        type: "text",
        value: line,
        placeholder: "Subtitle line",
        cls: "spg-input",
      });
      input.addEventListener("change", (e) => {
        if (this.config.homepage.hero.subtitle) {
          this.config.homepage.hero.subtitle[index] = (e.target as HTMLInputElement).value;
        }
      });

      const removeBtn = item.createEl("button", { text: "×", cls: "spg-remove-btn" });
      removeBtn.addEventListener("click", () => {
        if (this.config.homepage.hero.subtitle) {
          this.config.homepage.hero.subtitle.splice(index, 1);
          this.render();
        }
      });
    });
  }

  renderSection(
    container: HTMLElement,
    title: string,
    fields: Array<{ key: string; label: string; value: string; multiline?: boolean }>
  ) {
    const section = container.createEl("div", { cls: "spg-settings-section" });
    section.createEl("h5", { text: title, cls: "spg-section-title" });

    for (const field of fields) {
      const fieldEl = section.createEl("div", { cls: "spg-field" });
      fieldEl.createEl("label", { text: field.label });

      if (field.multiline) {
        const textarea = fieldEl.createEl("textarea", {
          cls: "spg-input spg-textarea",
        });
        textarea.value = field.value;
        textarea.rows = 3;
        textarea.addEventListener("change", (e) => {
          this.setNestedValue(field.key, (e.target as HTMLTextAreaElement).value);
        });
      } else {
        const input = fieldEl.createEl("input", {
          type: "text",
          value: field.value,
          cls: "spg-input",
        });
        input.addEventListener("change", (e) => {
          this.setNestedValue(field.key, (e.target as HTMLInputElement).value);
        });
      }
    }
  }

  renderNavLinks(container: HTMLElement) {
    const section = container.createEl("div", { cls: "spg-settings-section" });
    const headerEl = section.createEl("div", { cls: "spg-section-header-row" });
    headerEl.createEl("h5", { text: "Navigation Links", cls: "spg-section-title" });

    const addBtn = headerEl.createEl("button", { text: "+", cls: "spg-add-btn-small" });
    addBtn.addEventListener("click", () => {
      this.config.header.nav.push({ label: "New Link", path: "/new" });
      this.render();
    });

    const list = section.createEl("div", { cls: "spg-links-list" });

    this.config.header.nav.forEach((link, index) => {
      const item = list.createEl("div", { cls: "spg-link-item" });

      const labelInput = item.createEl("input", {
        type: "text",
        value: link.label,
        placeholder: "Label",
        cls: "spg-input spg-input-small",
      });
      labelInput.addEventListener("change", (e) => {
        this.config.header.nav[index].label = (e.target as HTMLInputElement).value;
      });

      const pathInput = item.createEl("input", {
        type: "text",
        value: link.path,
        placeholder: "Path",
        cls: "spg-input spg-input-small",
      });
      pathInput.addEventListener("change", (e) => {
        this.config.header.nav[index].path = (e.target as HTMLInputElement).value;
      });

      const removeBtn = item.createEl("button", { text: "×", cls: "spg-remove-btn" });
      removeBtn.addEventListener("click", () => {
        this.config.header.nav.splice(index, 1);
        this.render();
      });
    });
  }

  renderSocialLinks(container: HTMLElement) {
    const section = container.createEl("div", { cls: "spg-settings-section" });
    const headerEl = section.createEl("div", { cls: "spg-section-header-row" });
    headerEl.createEl("h5", { text: "Social Links", cls: "spg-section-title" });

    const addBtn = headerEl.createEl("button", { text: "+", cls: "spg-add-btn-small" });
    addBtn.addEventListener("click", () => {
      if (!this.config.footer.socialLinks) {
        this.config.footer.socialLinks = [];
      }
      this.config.footer.socialLinks.push({ label: "Link", url: "https://" });
      this.render();
    });

    const list = section.createEl("div", { cls: "spg-links-list" });

    (this.config.footer.socialLinks || []).forEach((link, index) => {
      const item = list.createEl("div", { cls: "spg-link-item" });

      const labelInput = item.createEl("input", {
        type: "text",
        value: link.label,
        placeholder: "Label",
        cls: "spg-input spg-input-small",
      });
      labelInput.addEventListener("change", (e) => {
        if (this.config.footer.socialLinks) {
          this.config.footer.socialLinks[index].label = (e.target as HTMLInputElement).value;
        }
      });

      const urlInput = item.createEl("input", {
        type: "text",
        value: link.url,
        placeholder: "URL",
        cls: "spg-input spg-input-small",
      });
      urlInput.addEventListener("change", (e) => {
        if (this.config.footer.socialLinks) {
          this.config.footer.socialLinks[index].url = (e.target as HTMLInputElement).value;
        }
      });

      const removeBtn = item.createEl("button", { text: "×", cls: "spg-remove-btn" });
      removeBtn.addEventListener("click", () => {
        if (this.config.footer.socialLinks) {
          this.config.footer.socialLinks.splice(index, 1);
          this.render();
        }
      });
    });
  }

  setNestedValue(path: string, value: string) {
    const keys = path.split(".");
    let obj: any = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
  }
}
