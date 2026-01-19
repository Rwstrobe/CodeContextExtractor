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
```bash
npm install
npm run build
npx --no-install code-context extract . --verbose
```

The output is written to `.code-context/` with a timestamped filename like:
```
.code-context/<root>_context_YYYY-MM-DD_HHMMSS.txt
```

## Important: .gitignore your outputs
> **Warning ⚠️**  
> CodeContextExtractor writes files into a `.code-context/` folder inside your project root. If that folder is not ignored, you may accidentally commit and push your context exports.

Add this line to your project's `.gitignore`:
```
.code-context/
```

## npm and npx (for beginners)
- `npm` is the package manager that installs tools and libraries.
- `npx` runs a tool. If it is not installed locally, it will try to download it.
- `--no-install` tells `npx` to only use what is already installed and skip downloads.

In this repo, `code-context` is not published to npm yet, so `npx` needs `--no-install` or a direct `node dist/cli.js` call.

## User journey (example)
You want to generate a context file for a project at `C:\projects\MyNewProject`.

### Step 1: Install CodeContextExtractor (one time)
```bash
git clone https://github.com/Rwstrobe/CodeContextExtractor.git
cd CodeContextExtractor
npm install
npm run build
```

### Step 2: Go to your project folder
```bash
cd C:\projects\MyNewProject
```

### Step 3: Generate the context file
```bash
npx --no-install code-context extract . --verbose
```

The output will be saved to:
```
.\.code-context\MyNewProject_context_YYYY-MM-DD_HHMMSS.txt
```

### macOS/Linux variant
You can follow the same steps with a Unix-style path:
```bash
cd ~/projects/MyNewProject
npx --no-install code-context extract . --verbose
```
The output will be saved to:
```
./.code-context/MyNewProject_context_YYYY-MM-DD_HHMMSS.txt
```

## Install from GitHub (beginner-friendly)
1. Clone the repository:
```bash
git clone https://github.com/<your-org-or-user>/CodeContextExtractor.git
```
2. Enter the project folder:
```bash
cd CodeContextExtractor
```
3. Install dependencies:
```bash
npm install
```
4. Build the CLI:
```bash
npm run build
```
5. Run the extractor:
```bash
npx --no-install code-context extract . --verbose
```

If you prefer, you can run the built CLI directly:
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
- Automatic output folder `.code-context/`

## Commands
### Extract
```bash
npx --no-install code-context extract [path]
```
Example:
```bash
npx --no-install code-context extract ./project --format md --depth 3 --verbose
```
If you installed the CLI globally (for example via `npm link` or a future npm publish), you can run:
```bash
code-context extract [path]
```

## Options
```bash
--out <file>            Output file (default: .code-context/<root>_context_YYYY-MM-DD_HHMMSS.txt)
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
- Skipped files with reasons (excluded, too large, binary, unreadable)
- For each included file: path, size, last modified, and contents in fenced blocks

## Redaction
Redaction is enabled by default to reduce accidental secret leakage. It targets:
- Common key/value patterns (tokens, passwords, api keys)
- Private key blocks
- Common credential formats (JWTs, GitHub tokens, AWS keys, etc.)

Disable redaction only when you are sure the output is safe:
```bash
code-context extract . --no-redact
```

## Default excludes
The following are excluded by default:
```
node_modules
dist
build
out
.code-context
.next
.turbo
.git
.idea
.vscode
coverage
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

## Configuration file
Use an optional JSON file (example: `example-config.json`) to set defaults.
```json
{
  "outFile": ".code-context/project_context_2026-01-19_145227.txt",
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
code-context extract . --config example-config.json
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

## License
MIT
