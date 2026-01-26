/**
 * Frontmatter service - parse and serialize YAML frontmatter in markdown files
 */

import yaml from 'js-yaml';

export interface FrontmatterResult {
  frontmatter: Record<string, unknown>;
  content: string;
  hasFrontmatter: boolean;
}

/**
 * Parse YAML frontmatter from markdown content
 */
export function parseFrontmatter(markdown: string): FrontmatterResult {
  // Match frontmatter between --- markers at the start of the file
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

  if (!match) {
    return { frontmatter: {}, content: markdown, hasFrontmatter: false };
  }

  try {
    const frontmatter = yaml.load(match[1]) as Record<string, unknown>;
    return {
      frontmatter: frontmatter || {},
      content: match[2],
      hasFrontmatter: true
    };
  } catch (e) {
    console.warn('[SPG] Failed to parse frontmatter:', e);
    return { frontmatter: {}, content: markdown, hasFrontmatter: false };
  }
}

/**
 * Serialize frontmatter and content back to markdown
 */
export function serializeFrontmatter(
  frontmatter: Record<string, unknown>,
  content: string
): string {
  // If no frontmatter properties, just return content
  if (Object.keys(frontmatter).length === 0) {
    return content;
  }

  const yamlStr = yaml.dump(frontmatter, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false
  }).trim();

  return `---\n${yamlStr}\n---\n\n${content}`;
}

/**
 * Get the type of a frontmatter property for UI rendering
 */
export function getPropertyType(value: unknown): 'string' | 'number' | 'boolean' | 'array' | 'object' {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object' && value !== null) return 'object';
  return 'string';
}

/**
 * Get the icon for a property type (Material Icons)
 */
export function getPropertyIcon(key: string, value: unknown): string {
  const type = getPropertyType(value);

  // Special icons for known property names
  const knownIcons: Record<string, string> = {
    title: 'title',
    tagline: 'short_text',
    status: 'flag',
    featured: 'star',
    order: 'sort',
    private: 'lock',
    date: 'event',
    tags: 'label',
    tech: 'code',
    links: 'link',
    repo: 'source',
    demo: 'play_arrow',
    docs: 'menu_book'
  };

  if (knownIcons[key]) {
    return knownIcons[key];
  }

  // Default icons by type
  switch (type) {
    case 'boolean': return 'check_box';
    case 'number': return 'tag';
    case 'array': return 'list';
    case 'object': return 'data_object';
    default: return 'notes';
  }
}
