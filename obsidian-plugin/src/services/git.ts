import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: GitFile[];
  unstaged: GitFile[];
  untracked: GitFile[];
}

export interface GitFile {
  path: string;
  status: "modified" | "added" | "deleted" | "renamed";
}

export class GitService {
  private cwd: string;

  constructor(cwd: string) {
    this.cwd = cwd;
  }

  private async run(command: string): Promise<string> {
    try {
      const { stdout } = await execAsync(command, { cwd: this.cwd });
      return stdout.trim();
    } catch (error: any) {
      if (error.stdout) return error.stdout.trim();
      throw error;
    }
  }

  async getStatus(): Promise<GitStatus> {
    const branch = await this.getCurrentBranch();
    const { ahead, behind } = await this.getAheadBehind();
    const statusOutput = await this.run("git status --porcelain");

    const staged: GitFile[] = [];
    const unstaged: GitFile[] = [];
    const untracked: GitFile[] = [];

    for (const line of statusOutput.split("\n")) {
      if (!line) continue;

      const indexStatus = line[0];
      const workTreeStatus = line[1];
      const path = line.slice(3);

      // Staged changes (index)
      if (indexStatus !== " " && indexStatus !== "?") {
        staged.push({
          path,
          status: this.parseStatus(indexStatus),
        });
      }

      // Unstaged changes (work tree)
      if (workTreeStatus !== " " && workTreeStatus !== "?") {
        unstaged.push({
          path,
          status: this.parseStatus(workTreeStatus),
        });
      }

      // Untracked files
      if (indexStatus === "?" && workTreeStatus === "?") {
        untracked.push({
          path,
          status: "added",
        });
      }
    }

    return { branch, ahead, behind, staged, unstaged, untracked };
  }

  private parseStatus(char: string): GitFile["status"] {
    switch (char) {
      case "M":
        return "modified";
      case "A":
        return "added";
      case "D":
        return "deleted";
      case "R":
        return "renamed";
      default:
        return "modified";
    }
  }

  async getCurrentBranch(): Promise<string> {
    return await this.run("git branch --show-current");
  }

  async getAheadBehind(): Promise<{ ahead: number; behind: number }> {
    try {
      const output = await this.run(
        "git rev-list --left-right --count @{upstream}...HEAD"
      );
      const [behind, ahead] = output.split("\t").map(Number);
      return { ahead: ahead || 0, behind: behind || 0 };
    } catch {
      return { ahead: 0, behind: 0 };
    }
  }

  async stageFile(path: string): Promise<void> {
    await this.run(`git add "${path}"`);
  }

  async unstageFile(path: string): Promise<void> {
    await this.run(`git reset HEAD "${path}"`);
  }

  async stageAll(): Promise<void> {
    await this.run("git add -A");
  }

  async unstageAll(): Promise<void> {
    await this.run("git reset HEAD");
  }

  async commit(message: string): Promise<void> {
    // Use heredoc-style to handle multiline messages
    const escapedMessage = message.replace(/"/g, '\\"');
    await this.run(`git commit -m "${escapedMessage}"`);
  }

  async push(): Promise<void> {
    await this.run("git push");
  }

  async pull(): Promise<void> {
    await this.run("git pull");
  }
}
