import { describe, expect, it } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { scan } from '../src/scanner';

async function setupFixture(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'code-context-'));
  await fs.mkdir(path.join(dir, 'src'));
  await fs.writeFile(path.join(dir, 'a.txt'), 'hello');
  await fs.writeFile(path.join(dir, 'b.txt'), 'world');
  await fs.writeFile(path.join(dir, 'secret.env'), 'TOKEN=abc');
  await fs.writeFile(path.join(dir, 'src', 'c.txt'), 'more');
  return dir;
}

describe('scan', () => {
  it('applies include and exclude patterns', async () => {
    const root = await setupFixture();
    const result = await scan(root, {
      include: ['**/*.txt'],
      exclude: ['b.txt'],
      maxBytes: 1000,
      respectGitignore: false
    });
    const included = result.files.map((file) => file.relativePath);
    expect(included).toEqual(['a.txt', 'src/c.txt']);
    const skipped = result.skipped.map((file) => file.relativePath);
    expect(skipped).toContain('b.txt');
    expect(skipped).not.toContain('secret.env');
  });

  it('returns deterministic ordering', async () => {
    const root = await setupFixture();
    const result = await scan(root, {
      include: ['**/*.txt'],
      exclude: [],
      maxBytes: 1000,
      respectGitignore: false
    });
    const included = result.files.map((file) => file.relativePath);
    expect(included).toEqual(['a.txt', 'b.txt', 'src/c.txt']);
  });

  it('excludes lock files by default', async () => {
    const root = await setupFixture();
    await fs.writeFile(path.join(root, 'package-lock.json'), '{}');
    await fs.writeFile(path.join(root, 'yarn.lock'), 'lock');
    await fs.writeFile(path.join(root, 'pnpm-lock.yaml'), 'lock');
    await fs.writeFile(path.join(root, 'bun.lockb'), 'lock');
    const result = await scan(root, {
      include: [],
      exclude: [],
      maxBytes: 1000,
      respectGitignore: false
    });
    const included = result.files.map((file) => file.relativePath);
    expect(included).not.toContain('package-lock.json');
    expect(included).not.toContain('yarn.lock');
    expect(included).not.toContain('pnpm-lock.yaml');
    expect(included).not.toContain('bun.lockb');
    const skipped = result.skipped.map((file) => file.relativePath);
    expect(skipped).toContain('package-lock.json');
    expect(skipped).toContain('yarn.lock');
    expect(skipped).toContain('pnpm-lock.yaml');
    expect(skipped).toContain('bun.lockb');
  });
});
