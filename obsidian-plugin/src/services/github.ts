import { App, TFile } from "obsidian";
import { Octokit } from "octokit";
import { parse as parseYaml } from "yaml";
import {
  CONTENT_PATH,
  DATA_PATH,
  type PluginSettings,
  type Commit,
  type CommitsCache,
  type ProjectConfig,
} from "../types";
import type { ManifestService } from "./manifest";

export class GitHubService {
  private app: App;
  private settings: PluginSettings;
  private octokit: Octokit | null = null;

  constructor(app: App, settings: PluginSettings) {
    this.app = app;
    this.settings = settings;
    this.initOctokit();
  }

  updateSettings(settings: PluginSettings) {
    this.settings = settings;
    this.initOctokit();
  }

  private initOctokit() {
    if (this.settings.githubToken) {
      this.octokit = new Octokit({ auth: this.settings.githubToken });
    } else {
      this.octokit = null;
    }
  }

  async fetchUserRepos(): Promise<Array<{ fullName: string; name: string; private: boolean; description: string | null }>> {
    if (!this.octokit) {
      throw new Error("GitHub token not configured");
    }

    try {
      const repos: Array<{ fullName: string; name: string; private: boolean; description: string | null }> = [];

      // Fetch all repos with pagination
      for await (const response of this.octokit.paginate.iterator(
        this.octokit.rest.repos.listForAuthenticatedUser,
        {
          per_page: 100,
          sort: "updated",
          direction: "desc",
        }
      )) {
        for (const repo of response.data) {
          repos.push({
            fullName: repo.full_name,
            name: repo.name,
            private: repo.private,
            description: repo.description,
          });
        }
      }

      return repos;
    } catch (error) {
      console.error("Failed to fetch user repos:", error);
      return [];
    }
  }

  async fetchFileFromRepo(owner: string, repo: string, path: string): Promise<ArrayBuffer | null> {
    if (!this.octokit) {
      throw new Error("GitHub token not configured");
    }

    try {
      // First get file info to get download URL
      const response = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      // Handle single file (not directory)
      if (!Array.isArray(response.data) && response.data.type === 'file') {
        // For private repos, use the content (base64 encoded)
        if (response.data.content) {
          const binary = atob(response.data.content.replace(/\n/g, ''));
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          return bytes.buffer;
        }

        // For large files (>1MB), GitHub returns empty content
        // Use git blob API to fetch the raw content
        if (response.data.sha) {
          try {
            const blobResponse = await this.octokit.rest.git.getBlob({
              owner,
              repo,
              file_sha: response.data.sha,
            });

            if (blobResponse.data.content && blobResponse.data.encoding === 'base64') {
              const binary = atob(blobResponse.data.content.replace(/\n/g, ''));
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
              }
              return bytes.buffer;
            }
          } catch (blobError) {
            console.warn(`Blob fetch failed for ${path}, trying download_url`);
          }
        }

        // Fallback to download_url for public repos
        if (response.data.download_url) {
          const binaryResponse = await fetch(response.data.download_url);
          return await binaryResponse.arrayBuffer();
        }
      }

      return null;
    } catch (error) {
      console.error(`Failed to fetch file ${path}:`, error);
      return null;
    }
  }

  extractImagePaths(markdown: string): string[] {
    const paths: string[] = [];

    // Match markdown images: ![alt](path)
    const mdImageRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
    let match;
    while ((match = mdImageRegex.exec(markdown)) !== null) {
      const path = match[1];
      // Only local paths, not URLs
      if (!path.startsWith('http://') && !path.startsWith('https://')) {
        paths.push(path.replace(/^\.\//, '')); // Remove leading ./
      }
    }

    // Match HTML images: <img src="path">
    const htmlImageRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    while ((match = htmlImageRegex.exec(markdown)) !== null) {
      const path = match[1];
      if (!path.startsWith('http://') && !path.startsWith('https://')) {
        paths.push(path.replace(/^\.\//, ''));
      }
    }

    return [...new Set(paths)]; // Remove duplicates
  }

  async fetchReadmeFromRepo(owner: string, repo: string): Promise<string | null> {
    if (!this.octokit) {
      throw new Error("GitHub token not configured");
    }

    try {
      const response = await this.octokit.rest.repos.getReadme({
        owner,
        repo,
        mediaType: {
          format: "raw",
        },
      });

      return response.data as unknown as string;
    } catch (error) {
      console.error("Failed to fetch README:", error);
      return null;
    }
  }

  async fetchFileContent(owner: string, repo: string, path: string): Promise<ArrayBuffer | null> {
    if (!this.octokit) {
      throw new Error("GitHub token not configured");
    }

    try {
      const response = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        mediaType: {
          format: "raw",
        },
      });

      // For raw format, response.data is the file content
      if (typeof response.data === "string") {
        // Text file - convert to ArrayBuffer
        const encoder = new TextEncoder();
        return encoder.encode(response.data).buffer;
      } else if (response.data instanceof ArrayBuffer) {
        return response.data;
      } else {
        // Binary file returned as base64
        const content = (response.data as any).content;
        if (content) {
          const binary = atob(content);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          return bytes.buffer;
        }
      }
      return null;
    } catch (error) {
      console.error(`Failed to fetch file ${path}:`, error);
      return null;
    }
  }

  async fetchCommits(
    owner: string,
    repo: string,
    limit: number = 20
  ): Promise<Commit[]> {
    if (!this.octokit) {
      throw new Error("GitHub token not configured");
    }

    try {
      const response = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: limit,
      });

      return response.data.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message,
        date: commit.commit.author?.date || new Date().toISOString(),
        author: commit.author?.login || commit.commit.author?.name || "unknown",
        url: commit.html_url,
        hidden: false,
      }));
    } catch (error) {
      console.error("Failed to fetch commits:", error);
      return [];
    }
  }

  async refreshAllCommits(manifestService: ManifestService): Promise<void> {
    const manifest = await manifestService.loadManifest();
    if (!manifest) {
      throw new Error("Could not load manifest");
    }

    // Load existing cache to preserve hidden states
    let existingCache: CommitsCache = {};
    const cachePath = `${DATA_PATH}/commits-cache.json`;
    const cacheFile = this.app.vault.getAbstractFileByPath(cachePath);
    if (cacheFile && cacheFile instanceof TFile) {
      try {
        const content = await this.app.vault.read(cacheFile);
        existingCache = JSON.parse(content);
      } catch {
        // Cache doesn't exist or is invalid
      }
    }

    const newCache: CommitsCache = {};

    for (const project of manifest.projects) {
      if (!project.configPath) continue;

      // Load project config to get repo
      const configPath = `${CONTENT_PATH}${project.configPath.replace("/content", "")}`;
      const configFile = this.app.vault.getAbstractFileByPath(configPath);

      if (!configFile || !(configFile instanceof TFile)) {
        console.log(`No config file for ${project.slug}`);
        continue;
      }

      try {
        const configContent = await this.app.vault.read(configFile);
        const config = parseYaml(configContent) as ProjectConfig;

        if (!config.repo) {
          console.log(`No repo configured for ${project.slug}`);
          continue;
        }

        const parsed = this.parseRepoUrl(config.repo);
        if (!parsed) {
          console.log(`Could not parse repo URL for ${project.slug}: ${config.repo}`);
          continue;
        }

        console.log(`Fetching commits for ${project.slug} from ${parsed.owner}/${parsed.repo}`);

        const commits = await this.fetchCommits(
          parsed.owner,
          parsed.repo,
          config.commitsLimit || 20
        );

        // Preserve hidden state from existing cache
        const existingCommits = existingCache[project.slug]?.commits || [];
        const hiddenShas = new Set(
          existingCommits.filter((c) => c.hidden).map((c) => c.sha)
        );

        // Also check config.yaml for hidden commits
        const configHiddenShas = new Set(config.hiddenCommits || []);

        for (const commit of commits) {
          commit.hidden = hiddenShas.has(commit.sha) || configHiddenShas.has(commit.sha);
        }

        newCache[project.slug] = {
          repo: config.repo,
          lastFetched: new Date().toISOString(),
          latestSha: commits[0]?.sha,
          commits,
        };
      } catch (error) {
        console.error(`Failed to fetch commits for ${project.slug}:`, error);
      }
    }

    // Save cache
    await this.saveCommitsCache(newCache);
  }

  private async saveCommitsCache(cache: CommitsCache): Promise<void> {
    const cachePath = `${DATA_PATH}/commits-cache.json`;

    // Ensure _data directory exists
    const dataDir = this.app.vault.getAbstractFileByPath(DATA_PATH);
    if (!dataDir) {
      await this.app.vault.createFolder(DATA_PATH);
    }

    const cacheFile = this.app.vault.getAbstractFileByPath(cachePath);
    const content = JSON.stringify(cache, null, 2);

    if (cacheFile && cacheFile instanceof TFile) {
      await this.app.vault.modify(cacheFile, content);
    } else {
      await this.app.vault.create(cachePath, content);
    }
  }

  parseRepoUrl(url: string): { owner: string; repo: string } | null {
    // Handle various GitHub URL formats
    // https://github.com/owner/repo
    // git@github.com:owner/repo.git
    // owner/repo

    const httpsMatch = url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
    if (httpsMatch) {
      return { owner: httpsMatch[1], repo: httpsMatch[2] };
    }

    const sshMatch = url.match(/git@github\.com:([^\/]+)\/([^\.]+)/);
    if (sshMatch) {
      return { owner: sshMatch[1], repo: sshMatch[2] };
    }

    const shortMatch = url.match(/^([^\/]+)\/([^\/]+)$/);
    if (shortMatch) {
      return { owner: shortMatch[1], repo: shortMatch[2] };
    }

    return null;
  }

  async updateProjectReadme(projectSlug: string): Promise<boolean> {
    // Load project config
    const configPath = `${CONTENT_PATH}/projects/${projectSlug}/config.yaml`;
    const configFile = this.app.vault.getAbstractFileByPath(configPath);

    if (!configFile || !(configFile instanceof TFile)) {
      throw new Error(`No config file found for project: ${projectSlug}`);
    }

    const configContent = await this.app.vault.read(configFile);
    const config = parseYaml(configContent) as ProjectConfig;

    if (!config.repo) {
      throw new Error(`No repo configured for project: ${projectSlug}`);
    }

    const parsed = this.parseRepoUrl(config.repo);
    if (!parsed) {
      throw new Error(`Could not parse repo URL: ${config.repo}`);
    }

    // Fetch README
    const readme = await this.fetchReadmeFromRepo(parsed.owner, parsed.repo);
    if (!readme) {
      throw new Error(`Could not fetch README from ${config.repo}`);
    }

    // Update index.md, preserving frontmatter
    const indexPath = `${CONTENT_PATH}/projects/${projectSlug}/index.md`;
    const indexFile = this.app.vault.getAbstractFileByPath(indexPath);

    if (!indexFile || !(indexFile instanceof TFile)) {
      throw new Error(`No index.md found for project: ${projectSlug}`);
    }

    const existingContent = await this.app.vault.read(indexFile);

    // Parse existing frontmatter
    const frontmatterMatch = existingContent.match(/^---\n([\s\S]*?)\n---\n?/);
    let newContent: string;

    if (frontmatterMatch) {
      // Keep frontmatter, replace content
      newContent = frontmatterMatch[0] + "\n" + readme;
    } else {
      // No frontmatter, just use README
      newContent = readme;
    }

    await this.app.vault.modify(indexFile, newContent);
    return true;
  }
}
