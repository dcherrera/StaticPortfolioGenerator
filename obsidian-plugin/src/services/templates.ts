import type { ProjectStatus } from "../types";

export function generateProjectIndexMd(
  title: string,
  tagline: string,
  status: ProjectStatus,
  tech: string[],
  repoUrl?: string,
  isPrivate?: boolean
): string {
  const techYaml = tech.length > 0 ? `\ntech:\n${tech.map((t) => `  - ${t}`).join("\n")}` : "";
  const privateYaml = isPrivate ? `\nprivate: true` : "";
  const linksYaml = repoUrl ? `\nlinks:\n  repo: ${repoUrl}` : "";

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
  const tagsYaml = tags.length > 0 ? `\ntags:\n${tags.map((t) => `  - ${t}`).join("\n")}` : "";
  const projectYaml = project ? `\nproject: ${project}` : "";

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
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
