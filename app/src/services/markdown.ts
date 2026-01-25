import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import { parse as parseYaml } from 'yaml'
import { createHighlighter, type Highlighter } from 'shiki'

let highlighter: Highlighter | null = null

// Initialize syntax highlighter
async function initHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: [
        'javascript',
        'typescript',
        'vue',
        'html',
        'css',
        'scss',
        'json',
        'yaml',
        'markdown',
        'bash',
        'shell',
        'python',
        'rust',
        'go',
        'sql'
      ]
    })
  }
  return highlighter
}

// Create markdown-it instance with plugins
function createMarkdownRenderer(hl: Highlighter, basePath?: string): MarkdownIt {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: (code, lang) => {
      try {
        if (lang && hl.getLoadedLanguages().includes(lang)) {
          return hl.codeToHtml(code, {
            lang,
            theme: 'github-dark'
          })
        }
      } catch {
        // Fallback to plain code block
      }
      return `<pre><code>${md.utils.escapeHtml(code)}</code></pre>`
    }
  })

  // Add anchor links to headings
  md.use(anchor, {
    permalink: anchor.permalink.ariaHidden({
      placement: 'before',
      symbol: '#',
      class: 'header-anchor'
    }),
    slugify: (s: string) =>
      s.toLowerCase()
        .trim()
        .replace(/[\s]+/g, '-')
        .replace(/[^\w-]+/g, '')
  })

  // Rewrite relative image paths if basePath is provided
  if (basePath) {
    const defaultImageRule = md.renderer.rules.image
    md.renderer.rules.image = (tokens, idx, options, env, self) => {
      const token = tokens[idx]
      const srcIndex = token.attrIndex('src')
      if (srcIndex >= 0) {
        const src = token.attrs?.[srcIndex][1] || ''
        // Only rewrite relative paths (not absolute or URLs)
        if (src && !src.startsWith('/') && !src.startsWith('http://') && !src.startsWith('https://')) {
          const newSrc = `${basePath}/${src.replace(/^\.\//, '')}`
          token.attrs![srcIndex][1] = newSrc
        }
      }
      return defaultImageRule ? defaultImageRule(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
    }
  }

  return md
}

// Parse markdown with frontmatter
export interface ParsedMarkdown<T = Record<string, unknown>> {
  frontmatter: T
  content: string
  rawContent: string
}

// Extract frontmatter from markdown (browser-compatible replacement for gray-matter)
function extractFrontmatter(source: string): { data: Record<string, unknown>; content: string } {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/
  const match = source.match(frontmatterRegex)

  if (!match) {
    return { data: {}, content: source }
  }

  const yamlContent = match[1]
  const markdownContent = match[2]

  let data: Record<string, unknown> = {}
  try {
    data = parseYaml(yamlContent) as Record<string, unknown>
  } catch (e) {
    console.warn('Failed to parse frontmatter YAML:', e)
  }

  return { data, content: markdownContent }
}

export async function parseMarkdown<T = Record<string, unknown>>(
  source: string,
  basePath?: string
): Promise<ParsedMarkdown<T>> {
  const hl = await initHighlighter()
  const md = createMarkdownRenderer(hl, basePath)

  const { data, content: rawContent } = extractFrontmatter(source)
  const content = md.render(rawContent)

  return {
    frontmatter: data as T,
    content,
    rawContent
  }
}

// Render markdown without frontmatter parsing
export async function renderMarkdown(source: string): Promise<string> {
  const hl = await initHighlighter()
  const md = createMarkdownRenderer(hl)
  return md.render(source)
}

// Extract excerpt from markdown content
export function extractExcerpt(content: string, maxLength = 200): string {
  // Remove markdown formatting
  const plain = content
    .replace(/#{1,6}\s+/g, '')           // Headers
    .replace(/\*\*([^*]+)\*\*/g, '$1')   // Bold
    .replace(/\*([^*]+)\*/g, '$1')       // Italic
    .replace(/`([^`]+)`/g, '$1')         // Inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')  // Images
    .replace(/\n+/g, ' ')                // Newlines
    .trim()

  if (plain.length <= maxLength) return plain
  return plain.slice(0, maxLength).trim() + '...'
}

// Get slug from filename
export function getSlugFromFilename(filename: string): string {
  // Remove date prefix if present (YYYY-MM-DD-)
  const withoutDate = filename.replace(/^\d{4}-\d{2}-\d{2}-/, '')
  // Remove extension
  return withoutDate.replace(/\.(md|markdown)$/i, '')
}

// Extract date from filename
export function getDateFromFilename(filename: string): string | null {
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : null
}
