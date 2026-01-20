import { SkippedEntry } from '../scanner';

export interface SkipSummary {
  total: number;
  byReason: Record<string, number>;
  topRoots: Array<{ name: string; count: number }>;
}

function getRootName(relativePath: string): string {
  const parts = relativePath.split('/');
  return parts[0] || relativePath;
}

export function summarizeSkipped(
  skipped: SkippedEntry[],
  rootLimit = 10
): SkipSummary {
  const byReason: Record<string, number> = {};
  const byRoot: Record<string, number> = {};

  for (const entry of skipped) {
    byReason[entry.reason] = (byReason[entry.reason] ?? 0) + 1;
    const root = getRootName(entry.relativePath);
    byRoot[root] = (byRoot[root] ?? 0) + 1;
  }

  const topRoots = Object.entries(byRoot)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, rootLimit);

  return { total: skipped.length, byReason, topRoots };
}
