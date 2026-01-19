import { promises as fs } from 'fs';
import path from 'path';
import fg from 'fast-glob';
import ignore from 'ignore';
import { DEFAULT_EXCLUDES } from './config';
import { isBinaryFile } from './utils/isBinary';
import { normalizePath } from './utils/normalizePath';

export type SkipReason = 'excluded' | 'too large' | 'binary' | 'unreadable';

export interface FileEntry {
  relativePath: string;
  absolutePath: string;
  size: number;
  mtimeMs: number;
}

export interface SkippedEntry {
  relativePath: string;
  reason: SkipReason;
  detail?: string;
}

export interface ScanOptions {
  include: string[];
  exclude: string[];
  maxBytes: number;
  respectGitignore: boolean;
}

export interface ScanResult {
  rootPath: string;
  files: FileEntry[];
  skipped: SkippedEntry[];
}

async function loadGitignore(rootPath: string): Promise<ReturnType<typeof ignore>> {
  const ig = ignore();
  try {
    const contents = await fs.readFile(path.join(rootPath, '.gitignore'), 'utf8');
    ig.add(contents);
  } catch {
    return ig;
  }
  return ig;
}

export async function scan(
  rootPath: string,
  options: ScanOptions
): Promise<ScanResult> {
  const includeGlobs = options.include.length > 0 ? options.include : ['**/*'];
  const excludeGlobs = [...DEFAULT_EXCLUDES, ...options.exclude];
  const candidates = await fg(includeGlobs, {
    cwd: rootPath,
    dot: true,
    onlyFiles: true,
    followSymbolicLinks: false,
    unique: true,
    absolute: true
  });

  const excludedSet = new Set<string>();
  if (excludeGlobs.length > 0) {
    const excluded = await fg(excludeGlobs, {
      cwd: rootPath,
      dot: true,
      onlyFiles: true,
      followSymbolicLinks: false,
      unique: true,
      absolute: false
    });
    for (const rel of excluded) {
      excludedSet.add(normalizePath(rel));
    }
  }

  const ig = options.respectGitignore ? await loadGitignore(rootPath) : null;
  const skipped: SkippedEntry[] = [];
  const files: FileEntry[] = [];

  for (const absPath of candidates) {
    const relative = normalizePath(path.relative(rootPath, absPath));
    if (excludedSet.has(relative)) {
      skipped.push({ relativePath: relative, reason: 'excluded' });
      continue;
    }
    if (ig && ig.ignores(relative)) {
      skipped.push({ relativePath: relative, reason: 'excluded' });
      continue;
    }
    let stats;
    try {
      stats = await fs.stat(absPath);
    } catch (error) {
      skipped.push({
        relativePath: relative,
        reason: 'unreadable',
        detail: (error as Error).message
      });
      continue;
    }
    if (stats.size > options.maxBytes) {
      skipped.push({ relativePath: relative, reason: 'too large' });
      continue;
    }
    try {
      if (await isBinaryFile(absPath)) {
        skipped.push({ relativePath: relative, reason: 'binary' });
        continue;
      }
    } catch (error) {
      skipped.push({
        relativePath: relative,
        reason: 'unreadable',
        detail: (error as Error).message
      });
      continue;
    }
    files.push({
      relativePath: relative,
      absolutePath: absPath,
      size: stats.size,
      mtimeMs: stats.mtimeMs
    });
  }

  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  skipped.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  return { rootPath, files, skipped };
}
