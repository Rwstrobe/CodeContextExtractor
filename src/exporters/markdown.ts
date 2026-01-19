import path from 'path';
import { Config } from '../config';
import { FileEntry, ScanResult } from '../scanner';
import { buildTreeLines } from './tree';
import { streamFileContents, writeText } from './writer';

function formatBytes(size: number): string {
  return `${size} bytes`;
}

function formatDate(ms: number): string {
  return new Date(ms).toISOString();
}

function languageFromPath(filePath: string): string {
  const ext = path.extname(filePath).replace('.', '');
  return ext || '';
}

async function writeFileSection(
  stream: NodeJS.WritableStream,
  file: FileEntry,
  redact: boolean
): Promise<void> {
  const language = languageFromPath(file.relativePath);
  await writeText(stream, `### ${file.relativePath}\n\n`);
  await writeText(stream, `- Size: ${formatBytes(file.size)}\n`);
  await writeText(stream, `- Modified: ${formatDate(file.mtimeMs)}\n\n`);
  await writeText(stream, `\`\`\`${language}\n`);
  await streamFileContents(stream, file.absolutePath, redact);
  await writeText(stream, '\n```\n\n');
}

export async function exportMarkdown(
  result: ScanResult,
  config: Config,
  output: NodeJS.WritableStream,
  metadata: { version: string; command: string }
): Promise<void> {
  await writeText(output, '# LLM Context\n\n');
  await writeText(
    output,
    'This file contains a deterministic snapshot of the repository: a folder tree and selected file contents.\n'
  );
  await writeText(output, 'Use it for analysis, debugging, and planning changes.\n');
  await writeText(output, 'Treat redacted values as unavailable.\n\n');

  const treeLines = buildTreeLines(
    result.files.map((file) => file.relativePath),
    config.depth
  );
  const totalBytes = result.files.reduce((sum, file) => sum + file.size, 0);

  await writeText(output, '# Code Context\n\n');
  await writeText(output, '## Metadata\n');
  await writeText(output, `- Root: ${result.rootPath}\n`);
  await writeText(output, `- Timestamp: ${new Date().toISOString()}\n`);
  await writeText(output, `- Version: ${metadata.version}\n`);
  await writeText(output, `- Command: ${metadata.command}\n`);
  await writeText(
    output,
    `- Config: format=${config.format} depth=${config.depth} maxBytes=${config.maxBytes} redact=${config.redact} respectGitignore=${config.respectGitignore}\n`
  );
  await writeText(
    output,
    `- Includes: ${config.include.length > 0 ? config.include.join(', ') : '(all)'}\n`
  );
  await writeText(
    output,
    `- Excludes: ${config.exclude.length > 0 ? config.exclude.join(', ') : '(defaults only)'}\n\n`
  );
  await writeText(output, '## Folder Tree\n\n');
  await writeText(output, '```\n');
  for (const line of treeLines) {
    await writeText(output, `${line}\n`);
  }
  await writeText(output, '```\n\n');
  await writeText(output, '## Included Files Summary\n');
  await writeText(output, `- Count: ${result.files.length}\n`);
  await writeText(output, `- Total Size: ${formatBytes(totalBytes)}\n\n`);
  await writeText(output, '## Skipped Files\n');
  if (result.skipped.length === 0) {
    await writeText(output, '- (none)\n\n');
  } else {
    for (const skipped of result.skipped) {
      await writeText(output, `- ${skipped.relativePath} (${skipped.reason})\n`);
    }
    await writeText(output, '\n');
  }
  await writeText(output, '## Files\n\n');
  for (const file of result.files) {
    await writeFileSection(output, file, config.redact);
  }
}
