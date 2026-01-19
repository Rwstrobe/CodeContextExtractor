import { describe, expect, it } from 'vitest';
import { redactText } from '../src/redaction';

describe('redactText', () => {
  it('redacts key value pairs', () => {
    const input = 'API_KEY=supersecret';
    const output = redactText(input);
    expect(output).toBe('API_KEY=[REDACTED]');
  });

  it('redacts private key blocks', () => {
    const input = '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----';
    const output = redactText(input);
    expect(output).toBe('[REDACTED]');
  });
});
