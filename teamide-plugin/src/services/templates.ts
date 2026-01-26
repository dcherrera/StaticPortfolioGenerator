/**
 * Content template generators for Static Portfolio Generator
 */

import type { ProjectStatus } from '../types';

export function generateProjectIndexMd(
  title: string,
  tagline: string,
  status: ProjectStatus,
  tech: string[],
  repoUrl?: string,
  isPrivate?: boolean
): string {
  const techYaml = tech.length > 0 ? `\ntech:\n${tech.map((t) => `  - ${t}`).join('\n')}` : '';
  const privateYaml = isPrivate ? `\nprivate: true` : '';
  const linksYaml = repoUrl ? `\nlinks:\n  repo: ${repoUrl}` : '';

  return `---
title: ${title}
tagline: ${tagline}
status: ${status}
featured: false
order: 99${techYaml}${privateYaml}${linksYaml}
---

## Overview

${tagline}

## Features

- Feature 1
- Feature 2
- Feature 3

## Getting Started

Add installation and usage instructions here.
`;
}

export function generateProjectConfigYaml(repoUrl?: string): string {
  if (!repoUrl) {
    return `# Project configuration
# repo: owner/repo-name
commitsLimit: 20
hiddenCommits: []
`;
  }

  // Extract owner/repo from URL
  const match = repoUrl.match(/github\.com\/([^\/]+\/[^\/\.]+)/);
  const repo = match ? match[1] : repoUrl;

  return `# Project configuration
repo: ${repo}
commitsLimit: 20
hiddenCommits: []
`;
}

export function generateBlogPostMd(
  title: string,
  date: string,
  tags: string[],
  project?: string
): string {
  const tagsYaml = tags.length > 0 ? `\ntags:\n${tags.map((t) => `  - ${t}`).join('\n')}` : '';
  const projectYaml = project ? `\nproject: ${project}` : '';

  return `---
title: ${title}
date: ${date}${tagsYaml}${projectYaml}
---

Write your blog post content here.
`;
}

export function generatePageMd(title: string): string {
  return `---
title: ${title}
---

# ${title}

Add your page content here.
`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}
