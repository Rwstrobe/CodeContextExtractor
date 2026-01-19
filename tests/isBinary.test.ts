import { describe, expect, it } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { isBinaryFile } from '../src/utils/isBinary';

describe('isBinaryFile', () => {
  it('detects null bytes', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'code-context-'));
    const filePath = path.join(dir, 'binary.dat');
    await fs.writeFile(filePath, Buffer.from([0, 1, 2, 3]));
    const result = await isBinaryFile(filePath);
    expect(result).toBe(true);
  });
});
