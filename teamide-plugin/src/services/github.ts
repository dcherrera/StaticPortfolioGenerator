/**
 * GitHub API service - fetch-based for browser compatibility
 */

import type { Commit, RepoInfo } from '../types';

const GITHUB_API = 'https://api.github.com';

/**
 * Create headers with authorization if token is provided
 */
function getHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Fetch user's repositories from GitHub
 */
export async function fetchUserRepos(token: string): Promise<RepoInfo[]> {
  const repos: RepoInfo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const res = await fetch(
      `${GITHUB_API}/user/repos?per_page=${perPage}&page=${page}&sort=updated&direction=desc`,
      { headers: getHeaders(token) }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch repos: ${res.statusText}`);
    }

    const data = await res.json();

    for (const repo of data) {
      repos.push({
        fullName: repo.full_name,
        name: repo.name,
        private: repo.private,
        description: repo.description
      });
    }

    // Check if there are more pages
    if (data.length < perPage) break;
    page++;
  }

  return repos;
}

/**
 * Fetch README content from a repository
 */
export async function fetchReadme(
  token: string,
  owner: string,
  repo: string
): Promise<string | null> {
  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/readme`;
    console.log('[GitHub] fetchReadme:', url);
    const res = await fetch(
      url,
      {
        headers: {
          ...getHeaders(token),
          'Accept': 'application/vnd.github.raw'
        }
      }
    );

    if (!res.ok) {
      console.error('[GitHub] fetchReadme failed:', res.status, res.statusText);
      return null;
    }

    const text = await res.text();
    console.log('[GitHub] fetchReadme success, length:', text.length);
    return text;
  } catch (e) {
    console.error('[GitHub] fetchReadme error:', e);
    return null;
  }
}

/**
 * Fetch commits from a repository
 */
export async function fetchCommits(
  token: string,
  owner: string,
  repo: string,
  limit = 20
): Promise<Commit[]> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=${limit}`,
    { headers: getHeaders(token) }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch commits: ${res.statusText}`);
  }

  const data = await res.json();

  return data.map((commit: any) => ({
    sha: commit.sha,
    message: commit.commit.message,
    date: commit.commit.author?.date || new Date().toISOString(),
    author: commit.author?.login || commit.commit.author?.name || 'unknown',
    url: commit.html_url,
    hidden: false
  }));
}

/**
 * Fetch a file from a repository
 */
export async function fetchFileFromRepo(
  token: string,
  owner: string,
  repo: string,
  path: string
): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
      { headers: getHeaders(token) }
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();

    // Single file (not directory)
    if (!Array.isArray(data) && data.type === 'file' && data.content) {
      // Decode base64 content
      const binary = atob(data.content.replace(/\n/g, ''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse a GitHub repository URL into owner/repo
 */
export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
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

/**
 * Extract image paths from markdown content
 */
export function extractImagePaths(markdown: string): string[] {
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
