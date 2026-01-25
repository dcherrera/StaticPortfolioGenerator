/**
 * Fetch Commits Script
 *
 * Run this script before building to fetch latest commits from GitHub.
 * Usage: npm run fetch-commits
 *
 * Requires GITHUB_TOKEN environment variable for API access.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parse as parseYaml } from 'yaml'
import { Octokit } from '@octokit/rest'
import type { Commit, CommitsCache, ProjectConfig } from '../src/types/content'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = join(__dirname, '../public/content')
const DATA_DIR = join(__dirname, '../public/_data')
const CACHE_FILE = join(DATA_DIR, 'commits-cache.json')

// Get GitHub token from env var or Obsidian plugin settings
function getGitHubToken(): string | undefined {
  // First check environment variable
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN
  }

  // Fallback: try to read from Obsidian plugin data.json
  const pluginDataPath = join(__dirname, '../../.obsidian/plugins/static-portfolio-generator/data.json')
  if (existsSync(pluginDataPath)) {
    try {
      const data = JSON.parse(readFileSync(pluginDataPath, 'utf-8'))
      if (data.githubToken) {
        console.log('Using GitHub token from Obsidian plugin settings')
        return data.githubToken
      }
    } catch {
      // Ignore errors reading plugin data
    }
  }

  return undefined
}

// Initialize Octokit
const octokit = new Octokit({
  auth: getGitHubToken()
})

// Load existing cache
function loadCache(): CommitsCache {
  if (existsSync(CACHE_FILE)) {
    try {
      const raw = readFileSync(CACHE_FILE, 'utf-8')
      return JSON.parse(raw)
    } catch {
      console.warn('Failed to parse existing cache, starting fresh')
    }
  }
  return {}
}

// Save cache
function saveCache(cache: CommitsCache): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
}

// Get all project configs
function getProjectConfigs(): Array<{ slug: string; config: ProjectConfig }> {
  const projects: Array<{ slug: string; config: ProjectConfig }> = []
  const projectsDir = join(CONTENT_DIR, 'projects')

  if (!existsSync(projectsDir)) {
    return projects
  }

  const entries = readdirSync(projectsDir)

  for (const entry of entries) {
    const projectPath = join(projectsDir, entry)
    if (!statSync(projectPath).isDirectory()) continue

    const configPath = join(projectPath, 'config.yaml')
    if (!existsSync(configPath)) continue

    try {
      const raw = readFileSync(configPath, 'utf-8')
      const config = parseYaml(raw) as ProjectConfig
      if (config.repo) {
        projects.push({ slug: entry, config })
      }
    } catch (error) {
      console.warn(`Failed to parse config for ${entry}:`, error)
    }
  }

  return projects
}

// Fetch commits from GitHub
async function fetchCommits(
  repo: string,
  since?: string,
  limit = 30
): Promise<Commit[]> {
  const [owner, repoName] = repo.split('/')

  try {
    const response = await octokit.rest.repos.listCommits({
      owner,
      repo: repoName,
      per_page: limit,
      since
    })

    return response.data.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      date: commit.commit.author?.date ?? new Date().toISOString(),
      author: commit.author?.login ?? commit.commit.author?.name,
      url: commit.html_url,
      hidden: false
    }))
  } catch (error) {
    console.error(`Failed to fetch commits for ${repo}:`, error)
    return []
  }
}

// Merge new commits with existing cache
function mergeCommits(
  existing: Commit[] | undefined,
  newCommits: Commit[]
): Commit[] {
  if (!existing) return newCommits

  const existingBysha = new Map(existing.map(c => [c.sha, c]))
  const merged: Commit[] = []

  // Add new commits, preserving hidden flag
  for (const commit of newCommits) {
    const existingCommit = existingBysha.get(commit.sha)
    merged.push({
      ...commit,
      hidden: existingCommit?.hidden ?? false
    })
    existingBysha.delete(commit.sha)
  }

  // Add old commits not in new fetch
  for (const commit of existingBysha.values()) {
    merged.push(commit)
  }

  // Sort by date
  return merged.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

// Main
async function main() {
  console.log('Fetching commits from GitHub...\n')

  if (!getGitHubToken()) {
    console.warn('Warning: No GitHub token found. Private repos will fail.\n')
    console.warn('Set GITHUB_TOKEN env var or configure token in Obsidian plugin settings.\n')
  }

  const cache = loadCache()
  const projects = getProjectConfigs()

  if (projects.length === 0) {
    console.log('No projects with GitHub repos found.')
    return
  }

  for (const { slug, config } of projects) {
    if (!config.repo) continue

    console.log(`${slug}: Fetching from ${config.repo}...`)

    const existing = cache[slug]
    const since = existing?.latestSha
      ? existing.commits.find(c => c.sha === existing.latestSha)?.date
      : undefined

    const newCommits = await fetchCommits(
      config.repo,
      since,
      config.commitsLimit ?? 30
    )

    const merged = mergeCommits(existing?.commits, newCommits)

    // Apply hidden list from config
    if (config.hiddenCommits?.length) {
      for (const commit of merged) {
        if (config.hiddenCommits.includes(commit.sha)) {
          commit.hidden = true
        }
      }
    }

    cache[slug] = {
      repo: config.repo,
      lastFetched: new Date().toISOString(),
      latestSha: merged[0]?.sha,
      commits: merged
    }

    console.log(`  ${newCommits.length} new commits, ${merged.length} total`)
  }

  saveCache(cache)
  console.log(`\nCache saved to ${CACHE_FILE}`)
}

main().catch(console.error)
