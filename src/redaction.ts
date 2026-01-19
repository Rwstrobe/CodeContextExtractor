const BLOCK_PATTERNS: RegExp[] = [
  /-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bASIA[0-9A-Z]{16}\b/g,
  /\b(?:xox[baprs]-[A-Za-z0-9-]{10,})\b/g,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b/g,
  /\b(?:sk_live|sk_test)_[A-Za-z0-9]{20,}\b/g,
  /\beyJ[A-Za-z0-9_-]+?\.[A-Za-z0-9_-]+?\.[A-Za-z0-9_-]+?\b/g
];

const KEY_VALUE_PATTERN =
  /\b(api_key|apikey|token|secret|password|passphrase|key)\b(\s*[:=]\s*)['"]?([^'"\s]+)['"]?/gi;

export function redactText(input: string): string {
  let output = input;
  output = output.replace(KEY_VALUE_PATTERN, (_match, key, separator) => {
    return `${key}${separator}[REDACTED]`;
  });
  for (const pattern of BLOCK_PATTERNS) {
    output = output.replace(pattern, '[REDACTED]');
  }
  return output;
}
