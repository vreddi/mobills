/**
 * AES-256-GCM encryption for secrets stored in Convex.
 *
 * Runs only inside `"use node"` actions (it uses `node:crypto`). The master key
 * comes from the `MOBILLS_SECRET_ENCRYPTION_KEY` deployment environment
 * variable — set it with
 * `pnpm dlx convex env set MOBILLS_SECRET_ENCRYPTION_KEY <key>` (run from
 * `packages/convex`, or via the Convex dashboard). Accepts a 32-byte key
 * encoded as base64 or as 64 hex characters.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;

export interface SealedSecret {
  ciphertext: string;
  iv: string;
  authTag: string;
}

function loadMasterKey(): Buffer {
  const raw = process.env.MOBILLS_SECRET_ENCRYPTION_KEY;
  if (!raw || raw.length === 0) {
    throw new Error(
      'MOBILLS_SECRET_ENCRYPTION_KEY is not set on the Convex deployment. ' +
        'Generate one with `openssl rand -base64 32` and set it with ' +
        '`pnpm dlx convex env set MOBILLS_SECRET_ENCRYPTION_KEY <key>`.',
    );
  }

  const key = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64');

  if (key.length !== KEY_BYTES) {
    throw new Error(
      `MOBILLS_SECRET_ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes ` +
        '(a base64 or hex encoded 256-bit key).',
    );
  }
  return key;
}

/** Encrypts a plaintext secret with the deployment master key. */
export function sealSecret(plaintext: string): SealedSecret {
  const key = loadMasterKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  };
}

/** Decrypts a sealed secret produced by {@link sealSecret}. */
export function openSecret(sealed: SealedSecret): string {
  const key = loadMasterKey();
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(sealed.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(sealed.authTag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(sealed.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}
