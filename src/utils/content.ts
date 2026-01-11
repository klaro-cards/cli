import { join } from 'node:path';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { getConfigDir } from '../lib/config.js';
import { slugify } from './slugify.js';

/**
 * Get the content directory path for a project.
 */
export function getContentDir(project: string): string {
  return join(getConfigDir(), 'content', project);
}

/**
 * Ensure the content directory exists, creating it if necessary.
 * Returns the directory path.
 */
export function ensureContentDir(project: string): string {
  const dir = getContentDir(project);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * List all markdown files in the content directory for a project.
 * Returns an array of filenames (not full paths).
 */
export function listContentFiles(project: string): string[] {
  const dir = getContentDir(project);
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir).filter(f => f.endsWith('.md'));
}

/**
 * Extract the card identifier from a content filename.
 * Filename format: {identifier}-{slugified-title}.md
 * Returns null if the filename doesn't match the expected pattern.
 */
export function extractIdentifierFromFilename(filename: string): number | null {
  const match = filename.match(/^(\d+)-.*\.md$/);
  if (!match) {
    return null;
  }
  return parseInt(match[1], 10);
}

/**
 * Build a content filename from identifier and title.
 * Format: {identifier}-{slugified-title}.md
 */
export function buildContentFilename(identifier: string | number, title: string): string {
  return `${identifier}-${slugify(title)}.md`;
}
