import { once } from 'events';
import { createReadStream } from 'fs';
import { Transform } from 'stream';
import { redactText } from '../redaction';

class NormalizeTransform extends Transform {
  private carry = '';
  private readonly carrySize = 200;
  private readonly redact: boolean;

  constructor(redact: boolean) {
    super();
    this.redact = redact;
  }

  _transform(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    let text = this.carry + chunk.toString('utf8');
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    if (this.redact) {
      text = redactText(text);
    }
    const emitLength = Math.max(0, text.length - this.carrySize);
    this.carry = text.slice(emitLength);
    if (emitLength > 0) {
      this.push(text.slice(0, emitLength));
    }
    callback();
  }

  _flush(callback: (error?: Error | null) => void): void {
    let text = this.carry;
    if (this.redact) {
      text = redactText(text);
    }
    if (text.length > 0) {
      this.push(text);
    }
    callback();
  }
}

export async function writeText(stream: NodeJS.WritableStream, text: string): Promise<void> {
  if (!stream.write(text)) {
    await once(stream, 'drain');
  }
}

export async function streamFileContents(
  stream: NodeJS.WritableStream,
  filePath: string,
  redact: boolean
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const reader = createReadStream(filePath);
    const transformer = new NormalizeTransform(redact);
    reader.on('error', reject);
    transformer.on('error', reject);
    transformer.on('end', resolve);
    reader.pipe(transformer).pipe(stream, { end: false });
  });
}
