/**
 * GitHub API Service
 *
 * This service handles communication with GitHub's REST API for
 * fetching commits and repository information.
 */

import { Octokit } from 'octokit'
import type { Commit, CommitsCache } from 'src/types/content'

// Initialize Octokit with token from environment
function createOctokit(): Octokit {
  const token = import.meta.env.VITE_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN
  return new Octokit({ auth: token })
}

// Parse owner/repo from repo string
function parseRepo(repo: string): { owner: string; repo: string } {
  const [owner, repoName] = repo.split('/')
  return { owner, repo: repoName }
}

// Fetch commits from a GitHub repository
export async function fetchCommits(
  repoString: string,
  options: {
    since?: string  // ISO date
    limit?: number
  } = {}
): Promise<Commit[]> {
  const octokit = createOctokit()
  const { owner, repo } = parseRepo(repoString)
  const { since, limit = 30 } = options

  try {
    const response = await octokit.rest.repos.listCommits({
      owner,
      repo,
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
    console.error(`Failed to fetch commits for ${repoString}:`, error)
    return []
  }
}

// Fetch README content from a repository
export async function fetchReadme(repoString: string): Promise<string | null> {
  const octokit = createOctokit()
  const { owner, repo } = parseRepo(repoString)

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
    console.error(`Failed to fetch README for ${repoString}:`, error)
    return null
  }
}

// Update commits cache with new commits
export function mergeCommitsCache(
  existingCache: CommitsCache,
  projectSlug: string,
  repo: string,
  newCommits: Commit[]
): CommitsCache {
  const existing = existingCache[projectSlug]

  if (!existing) {
    // New project, just add all commits
    return {
      ...existingCache,
      [projectSlug]: {
        repo,
        lastFetched: new Date().toISOString(),
        latestSha: newCommits[0]?.sha,
        commits: newCommits
      }
    }
  }

  // Merge new commits with existing, preserving hidden flags
  const existingBysha = new Map(existing.commits.map(c => [c.sha, c]))
  const mergedCommits: Commit[] = []

  for (const commit of newCommits) {
    const existingCommit = existingBysha.get(commit.sha)
    if (existingCommit) {
      // Preserve hidden flag from existing
      mergedCommits.push({
        ...commit,
        hidden: existingCommit.hidden
      })
      existingBysha.delete(commit.sha)
    } else {
      mergedCommits.push(commit)
    }
  }

  // Add remaining old commits (in case they were older than fetched range)
  for (const commit of existingBysha.values()) {
    mergedCommits.push(commit)
  }

  // Sort by date descending
  mergedCommits.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return {
    ...existingCache,
    [projectSlug]: {
      repo,
      lastFetched: new Date().toISOString(),
      latestSha: mergedCommits[0]?.sha,
      commits: mergedCommits
    }
  }
}

// Batch fetch commits for multiple projects
export async function fetchAllProjectCommits(
  projects: Array<{ slug: string; repo: string; limit?: number }>,
  existingCache: CommitsCache
): Promise<CommitsCache> {
  let cache = { ...existingCache }

  for (const project of projects) {
    // Determine if we should fetch incrementally
    const existing = cache[project.slug]
    const since = existing?.latestSha
      ? existing.commits.find(c => c.sha === existing.latestSha)?.date
      : undefined

    console.log(`Fetching commits for ${project.slug} from ${project.repo}...`)

    const commits = await fetchCommits(project.repo, {
      since,
      limit: project.limit ?? 30
    })

    if (commits.length > 0) {
      cache = mergeCommitsCache(cache, project.slug, project.repo, commits)
      console.log(`  Found ${commits.length} commits`)
    } else {
      console.log(`  No new commits`)
    }
  }

  return cache
}
