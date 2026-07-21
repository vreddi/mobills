import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  deleteKeychainSecret,
  getKeychainSecret,
  setKeychainSecret,
} from './keychain.js';

/** Where the Splitwise API key is kept at rest. */
export type SecretStorage = 'keychain' | 'file';

/** Keychain account name under which the Splitwise key is stored. */
const SPLITWISE_SECRET_ACCOUNT = 'splitwise';

/** A fully-resolved Splitwise integration, including the secret API key. */
export interface SplitwiseIntegration {
  /** Splitwise personal API key. */
  apiKey: string;
  /** Optional override for the Splitwise API base URL. */
  baseUrl?: string;
  /** Splitwise user id of the connected account, cached at setup time. */
  userId?: number;
  /** Human-readable name of the connected account, for display only. */
  connectedAs?: string;
  /** Epoch milliseconds when the integration was connected. */
  connectedAt?: number;
}

/** Non-secret metadata persisted in the config file. */
export interface SplitwiseMetadata {
  /** Where the API key lives. Absent on legacy files (treated as `file`). */
  secretStorage?: SecretStorage;
  /** Present only when `secretStorage` is `file`. */
  apiKey?: string;
  baseUrl?: string;
  userId?: number;
  connectedAs?: string;
  connectedAt?: number;
}

/** All integrations the operator has configured on this machine. */
export interface IntegrationsFile {
  splitwise?: SplitwiseMetadata;
}

function configDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg && xdg.length > 0 ? xdg : join(homedir(), '.config');
  return join(base, 'mobills');
}

export function integrationsPath(): string {
  return join(configDir(), 'integrations.json');
}

function readIntegrations(): IntegrationsFile {
  const path = integrationsPath();
  if (!existsSync(path)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as IntegrationsFile;
  } catch {
    return {};
  }
}

function writeIntegrations(file: IntegrationsFile): void {
  mkdirSync(configDir(), { recursive: true });
  writeFileSync(integrationsPath(), `${JSON.stringify(file, null, 2)}\n`, {
    mode: 0o600,
  });
}

/**
 * Returns the stored Splitwise metadata (no secret resolution), or null when
 * Splitwise has not been connected. Cheap and synchronous — use for status
 * and listing where the API key itself is not needed.
 */
export function readSplitwiseMetadata(): SplitwiseMetadata | null {
  return readIntegrations().splitwise ?? null;
}

/** Normalizes the storage location, defaulting legacy files to `file`. */
export function effectiveSecretStorage(meta: SplitwiseMetadata): SecretStorage {
  return meta.secretStorage ?? 'file';
}

/**
 * Returns the fully-resolved Splitwise integration, reading the API key from
 * the keychain when that is where it lives. Returns null when Splitwise is not
 * connected or the secret can no longer be found.
 */
export async function readSplitwiseIntegration(): Promise<SplitwiseIntegration | null> {
  const meta = readSplitwiseMetadata();
  if (!meta) {
    return null;
  }

  let apiKey: string | null;
  if (effectiveSecretStorage(meta) === 'keychain') {
    apiKey = await getKeychainSecret(SPLITWISE_SECRET_ACCOUNT);
  } else {
    apiKey = meta.apiKey ?? null;
  }
  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    baseUrl: meta.baseUrl,
    userId: meta.userId,
    connectedAs: meta.connectedAs,
    connectedAt: meta.connectedAt,
  };
}

/**
 * Persists the Splitwise integration, preferring the OS keychain for the API
 * key and falling back to the 0600 config file when the keychain is
 * unavailable. Returns where the secret was ultimately stored.
 */
export async function saveSplitwiseIntegration(
  integration: SplitwiseIntegration,
): Promise<SecretStorage> {
  const { apiKey, ...rest } = integration;

  const storedInKeychain = await setKeychainSecret(
    SPLITWISE_SECRET_ACCOUNT,
    apiKey,
  );

  const meta: SplitwiseMetadata = {
    secretStorage: storedInKeychain ? 'keychain' : 'file',
    baseUrl: rest.baseUrl,
    userId: rest.userId,
    connectedAs: rest.connectedAs,
    connectedAt: rest.connectedAt,
  };
  if (!storedInKeychain) {
    meta.apiKey = apiKey;
  }

  const file = readIntegrations();
  file.splitwise = meta;
  writeIntegrations(file);
  return meta.secretStorage as SecretStorage;
}

/**
 * Removes the stored Splitwise integration from both the keychain and the
 * config file. Returns true when an integration existed.
 */
export async function removeSplitwiseIntegration(): Promise<boolean> {
  const file = readIntegrations();
  const existed = file.splitwise !== undefined;

  // Best-effort keychain cleanup regardless of the recorded storage location,
  // so a stale keychain entry never lingers.
  await deleteKeychainSecret(SPLITWISE_SECRET_ACCOUNT);

  if (existed) {
    delete file.splitwise;
    writeIntegrations(file);
  }
  return existed;
}
