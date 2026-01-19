#!/usr/bin/env node
import { Command } from 'commander';
import { createWriteStream, promises as fs } from 'fs';
import path from 'path';
import { resolveConfig } from './config';
import { normalizePath } from './utils/normalizePath';
import { scan } from './scanner';
import { exportText } from './exporters/text';
import { exportMarkdown } from './exporters/markdown';

async function getVersion(): Promise<string> {
  try {
    const packagePath = path.resolve(__dirname, '..', 'package.json');
    const raw = await fs.readFile(packagePath, 'utf8');
    return JSON.parse(raw).version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

async function main(): Promise<void> {
  const program = new Command();
  program
    .name('code-context')
    .description(
      'Create a deterministic context file from a local codebase (folder tree + file contents).'
    );
  const version = await getVersion();
  program.version(version);
  program.addHelpText(
    'after',
    `
Examples:
  code-context extract . --verbose
  code-context extract . --format md --depth 3
  code-context extract C:\\projects\\MyNewProject --max-bytes 200000
`
  );

  program
    .command('extract')
    .argument('[path]', 'Root path', '.')
    .description('Generate a single context file from the target folder.')
    .option('--out <file>', 'Output file path (defaults to .code-context/<root>_context_...)')
    .option('--format <text|md>', 'Output format', 'text')
    .option('--depth <n>', 'Folder tree depth', (value) => parseInt(value, 10), 4)
    .option('--include <glob>', 'Include glob', collect, [])
    .option('--exclude <glob>', 'Exclude glob', collect, [])
    .option('--max-bytes <n>', 'Max file size in bytes', (value) => parseInt(value, 10), 500000)
    .option('--redact', 'Enable redaction', true)
    .option('--no-redact', 'Disable redaction')
    .option('--respect-gitignore', 'Respect .gitignore', true)
    .option('--no-gitignore', 'Ignore .gitignore')
    .option('--config <file>', 'Optional JSON config file')
    .option('--verbose', 'Verbose logging', false)
    .action(async (rootArg: string, options) => {
      const rootPath = path.resolve(process.cwd(), rootArg);
      const config = await resolveConfig(
        rootPath,
        {
          outFile: options.out,
          format: options.format,
          depth: options.depth,
          include: options.include,
          exclude: options.exclude,
          maxBytes: options.maxBytes,
          redact: options.redact,
          respectGitignore: options.gitignore ?? options.respectGitignore,
          verbose: options.verbose,
          configPath: options.config
        },
        process.cwd()
      );

      const outputPath = path.resolve(process.cwd(), config.outFile);
      const relativeOut = normalizePath(path.relative(rootPath, outputPath));
      const shouldExcludeOut =
        relativeOut !== '' && !relativeOut.startsWith('..') && !path.isAbsolute(relativeOut);
      const scanExcludes = shouldExcludeOut
        ? [...config.exclude, relativeOut]
        : config.exclude;

      const result = await scan(rootPath, {
        include: config.include,
        exclude: scanExcludes,
        maxBytes: config.maxBytes,
        respectGitignore: config.respectGitignore
      });

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      const output = createWriteStream(outputPath, { encoding: 'utf8' });
      const metadata = {
        version,
        command: process.argv.slice(2).join(' ')
      };

      if (config.format === 'md') {
        await exportMarkdown(result, config, output, metadata);
      } else {
        await exportText(result, config, output, metadata);
      }
      await new Promise<void>((resolve, reject) => {
        output.on('finish', resolve);
        output.on('error', reject);
        output.end();
      });

      if (config.verbose) {
        console.log(`Wrote ${result.files.length} files to ${outputPath}`);
      }
    });

  await program.parseAsync(process.argv);
}

function collect(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
