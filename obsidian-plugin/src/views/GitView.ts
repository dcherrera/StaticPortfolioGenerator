import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import type StaticPortfolioPlugin from "../main";
import { GitService, type GitStatus, type GitFile } from "../services/git";

export const VIEW_TYPE_GIT = "spg-git-view";

export class GitView extends ItemView {
  plugin: StaticPortfolioPlugin;
  gitService: GitService;
  status: GitStatus | null = null;
  commitMessage: string = "";

  constructor(leaf: WorkspaceLeaf, plugin: StaticPortfolioPlugin) {
    super(leaf);
    this.plugin = plugin;
    // Get vault path as cwd
    const vaultPath = (this.app.vault.adapter as any).basePath;
    this.gitService = new GitService(vaultPath);
  }

  getViewType(): string {
    return VIEW_TYPE_GIT;
  }

  getDisplayText(): string {
    return "Git";
  }

  getIcon(): string {
    return "arrow-up-down";
  }

  async onOpen() {
    await this.refresh();
  }

  async onClose() {
    // Cleanup
  }

  async refresh() {
    try {
      this.status = await this.gitService.getStatus();
      await this.render();
    } catch (error) {
      console.error("Failed to get git status:", error);
      this.renderError("Failed to get git status. Is this a git repository?");
    }
  }

  private renderError(message: string) {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("div", {
      text: message,
      cls: "spg-git-error",
    });
  }

  private async render() {
    const container = this.containerEl.children[1];
    container.empty();

    if (!this.status) return;

    // Header with branch info
    const header = container.createEl("div", { cls: "spg-git-header" });

    const branchInfo = header.createEl("div", { cls: "spg-git-branch" });
    branchInfo.createEl("span", { text: "⎇ ", cls: "spg-git-branch-icon" });
    branchInfo.createEl("span", { text: this.status.branch, cls: "spg-git-branch-name" });

    if (this.status.ahead > 0 || this.status.behind > 0) {
      const syncStatus = branchInfo.createEl("span", { cls: "spg-git-sync" });
      if (this.status.ahead > 0) {
        syncStatus.createEl("span", { text: `↑${this.status.ahead}`, cls: "spg-git-ahead" });
      }
      if (this.status.behind > 0) {
        syncStatus.createEl("span", { text: `↓${this.status.behind}`, cls: "spg-git-behind" });
      }
    }

    const refreshBtn = header.createEl("button", { text: "↻", cls: "spg-git-refresh" });
    refreshBtn.addEventListener("click", () => this.refresh());

    // Changes section
    const changesSection = container.createEl("div", { cls: "spg-git-section" });

    const totalChanges =
      this.status.staged.length +
      this.status.unstaged.length +
      this.status.untracked.length;

    // Staged files
    if (this.status.staged.length > 0) {
      this.renderFileGroup(changesSection, "Staged Changes", this.status.staged, true);
    }

    // Unstaged files
    if (this.status.unstaged.length > 0) {
      this.renderFileGroup(changesSection, "Changes", this.status.unstaged, false);
    }

    // Untracked files
    if (this.status.untracked.length > 0) {
      this.renderFileGroup(changesSection, "Untracked", this.status.untracked, false);
    }

    // No changes message
    if (totalChanges === 0) {
      changesSection.createEl("div", {
        text: "No changes",
        cls: "spg-git-empty",
      });
    }

    // Commit section (only show if there are staged changes)
    if (this.status.staged.length > 0 || totalChanges > 0) {
      const commitSection = container.createEl("div", { cls: "spg-git-commit-section" });

      // Stage all button (if there are unstaged changes)
      if (this.status.unstaged.length > 0 || this.status.untracked.length > 0) {
        const stageAllBtn = commitSection.createEl("button", {
          text: "Stage All",
          cls: "spg-git-btn spg-git-btn-secondary",
        });
        stageAllBtn.addEventListener("click", async () => {
          await this.gitService.stageAll();
          await this.refresh();
        });
      }

      // Commit message input
      const textarea = commitSection.createEl("textarea", {
        cls: "spg-git-commit-input",
        attr: { placeholder: "Commit message..." },
      });
      textarea.value = this.commitMessage;
      textarea.addEventListener("input", (e) => {
        this.commitMessage = (e.target as HTMLTextAreaElement).value;
      });

      // Commit button
      const commitBtn = commitSection.createEl("button", {
        text: "Commit",
        cls: "spg-git-btn spg-git-btn-primary",
      });
      commitBtn.addEventListener("click", async () => {
        if (!this.commitMessage.trim()) {
          new Notice("Please enter a commit message");
          return;
        }
        if (this.status?.staged.length === 0) {
          new Notice("No staged changes to commit");
          return;
        }
        try {
          await this.gitService.commit(this.commitMessage);
          this.commitMessage = "";
          new Notice("Committed successfully");
          await this.refresh();
        } catch (error) {
          new Notice(`Commit failed: ${error}`);
        }
      });
    }

    // Push/Pull section
    const syncSection = container.createEl("div", { cls: "spg-git-sync-section" });

    if (this.status.behind > 0) {
      const pullBtn = syncSection.createEl("button", {
        text: `Pull (${this.status.behind})`,
        cls: "spg-git-btn spg-git-btn-secondary",
      });
      pullBtn.addEventListener("click", async () => {
        try {
          await this.gitService.pull();
          new Notice("Pulled successfully");
          await this.refresh();
        } catch (error) {
          new Notice(`Pull failed: ${error}`);
        }
      });
    }

    if (this.status.ahead > 0) {
      const pushBtn = syncSection.createEl("button", {
        text: `Push (${this.status.ahead})`,
        cls: "spg-git-btn spg-git-btn-primary",
      });
      pushBtn.addEventListener("click", async () => {
        try {
          await this.gitService.push();
          new Notice("Pushed successfully");
          await this.refresh();
        } catch (error) {
          new Notice(`Push failed: ${error}`);
        }
      });
    }
  }

  private renderFileGroup(
    container: HTMLElement,
    title: string,
    files: GitFile[],
    isStaged: boolean
  ) {
    const group = container.createEl("div", { cls: "spg-git-group" });

    const groupHeader = group.createEl("div", { cls: "spg-git-group-header" });
    groupHeader.createEl("span", { text: title, cls: "spg-git-group-title" });
    groupHeader.createEl("span", { text: `(${files.length})`, cls: "spg-git-group-count" });

    const fileList = group.createEl("div", { cls: "spg-git-files" });

    for (const file of files) {
      const fileItem = fileList.createEl("div", { cls: "spg-git-file" });

      // Status indicator
      const statusIcon = this.getStatusIcon(file.status);
      fileItem.createEl("span", {
        text: statusIcon,
        cls: `spg-git-file-status spg-git-status-${file.status}`
      });

      // File path
      const fileName = file.path.split("/").pop() || file.path;
      const fileDir = file.path.includes("/")
        ? file.path.substring(0, file.path.lastIndexOf("/")) + "/"
        : "";

      const pathEl = fileItem.createEl("span", { cls: "spg-git-file-path" });
      if (fileDir) {
        pathEl.createEl("span", { text: fileDir, cls: "spg-git-file-dir" });
      }
      pathEl.createEl("span", { text: fileName, cls: "spg-git-file-name" });

      // Stage/Unstage button
      const actionBtn = fileItem.createEl("button", {
        text: isStaged ? "−" : "+",
        cls: "spg-git-file-action",
        attr: { "aria-label": isStaged ? "Unstage" : "Stage" },
      });
      actionBtn.addEventListener("click", async () => {
        if (isStaged) {
          await this.gitService.unstageFile(file.path);
        } else {
          await this.gitService.stageFile(file.path);
        }
        await this.refresh();
      });
    }
  }

  private getStatusIcon(status: GitFile["status"]): string {
    switch (status) {
      case "modified":
        return "M";
      case "added":
        return "A";
      case "deleted":
        return "D";
      case "renamed":
        return "R";
      default:
        return "?";
    }
  }
}
