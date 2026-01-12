import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { CompletionCache, CacheEntry } from './types.js';

const CACHE_FILE = 'completion-cache.json';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCacheDir(): string {
  const home = process.env.KLARO_HOME ?? homedir();
  return join(home, '.klaro');
}

function getCacheFile(): string {
  return join(getCacheDir(), CACHE_FILE);
}

export function readCompletionCache(): CompletionCache {
  const cacheFile = getCacheFile();
  if (!existsSync(cacheFile)) {
    return {};
  }
  try {
    const content = readFileSync(cacheFile, 'utf-8');
    return JSON.parse(content) as CompletionCache;
  } catch {
    return {};
  }
}

export function writeCompletionCache(cache: CompletionCache): void {
  const cacheDir = getCacheDir();
  const cacheFile = getCacheFile();

  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }
  writeFileSync(cacheFile, JSON.stringify(cache, null, 2), 'utf-8');
}

function isCacheValid<T>(entry: CacheEntry<T> | undefined): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

/**
 * Get cached project subdomains, or empty array if cache is stale/missing.
 */
export function getCachedProjects(): string[] {
  const cache = readCompletionCache();
  if (!isCacheValid(cache.projects)) {
    return [];
  }
  return cache.projects!.data.map(p => p.subdomain);
}

/**
 * Get cached board identifiers for a project, or empty array if cache is stale/missing.
 */
export function getCachedBoards(project: string): string[] {
  const cache = readCompletionCache();
  const entry = cache.boards?.[project];
  if (!isCacheValid(entry)) {
    return [];
  }
  return entry!.data.map(b => b.identifier);
}

/**
 * Update the projects cache with fresh data.
 */
export function setCachedProjects(projects: Array<{ subdomain: string; label: string }>): void {
  const cache = readCompletionCache();
  cache.projects = {
    data: projects,
    timestamp: Date.now(),
  };
  writeCompletionCache(cache);
}

/**
 * Update the boards cache for a specific project with fresh data.
 */
export function setCachedBoards(project: string, boards: Array<{ identifier: string; label: string }>): void {
  const cache = readCompletionCache();
  if (!cache.boards) {
    cache.boards = {};
  }
  cache.boards[project] = {
    data: boards,
    timestamp: Date.now(),
  };
  writeCompletionCache(cache);
}

/**
 * Check if projects cache needs refresh.
 */
export function needsProjectsRefresh(): boolean {
  const cache = readCompletionCache();
  return !isCacheValid(cache.projects);
}

/**
 * Check if boards cache for a project needs refresh.
 */
export function needsBoardsRefresh(project: string): boolean {
  const cache = readCompletionCache();
  return !isCacheValid(cache.boards?.[project]);
}
