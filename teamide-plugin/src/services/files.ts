/**
 * File service - HTTP calls to TeamIDE's container-manager API
 */

const API_BASE = 'http://localhost:4446';

export interface FileContent {
  content: string;
  size: number;
  encoding?: string;
}

export interface DirectoryEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: string;
}

/**
 * Read file content from a project
 */
export async function readFile(projectId: string, path: string): Promise<string> {
  const params = new URLSearchParams({ path });
  const res = await fetch(`${API_BASE}/files/${projectId}/read?${params}`);

  if (!res.ok) {
    throw new Error(`Failed to read file: ${res.statusText}`);
  }

  const data: FileContent = await res.json();
  return data.content;
}

/**
 * Write file content to a project
 */
export async function writeFile(projectId: string, path: string, content: string): Promise<void> {
  const res = await fetch(`${API_BASE}/files/${projectId}/write`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content })
  });

  if (!res.ok) {
    throw new Error(`Failed to write file: ${res.statusText}`);
  }
}

/**
 * Create a directory in a project
 */
export async function createDirectory(projectId: string, path: string): Promise<void> {
  const res = await fetch(`${API_BASE}/files/${projectId}/mkdir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path })
  });

  if (!res.ok) {
    throw new Error(`Failed to create directory: ${res.statusText}`);
  }
}

/**
 * Delete a file or directory from a project
 */
export async function deleteFile(projectId: string, path: string): Promise<void> {
  const params = new URLSearchParams({ path });
  const res = await fetch(`${API_BASE}/files/${projectId}?${params}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    throw new Error(`Failed to delete file: ${res.statusText}`);
  }
}

/**
 * List directory contents (non-recursive)
 */
export async function listDirectory(projectId: string, path: string): Promise<DirectoryEntry[]> {
  const params = new URLSearchParams({ path });
  const res = await fetch(`${API_BASE}/files/${projectId}/list?${params}`);

  if (!res.ok) {
    throw new Error(`Failed to list directory: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Check if a file exists
 */
export async function fileExists(projectId: string, path: string): Promise<boolean> {
  try {
    const params = new URLSearchParams({ path });
    const res = await fetch(`${API_BASE}/files/${projectId}/info?${params}`);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Ensure a directory exists (create if not)
 */
export async function ensureDirectory(projectId: string, path: string): Promise<void> {
  const parts = path.split('/').filter(Boolean);
  let currentPath = '';

  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    const exists = await fileExists(projectId, currentPath);
    if (!exists) {
      await createDirectory(projectId, currentPath);
    }
  }
}
