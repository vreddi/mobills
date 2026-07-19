import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface StoredCredentials {
  token: string;
  /** Epoch milliseconds at which the token expires, if known. */
  expiresAt?: number;
  /** Clerk user id (JWT `sub`), if decodable. */
  subject?: string;
  /** Best-effort name/email claims decoded straight from the token, if present. */
  name?: string;
  email?: string;
}

function configDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg && xdg.length > 0 ? xdg : join(homedir(), '.config');
  return join(base, 'mobills');
}

export function credentialsPath(): string {
  return join(configDir(), 'credentials.json');
}

interface DecodedJwtClaims {
  exp?: number;
  sub?: string;
  name?: string;
  email?: string;
}

function decodeJwt(token: string): DecodedJwtClaims {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return {};
    }
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    const claims = JSON.parse(json) as {
      exp?: number;
      sub?: string;
      name?: string;
      email?: string;
    };
    return {
      exp: claims.exp,
      sub: claims.sub,
      name: claims.name,
      email: claims.email,
    };
  } catch {
    return {};
  }
}

export function saveToken(token: string): StoredCredentials {
  const { exp, sub, name, email } = decodeJwt(token);
  const creds: StoredCredentials = {
    token,
    expiresAt: exp !== undefined ? exp * 1000 : undefined,
    subject: sub,
    name,
    email,
  };
  mkdirSync(configDir(), { recursive: true });
  writeFileSync(credentialsPath(), `${JSON.stringify(creds, null, 2)}\n`, {
    mode: 0o600,
  });
  return creds;
}

export function readCredentials(): StoredCredentials | null {
  const path = credentialsPath();
  if (!existsSync(path)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as StoredCredentials;
  } catch {
    return null;
  }
}

/**
 * Returns the cached token if present and not within `skewMs` of expiring,
 * otherwise null.
 */
export function getStoredToken(skewMs = 5_000): string | null {
  const creds = readCredentials();
  if (!creds) {
    return null;
  }
  if (creds.expiresAt !== undefined && creds.expiresAt - skewMs <= Date.now()) {
    return null;
  }
  return creds.token;
}

export function clearCredentials(): boolean {
  const path = credentialsPath();
  if (!existsSync(path)) {
    return false;
  }
  rmSync(path);
  return true;
}
