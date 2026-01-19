import { compareEntries } from '../utils/sort';

interface TreeNode {
  name: string;
  isFile: boolean;
  children: Map<string, TreeNode>;
}

export function buildTreeLines(paths: string[], depth: number): string[] {
  const root: TreeNode = { name: '.', isFile: false, children: new Map() };
  for (const filePath of paths) {
    const parts = filePath.split('/').filter(Boolean);
    let node = root;
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      if (!node.children.has(part)) {
        node.children.set(part, {
          name: part,
          isFile,
          children: new Map()
        });
      }
      node = node.children.get(part) as TreeNode;
    });
  }

  const lines: string[] = [];
  const maxDepth = depth;

  function render(current: TreeNode, prefix: string, remainingDepth: number): void {
    if (remainingDepth <= 0) {
      return;
    }
    const entries = Array.from(current.children.values()).sort((a, b) =>
      compareEntries({ name: a.name, isFile: a.isFile }, { name: b.name, isFile: b.isFile })
    );
    for (const entry of entries) {
      const suffix = entry.isFile ? '' : '/';
      lines.push(`${prefix}${entry.name}${suffix}`);
      if (!entry.isFile) {
        render(entry, `${prefix}  `, remainingDepth - 1);
      }
    }
  }

  render(root, '', maxDepth);
  return lines;
}
