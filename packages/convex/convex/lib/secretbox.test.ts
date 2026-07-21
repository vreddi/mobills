import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openSecret, sealSecret } from './secretbox';

// A deterministic 32-byte key (base64) for the round-trip tests.
const BASE64_KEY = Buffer.alloc(32, 7).toString('base64');
const HEX_KEY = Buffer.alloc(32, 9).toString('hex');

describe('secretbox', () => {
  let previousKey: string | undefined;

  beforeEach(() => {
    previousKey = process.env.MOBILLS_SECRET_ENCRYPTION_KEY;
    process.env.MOBILLS_SECRET_ENCRYPTION_KEY = BASE64_KEY;
  });

  afterEach(() => {
    if (previousKey === undefined) {
      delete process.env.MOBILLS_SECRET_ENCRYPTION_KEY;
    } else {
      process.env.MOBILLS_SECRET_ENCRYPTION_KEY = previousKey;
    }
  });

  it('round-trips a secret', () => {
    const sealed = sealSecret('splitwise-api-key');
    expect(sealed).toEqual(
      expect.objectContaining({
        ciphertext: expect.any(String),
        iv: expect.any(String),
        authTag: expect.any(String),
      }),
    );
    expect(openSecret(sealed)).toBe('splitwise-api-key');
  });

  it('never stores the plaintext in the sealed output', () => {
    const sealed = sealSecret('super-secret-value');
    expect(sealed.ciphertext).not.toContain('super-secret-value');
    expect(Buffer.from(sealed.ciphertext, 'base64').toString('utf8')).not.toBe(
      'super-secret-value',
    );
  });

  it('uses a fresh iv for each encryption', () => {
    const a = sealSecret('same-input');
    const b = sealSecret('same-input');
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('accepts a hex-encoded key', () => {
    process.env.MOBILLS_SECRET_ENCRYPTION_KEY = HEX_KEY;
    const sealed = sealSecret('k');
    expect(openSecret(sealed)).toBe('k');
  });

  it('rejects a tampered auth tag', () => {
    const sealed = sealSecret('value');
    const tampered = { ...sealed, authTag: Buffer.alloc(16, 1).toString('base64') };
    expect(() => openSecret(tampered)).toThrow();
  });

  it('rejects tampered ciphertext', () => {
    const sealed = sealSecret('value');
    const bytes = Buffer.from(sealed.ciphertext, 'base64');
    bytes[0] ^= 0xff;
    expect(() =>
      openSecret({ ...sealed, ciphertext: bytes.toString('base64') }),
    ).toThrow();
  });

  it('cannot be decrypted with a different key', () => {
    const sealed = sealSecret('value');
    process.env.MOBILLS_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 42).toString(
      'base64',
    );
    expect(() => openSecret(sealed)).toThrow();
  });

  it('throws a helpful error when the key is missing', () => {
    delete process.env.MOBILLS_SECRET_ENCRYPTION_KEY;
    expect(() => sealSecret('value')).toThrow(
      /MOBILLS_SECRET_ENCRYPTION_KEY/,
    );
  });

  it('throws when the key is not 32 bytes', () => {
    process.env.MOBILLS_SECRET_ENCRYPTION_KEY =
      Buffer.alloc(16, 1).toString('base64');
    expect(() => sealSecret('value')).toThrow(/32 bytes/);
  });
});
