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
});
