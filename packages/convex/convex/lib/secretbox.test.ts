import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openSecret, sealSecret } from './secretbox';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

// A deterministic 32-byte key (base64) for the round-trip tests.
const BASE64_KEY = bytesToBase64(new Uint8Array(32).fill(7));
const HEX_KEY = bytesToHex(new Uint8Array(32).fill(9));

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

  it('round-trips a secret', async () => {
    const sealed = await sealSecret('splitwise-api-key');
    expect(sealed).toEqual(
      expect.objectContaining({
        ciphertext: expect.any(String),
        iv: expect.any(String),
        authTag: expect.any(String),
      }),
    );
    expect(await openSecret(sealed)).toBe('splitwise-api-key');
  });

  it('never stores the plaintext in the sealed output', async () => {
    const sealed = await sealSecret('super-secret-value');
    expect(sealed.ciphertext).not.toContain('super-secret-value');
    expect(atob(sealed.ciphertext)).not.toBe('super-secret-value');
  });

  it('uses a fresh iv for each encryption', async () => {
    const a = await sealSecret('same-input');
    const b = await sealSecret('same-input');
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('accepts a hex-encoded key', async () => {
    process.env.MOBILLS_SECRET_ENCRYPTION_KEY = HEX_KEY;
    const sealed = await sealSecret('k');
    expect(await openSecret(sealed)).toBe('k');
  });

  it('rejects a tampered auth tag', async () => {
    const sealed = await sealSecret('value');
    const tampered = {
      ...sealed,
      authTag: bytesToBase64(new Uint8Array(16).fill(1)),
    };
    await expect(openSecret(tampered)).rejects.toThrow();
  });

  it('rejects tampered ciphertext', async () => {
    const sealed = await sealSecret('value');
    const bytes = Uint8Array.from(atob(sealed.ciphertext), (char) =>
      char.charCodeAt(0),
    );
    bytes[0] ^= 0xff;
    await expect(
      openSecret({ ...sealed, ciphertext: bytesToBase64(bytes) }),
    ).rejects.toThrow();
  });

  it('cannot be decrypted with a different key', async () => {
    const sealed = await sealSecret('value');
    process.env.MOBILLS_SECRET_ENCRYPTION_KEY = bytesToBase64(
      new Uint8Array(32).fill(42),
    );
    await expect(openSecret(sealed)).rejects.toThrow();
  });

  it('throws a helpful error when the key is missing', async () => {
    delete process.env.MOBILLS_SECRET_ENCRYPTION_KEY;
    await expect(sealSecret('value')).rejects.toThrow(
      /MOBILLS_SECRET_ENCRYPTION_KEY/,
    );
  });

  it('throws when the key is not 32 bytes', async () => {
    process.env.MOBILLS_SECRET_ENCRYPTION_KEY = bytesToBase64(
      new Uint8Array(16).fill(1),
    );
    await expect(sealSecret('value')).rejects.toThrow(/32 bytes/);
  });
});
