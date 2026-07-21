/**
 * AES-256-GCM encryption for secrets stored in Convex.
 *
 * Uses the Web Crypto API (`crypto.subtle`) instead of `node:crypto` so this
 * module runs in Convex's default V8 isolate runtime (which does not expose
 * `node:crypto`) as well as in Node. Any non-`"use node"` module that imports
 * `node:crypto` fails to bundle for the isolate runtime, which silently
 * breaks the whole deploy — see https://docs.convex.dev/functions/runtimes
 * and https://docs.convex.dev/functions/bundling.
 *
 * The master key comes from the `MOBILLS_SECRET_ENCRYPTION_KEY` deployment
 * environment variable — set it with
 * `pnpm dlx convex env set MOBILLS_SECRET_ENCRYPTION_KEY <key>` (run from
 * `packages/convex`, or via the Convex dashboard). Accepts a 32-byte key
 * encoded as base64 or as 64 hex characters.
 */
const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export interface SealedSecret {
  ciphertext: string;
  iv: string;
  authTag: string;
}

function loadMasterKeyBytes(): Uint8Array {
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

async function importMasterKey() {
  const keyBytes = loadMasterKeyBytes();
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
}

/** Encrypts a plaintext secret with the deployment master key. */
export async function sealSecret(plaintext: string): Promise<SealedSecret> {
  const key = await importMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      textEncoder.encode(plaintext),
    ),
  );

  // Web Crypto AES-GCM appends the auth tag to the ciphertext; split it back
  // out so the stored shape matches the previous node:crypto format.
  const authTag = encrypted.slice(encrypted.length - AUTH_TAG_BYTES);
  const ciphertext = encrypted.slice(0, encrypted.length - AUTH_TAG_BYTES);

  return {
    ciphertext: Buffer.from(ciphertext).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
    authTag: Buffer.from(authTag).toString('base64'),
  };
}

/** Decrypts a sealed secret produced by {@link sealSecret}. */
export async function openSecret(sealed: SealedSecret): Promise<string> {
  const key = await importMasterKey();
  const iv = Buffer.from(sealed.iv, 'base64');
  const data = Buffer.concat([
    Buffer.from(sealed.ciphertext, 'base64'),
    Buffer.from(sealed.authTag, 'base64'),
  ]);

  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return textDecoder.decode(plaintext);
}
