# CodeContextExtractor

CodeContextExtractor is a local-only CLI that captures a deterministic snapshot of a codebase and writes it to a single text or Markdown file. It exists for one purpose: safely sharing repository context with an AI assistant or teammate without uploading the repo itself or exposing sensitive files.

## Why it exists
- Developers need a clean, reliable way to send project context to AI tools
- Repositories contain secrets, binaries, and noise that should be skipped by default

## Who it is for
- Engineers who want fast, offline context exports
- Teams who need predictable, reproducible outputs
- Anyone who shares code with AI systems and wants safe defaults

## Quick start
1. Open a terminal at your project root (the folder you want to scan).  
   Example on Windows:
```bash
cd C:\projects\MyNewProject
```
2. Run the command (npx will install on first use if needed):
```bash
npx code-context-extractor extract . --verbose
```
3. Open the `code-context/` folder in your project (for example: `C:\projects\MyNewProject\code-context`).
4. Locate the newest file, named like:
```
code-context/<root>_context_YYYY-MM-DD_HHMMSS.txt
```
Example:
```
code-context/MyNewProject_context_2026-01-20_145743.txt
```
5. Paste that file into your AI tool when you want it to understand the codebase.

## Important: .gitignore your outputs
> **Warning ⚠️**  
> CodeContextExtractor writes files into a `code-context/` folder inside your project root. If that folder is not ignored, you may accidentally commit and push your context exports.

Add this line to your project's `.gitignore`:
```
code-context/
```

## Install from GitHub (optional)
```bash
git clone https://github.com/Rwstrobe/CodeContextExtractor.git
cd CodeContextExtractor
npm install
npm run build
npm link
```

Run the linked CLI:
```bash
code-context-extractor extract . --verbose
```

Or run the built CLI directly:
```bash
node dist/cli.js extract . --verbose
```

## Features
- Local-only operation (no network calls, telemetry, or analytics)
- Cross-platform: Windows, macOS, Linux
- Safe defaults with common sensitive excludes
- Configurable include/exclude globs and max file size
- Deterministic ordering and normalized paths/line endings
- Streaming output (does not load large files into memory)
- Conservative redaction enabled by default
- Optional Markdown output
- Automatic output folder `code-context/`

## Commands
### Extract
```bash
code-context-extractor extract [path]
```
Example:
```bash
code-context-extractor extract ./project --format md --depth 3 --verbose
```

## Options
```bash
--out <file>            Output file (default: code-context/<root>_context_YYYY-MM-DD_HHMMSS.txt)
--format <text|md>      Output format (default: text)
--depth <n>             Tree depth (default: 4)
--include <glob>        Include glob (repeatable)
--exclude <glob>        Exclude glob (repeatable)
--max-bytes <n>         Max file size in bytes (default: 500000)
--redact                Enable redaction (default: true)
--no-redact             Disable redaction
--respect-gitignore     Honor .gitignore (default: true)
--no-gitignore          Ignore .gitignore rules
--config <file>         Optional JSON config file
--verbose               Verbose logging
```

## Output format
Each output file contains:
- LLM context header (how to interpret the file)
- Metadata header (root path, timestamp, tool version, command, config summary)
- Folder tree (depth-limited)
- Included files summary (count and total size)
- Skipped files summary (total, by reason, top roots)
- For each included file: path, size, last modified, and contents in fenced blocks

## Redaction
Redaction is enabled by default to reduce accidental secret leakage. It targets:
- Common key/value patterns (tokens, passwords, api keys)
- Private key blocks
- Common credential formats (JWTs, GitHub tokens, AWS keys, etc.)

Disable redaction only when you are sure the output is safe:
```bash
code-context-extractor extract . --no-redact
```

## Default excludes
The following are excluded by default:
```
node_modules
dist
build
out
code-context
.next
.turbo
.git
.idea
.vscode
coverage
package-lock.json
yarn.lock
pnpm-lock.yaml
bun.lockb
.npmrc
.yarnrc
.yarnrc.yml
*.lock
*.log
*.pem
*.key
*.p12
*.env
.env.*
secrets.*
id_rsa
id_ed25519
```

Lock files are excluded by default because they are machine-generated, often large, and typically add little architectural context.

## Configuration file
Use an optional JSON file (example: `example-config.json`) to set defaults.
```json
{
  "outFile": "code-context/project_context_2026-01-19_145227.txt",
  "format": "text",
  "depth": 4,
  "include": [],
  "exclude": [],
  "maxBytes": 500000,
  "redact": true,
  "respectGitignore": true
}
```

Use it like this:
```bash
code-context-extractor extract . --config example-config.json
```

## Safety posture
- No network access or external services
- Does not execute or evaluate code from your repository
- Skips common sensitive files by default
- Redacts likely secrets unless `--no-redact` is specified

## Development
```bash
npm run build
npm test
```

## FAQ
**Does this upload my repo or call any APIs?**  
No. It is local-only, with no network calls or telemetry.

**Why use npx?**  
`npx` runs the CLI without a global install. It will download the package if needed.

**Why are `.git` and `node_modules` excluded?**  
They add a lot of noise and size without improving architectural context.

**The output is huge. How do I reduce it?**  
Use `--depth`, `--max-bytes`, and more `--exclude` globs, or add a config file.

## License
MIT



