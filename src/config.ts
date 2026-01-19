import { promises as fs } from 'fs';
import path from 'path';

export type OutputFormat = 'text' | 'md';

export interface ConfigFile {
  outFile?: string;
  format?: OutputFormat;
  depth?: number;
  include?: string[];
  exclude?: string[];
  maxBytes?: number;
  redact?: boolean;
  respectGitignore?: boolean;
}

export interface Config {
  rootPath: string;
  outFile: string;
  format: OutputFormat;
  depth: number;
  include: string[];
  exclude: string[];
  maxBytes: number;
  redact: boolean;
  respectGitignore: boolean;
  verbose: boolean;
}

export const DEFAULT_EXCLUDES: string[] = [
  'node_modules/**',
  'dist/**',
  'build/**',
  'out/**',
  'code-context/**',
  '.next/**',
  '.turbo/**',
  '.git/**',
  '.idea/**',
  '.vscode/**',
  'coverage/**',
  '*.lock',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  '.npmrc',
  '.yarnrc',
  '.yarnrc.yml',
  '*.log',
  '*.pem',
  '*.key',
  '*.p12',
  '*.env',
  '.env.*',
  'secrets.*',
  'id_rsa',
  'id_ed25519'
];

export const DEFAULT_CONFIG = {
  format: 'text',
  depth: 4,
  include: [],
  exclude: [],
  maxBytes: 500000,
  redact: true,
  respectGitignore: true
};

export async function loadConfigFile(
  configPath: string | undefined,
  cwd: string
): Promise<ConfigFile> {
  if (!configPath) {
    return {};
  }
  const resolved = path.resolve(cwd, configPath);
  const contents = await fs.readFile(resolved, 'utf8');
  return JSON.parse(contents) as ConfigFile;
}

function pickArray<T>(primary: T[] | undefined, fallback: T[] | undefined): T[] {
  if (primary && primary.length > 0) {
    return primary;
  }
  if (fallback && fallback.length > 0) {
    return fallback;
  }
  return [];
}

export async function resolveConfig(
  rootPath: string,
  cliOptions: Partial<Config> & { configPath?: string },
  cwd: string
): Promise<Config> {
  const fileConfig = await loadConfigFile(cliOptions.configPath, cwd);
  const format = normalizeFormat(
    cliOptions.format ?? fileConfig.format ?? DEFAULT_CONFIG.format
  );
  const explicitOutFile = cliOptions.outFile ?? fileConfig.outFile;
  const outFile = explicitOutFile ?? buildAutoOutFile(rootPath, format);
  return {
    rootPath,
    outFile,
    format,
    depth: cliOptions.depth ?? fileConfig.depth ?? DEFAULT_CONFIG.depth,
    include: pickArray(cliOptions.include, fileConfig.include),
    exclude: pickArray(cliOptions.exclude, fileConfig.exclude),
    maxBytes: cliOptions.maxBytes ?? fileConfig.maxBytes ?? DEFAULT_CONFIG.maxBytes,
    redact: cliOptions.redact ?? fileConfig.redact ?? DEFAULT_CONFIG.redact,
    respectGitignore:
      cliOptions.respectGitignore ??
      fileConfig.respectGitignore ??
      DEFAULT_CONFIG.respectGitignore,
    verbose: cliOptions.verbose ?? false
  };
}

function buildAutoOutFile(rootPath: string, format: OutputFormat): string {
  const rootName = path.basename(rootPath) || 'project';
  const ext = format === 'md' ? 'md' : 'txt';
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate())
  ].join('-');
  const time = [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join('');
  return path.join(
    'code-context',
    `${rootName}_context_${stamp}_${time}.${ext}`
  );
}

function normalizeFormat(value: string | OutputFormat): OutputFormat {
  return value === 'md' ? 'md' : 'text';
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}
