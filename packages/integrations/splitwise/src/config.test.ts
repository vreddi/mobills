import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SPLITWISE_BASE_URL,
  normalizeSplitwiseBaseUrl,
} from './config';

describe('normalizeSplitwiseBaseUrl', () => {
  it('accepts the default Splitwise base URL', () => {
    expect(normalizeSplitwiseBaseUrl(DEFAULT_SPLITWISE_BASE_URL)).toBe(
      DEFAULT_SPLITWISE_BASE_URL,
    );
  });

  it('trims a trailing slash', () => {
    expect(
      normalizeSplitwiseBaseUrl('https://secure.splitwise.com/api/v3.0/'),
    ).toBe('https://secure.splitwise.com/api/v3.0');
  });

  it('rejects non-https schemes', () => {
    expect(() =>
      normalizeSplitwiseBaseUrl('http://secure.splitwise.com/api/v3.0'),
    ).toThrow(/https/);
  });

  it('rejects a different host (SSRF guard)', () => {
    expect(() =>
      normalizeSplitwiseBaseUrl('https://attacker.example.com/api/v3.0'),
    ).toThrow(/host/);
  });

  it('rejects an internal metadata endpoint', () => {
    expect(() =>
      normalizeSplitwiseBaseUrl('http://169.254.169.254/latest/meta-data'),
    ).toThrow();
  });

  it('rejects a malformed URL', () => {
    expect(() => normalizeSplitwiseBaseUrl('not a url')).toThrow(/valid URL/);
  });
});
