/**
 * Pinia store for Static Portfolio Generator plugin
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  type ContentManifest,
  type CommitsCache,
  type PluginSettings,
  type ProjectConfig,
  type RepoInfo,
  DEFAULT_SETTINGS,
  CONTENT_PATH,
  DATA_PATH
} from './types';
import * as manifestService from './services/manifest';
import * as github from './services/github';
import { readFile, writeFile } from './services/files';

const PLUGIN_ID = '_user_settings_spg';

export const useSPGStore = defineStore('spg', () => {
  // ===================
  // State
  // ===================
  const settings = ref<PluginSettings>({ ...DEFAULT_SETTINGS });
  const settingsLoaded = ref(false);
  const manifest = ref<ContentManifest | null>(null);
  const commitsCache = ref<CommitsCache>({});
  const userRepos = ref<RepoInfo[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const selectedProjectSlug = ref<string | null>(null);

  // Editor state
  const currentFilePath = ref<string | null>(null);
  const currentFileContent = ref<string>('');
  const originalFileContent = ref<string>('');

  // ===================
  // Computed
  // ===================
  const isConfigured = computed(() => !!settings.value.projectId);

  // Get GitHub token - prefer TeamIDE's token, fallback to plugin settings
  const githubToken = computed(() => {
    // Try to get token from TeamIDE first
    const teamideToken = window.__teamide?.getGitHubToken?.();
    if (teamideToken) return teamideToken;
    // Fallback to plugin settings
    return settings.value.githubToken || null;
  });

  const hasGitHubToken = computed(() => !!githubToken.value);

  const projects = computed(() => manifest.value?.projects ?? []);
  const blogPosts = computed(() => manifest.value?.blog ?? []);
  const pages = computed(() => manifest.value?.pages ?? []);

  const selectedProjectCommits = computed(() => {
    if (!selectedProjectSlug.value) return [];
    return commitsCache.value[selectedProjectSlug.value]?.commits ?? [];
  });

  // Check if current file has unsaved changes
  const isFileModified = computed(() => {
    return currentFileContent.value !== originalFileContent.value;
  });

  // ===================
  // Settings
  // ===================
  async function loadSettings() {
    try {
      console.log('[SPG Store] Loading settings from TeamIDE...');
      const stored = await window.__teamide?.getPluginSettings?.(PLUGIN_ID);
      if (stored) {
        settings.value = { ...DEFAULT_SETTINGS, ...stored as PluginSettings };
        console.log('[SPG Store] Loaded settings:', settings.value);
      } else {
        console.log('[SPG Store] No stored settings, using defaults');
        settings.value = { ...DEFAULT_SETTINGS };
      }
    } catch (e) {
      console.error('[SPG Store] Error loading settings:', e);
      settings.value = { ...DEFAULT_SETTINGS };
    } finally {
      settingsLoaded.value = true;
    }
  }

  async function saveSettings() {
    try {
      console.log('[SPG Store] Saving settings:', settings.value);
      await window.__teamide?.savePluginSettings?.(PLUGIN_ID, settings.value);
      console.log('[SPG Store] Settings saved');
    } catch (e) {
      console.error('[SPG Store] Error saving settings:', e);
    }
  }

  async function setProjectId(projectId: string) {
    settings.value.projectId = projectId;
    await saveSettings();
  }

  async function setGitHubToken(token: string) {
    settings.value.githubToken = token;
    await saveSettings();
  }

  // ===================
  // Manifest Actions
  // ===================
  async function loadManifest() {
    console.log('[SPG Store] loadManifest called, projectId:', settings.value.projectId);
    if (!settings.value.projectId) {
      error.value = 'No project selected';
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      manifest.value = await manifestService.loadManifest(settings.value.projectId);
      console.log('[SPG Store] Manifest loaded:', manifest.value);
      if (!manifest.value) {
        error.value = 'Failed to load manifest - is this a Static Portfolio Generator project?';
      } else {
        console.log('[SPG Store] Projects:', manifest.value.projects.length, 'Blog:', manifest.value.blog.length, 'Pages:', manifest.value.pages.length);
      }
    } catch (e) {
      console.error('[SPG Store] Error loading manifest:', e);
      error.value = e instanceof Error ? e.message : 'Failed to load manifest';
      manifest.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  // ===================
  // GitHub Actions
  // ===================
  async function fetchUserRepos() {
    if (!githubToken.value) {
      error.value = 'GitHub token not configured';
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      userRepos.value = await github.fetchUserRepos(githubToken.value);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch repos';
    } finally {
      isLoading.value = false;
    }
  }

  async function refreshCommits(projectSlug?: string) {
    const slug = projectSlug || selectedProjectSlug.value;
    if (!slug || !settings.value.projectId) return;

    const project = manifest.value?.projects.find(p => p.slug === slug);
    if (!project?.configPath) return;

    isLoading.value = true;
    error.value = null;

    try {
      // Load project config to get repo URL
      const configPath = `${CONTENT_PATH}${project.configPath.replace('/content', '')}`;
      const configContent = await readFile(settings.value.projectId, configPath);

      // Simple YAML parsing for repo field
      const repoMatch = configContent.match(/repo:\s*(.+)/);
      if (!repoMatch) {
        error.value = 'No repo configured for this project';
        return;
      }

      const parsed = github.parseRepoUrl(repoMatch[1].trim());
      if (!parsed) {
        error.value = 'Could not parse repo URL';
        return;
      }

      // Get commits limit from config
      const limitMatch = configContent.match(/commitsLimit:\s*(\d+)/);
      const limit = limitMatch ? parseInt(limitMatch[1], 10) : 20;

      // Fetch commits
      const commits = await github.fetchCommits(
        githubToken.value || '',
        parsed.owner,
        parsed.repo,
        limit
      );

      // Load hidden commits from config
      const hiddenMatch = configContent.match(/hiddenCommits:\s*\[([\s\S]*?)\]/);
      const hiddenShas = new Set<string>();
      if (hiddenMatch) {
        const hiddenList = hiddenMatch[1].match(/['"]([a-f0-9]+)['"]/g);
        if (hiddenList) {
          for (const h of hiddenList) {
            hiddenShas.add(h.replace(/['"]/g, ''));
          }
        }
      }

      // Mark hidden commits
      for (const commit of commits) {
        commit.hidden = hiddenShas.has(commit.sha);
      }

      // Update cache
      commitsCache.value[slug] = {
        repo: repoMatch[1].trim(),
        lastFetched: new Date().toISOString(),
        latestSha: commits[0]?.sha,
        commits
      };
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to refresh commits';
    } finally {
      isLoading.value = false;
    }
  }

  async function toggleCommitVisibility(projectSlug: string, sha: string, hidden: boolean) {
    if (!settings.value.projectId) return;

    const project = manifest.value?.projects.find(p => p.slug === projectSlug);
    if (!project?.configPath) return;

    try {
      const configPath = `${CONTENT_PATH}${project.configPath.replace('/content', '')}`;
      let configContent = await readFile(settings.value.projectId, configPath);

      // Parse current hidden commits
      const hiddenMatch = configContent.match(/hiddenCommits:\s*\[([\s\S]*?)\]/);
      let hiddenShas: string[] = [];

      if (hiddenMatch) {
        const hiddenList = hiddenMatch[1].match(/['"]([a-f0-9]+)['"]/g);
        if (hiddenList) {
          hiddenShas = hiddenList.map(h => h.replace(/['"]/g, ''));
        }
      }

      // Update hidden list
      if (hidden && !hiddenShas.includes(sha)) {
        hiddenShas.push(sha);
      } else if (!hidden) {
        hiddenShas = hiddenShas.filter(s => s !== sha);
      }

      // Update config content
      const newHiddenYaml = `hiddenCommits: [${hiddenShas.map(s => `'${s}'`).join(', ')}]`;
      if (hiddenMatch) {
        configContent = configContent.replace(/hiddenCommits:\s*\[[\s\S]*?\]/, newHiddenYaml);
      } else {
        configContent = configContent.trim() + `\n${newHiddenYaml}\n`;
      }

      await writeFile(settings.value.projectId, configPath, configContent);

      // Update local cache
      const cached = commitsCache.value[projectSlug];
      if (cached) {
        const commit = cached.commits.find(c => c.sha === sha);
        if (commit) {
          commit.hidden = hidden;
        }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to toggle commit visibility';
    }
  }

  async function pullReadme(projectSlug: string) {
    if (!settings.value.projectId || !githubToken.value) return;

    const project = manifest.value?.projects.find(p => p.slug === projectSlug);
    if (!project?.configPath) return;

    isLoading.value = true;
    error.value = null;

    try {
      // Load project config to get repo URL
      const configPath = `${CONTENT_PATH}${project.configPath.replace('/content', '')}`;
      const configContent = await readFile(settings.value.projectId, configPath);

      const repoMatch = configContent.match(/repo:\s*(.+)/);
      if (!repoMatch) {
        error.value = 'No repo configured for this project';
        return;
      }

      const parsed = github.parseRepoUrl(repoMatch[1].trim());
      if (!parsed) {
        error.value = 'Could not parse repo URL';
        return;
      }

      // Fetch README
      const readme = await github.fetchReadme(
        githubToken.value || '',
        parsed.owner,
        parsed.repo
      );

      if (!readme) {
        error.value = 'No README found in repository';
        return;
      }

      // Update index.md, preserving frontmatter
      const indexPath = `${CONTENT_PATH}/projects/${projectSlug}/index.md`;
      const existingContent = await readFile(settings.value.projectId, indexPath);

      // Parse existing frontmatter
      const frontmatterMatch = existingContent.match(/^---\n([\s\S]*?)\n---\n?/);
      let newContent: string;

      if (frontmatterMatch) {
        // Keep frontmatter, replace content
        newContent = frontmatterMatch[0] + '\n' + readme;
      } else {
        // No frontmatter, just use README
        newContent = readme;
      }

      await writeFile(settings.value.projectId, indexPath, newContent);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to pull README';
    } finally {
      isLoading.value = false;
    }
  }

  // ===================
  // Selection
  // ===================
  function selectProject(slug: string | null) {
    selectedProjectSlug.value = slug;
  }

  // ===================
  // Editor Actions
  // ===================

  /**
   * Open a file in the plugin's embedded editor
   */
  async function openFileInPlugin(path: string) {
    if (!settings.value.projectId) {
      error.value = 'No project selected';
      return;
    }

    console.log('[SPG Store] openFileInPlugin:', path);
    isLoading.value = true;
    error.value = null;

    try {
      // Convert content path to full path if needed
      const fullPath = path.startsWith('/content')
        ? `app/public${path}`
        : path;

      currentFilePath.value = fullPath;
      const content = await readFile(settings.value.projectId, fullPath);
      currentFileContent.value = content;
      originalFileContent.value = content;
      console.log('[SPG Store] File loaded:', fullPath, 'length:', content.length);
    } catch (e) {
      console.error('[SPG Store] Failed to load file:', e);
      error.value = e instanceof Error ? e.message : 'Failed to load file';
      currentFilePath.value = null;
      currentFileContent.value = '';
      originalFileContent.value = '';
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Update file content (for editing, does not save)
   */
  function updateFileContent(content: string) {
    currentFileContent.value = content;
  }

  /**
   * Save the current file to disk
   */
  async function saveCurrentFile() {
    if (!settings.value.projectId || !currentFilePath.value) {
      error.value = 'No file to save';
      return;
    }

    if (!isFileModified.value) {
      console.log('[SPG Store] File not modified, skipping save');
      return;
    }

    console.log('[SPG Store] Saving file:', currentFilePath.value);
    isLoading.value = true;
    error.value = null;

    try {
      await writeFile(settings.value.projectId, currentFilePath.value, currentFileContent.value);
      originalFileContent.value = currentFileContent.value;
      console.log('[SPG Store] File saved successfully');
    } catch (e) {
      console.error('[SPG Store] Failed to save file:', e);
      error.value = e instanceof Error ? e.message : 'Failed to save file';
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Close the current file
   */
  function closeCurrentFile() {
    currentFilePath.value = null;
    currentFileContent.value = '';
    originalFileContent.value = '';
  }

  // ===================
  // Return
  // ===================
  return {
    // State
    settings,
    manifest,
    commitsCache,
    userRepos,
    isLoading,
    error,
    selectedProjectSlug,

    // Editor state
    currentFilePath,
    currentFileContent,

    // Computed
    isConfigured,
    hasGitHubToken,
    githubToken,
    settingsLoaded,
    projects,
    blogPosts,
    pages,
    selectedProjectCommits,
    isFileModified,

    // Actions
    loadSettings,
    setProjectId,
    setGitHubToken,
    loadManifest,
    fetchUserRepos,
    refreshCommits,
    toggleCommitVisibility,
    pullReadme,
    selectProject,

    // Editor actions
    openFileInPlugin,
    updateFileContent,
    saveCurrentFile,
    closeCurrentFile
  };
});
