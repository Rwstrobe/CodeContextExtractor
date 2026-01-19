export function normalizePath(inputPath: string): string {
  return inputPath.replace(/\\/g, '/');
}
