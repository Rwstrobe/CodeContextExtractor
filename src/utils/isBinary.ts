import { promises as fs } from 'fs';

export async function isBinaryFile(filePath: string): Promise<boolean> {
  const handle = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(8000);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    if (bytesRead === 0) {
      return false;
    }
    let suspicious = 0;
    for (let i = 0; i < bytesRead; i += 1) {
      const byte = buffer[i];
      if (byte === 0) {
        return true;
      }
      if (byte < 7 || (byte > 14 && byte < 32)) {
        suspicious += 1;
      }
    }
    return suspicious / bytesRead > 0.3;
  } finally {
    await handle.close();
  }
}
