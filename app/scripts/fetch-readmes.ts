/**
 * Fetch READMEs Script
 *
 * Run this script before building to fetch latest READMEs from GitHub.
 * Usage: npm run fetch-readmes
 *
 * Requires GITHUB_TOKEN environment variable for API access.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parse as parseYaml } from 'yaml'
import { Octokit } from '@octokit/rest'
import type { ProjectConfig } from '../src/types/content'
import matter from 'gray-matter'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = join(__dirname, '../public/content')

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

// Get all project configs
function getProjectConfigs(): Array<{ slug: string; config: ProjectConfig; indexPath: string }> {
  const projects: Array<{ slug: string; config: ProjectConfig; indexPath: string }> = []
  const projectsDir = join(CONTENT_DIR, 'projects')

  if (!existsSync(projectsDir)) {
    return projects
  }

  const entries = readdirSync(projectsDir)

  for (const entry of entries) {
    const projectPath = join(projectsDir, entry)
    if (!statSync(projectPath).isDirectory()) continue

    const configPath = join(projectPath, 'config.yaml')
    const indexPath = join(projectPath, 'index.md')

    if (!existsSync(configPath)) continue
    if (!existsSync(indexPath)) continue

    try {
      const raw = readFileSync(configPath, 'utf-8')
      const config = parseYaml(raw) as ProjectConfig
      if (config.repo) {
        projects.push({ slug: entry, config, indexPath })
      }
    } catch (error) {
      console.warn(`Failed to parse config for ${entry}:`, error)
    }
  }

  return projects
}

// Parse repo string to owner/repo
function parseRepo(repoStr: string): { owner: string; repo: string } | null {
  // Handle various formats:
  // https://github.com/owner/repo
  // git@github.com:owner/repo.git
  // owner/repo

  const httpsMatch = repoStr.match(/github\.com\/([^\/]+)\/([^\/\.]+)/)
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] }
  }

  const sshMatch = repoStr.match(/git@github\.com:([^\/]+)\/([^\.]+)/)
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] }
  }

  const shortMatch = repoStr.match(/^([^\/]+)\/([^\/]+)$/)
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2] }
  }

  return null
}

// Fetch README from GitHub
async function fetchReadme(owner: string, repo: string): Promise<string | null> {
  try {
    const response = await octokit.rest.repos.getReadme({
      owner,
      repo,
      mediaType: {
        format: 'raw'
      }
    })

    return response.data as unknown as string
  } catch (error) {
    console.error(`Failed to fetch README for ${owner}/${repo}:`, error)
    return null
  }
}

// Update project index.md with new README content, preserving frontmatter
function updateIndexFile(indexPath: string, readmeContent: string): void {
  const existingContent = readFileSync(indexPath, 'utf-8')
  const parsed = matter(existingContent)

  // Keep existing frontmatter, replace content with README
  const newContent = matter.stringify(readmeContent, parsed.data)

  writeFileSync(indexPath, newContent)
}

// Main
async function main() {
  console.log('Fetching READMEs from GitHub...\n')

  if (!getGitHubToken()) {
    console.warn('Warning: No GitHub token found. Private repos will fail.\n')
    console.warn('Set GITHUB_TOKEN env var or configure token in Obsidian plugin settings.\n')
  }

  const projects = getProjectConfigs()

  if (projects.length === 0) {
    console.log('No projects with GitHub repos found.')
    return
  }

  let updated = 0
  let skipped = 0

  for (const { slug, config, indexPath } of projects) {
    if (!config.repo) continue

    const parsed = parseRepo(config.repo)
    if (!parsed) {
      console.warn(`${slug}: Could not parse repo URL: ${config.repo}`)
      skipped++
      continue
    }

    console.log(`${slug}: Fetching from ${parsed.owner}/${parsed.repo}...`)

    const readme = await fetchReadme(parsed.owner, parsed.repo)
    if (!readme) {
      console.warn(`  No README found, skipping`)
      skipped++
      continue
    }

    updateIndexFile(indexPath, readme)
    console.log(`  Updated index.md`)
    updated++
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped`)
}

main().catch(console.error)
