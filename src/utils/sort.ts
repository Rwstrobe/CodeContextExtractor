export interface SortEntry {
  name: string;
  isFile: boolean;
}

export function compareEntries(a: SortEntry, b: SortEntry): number {
  if (a.isFile !== b.isFile) {
    return a.isFile ? 1 : -1;
  }
  return a.name.localeCompare(b.name);
}
