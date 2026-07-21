import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Stored configuration for the Splitwise integration. */
export interface SplitwiseIntegration {
  /** Splitwise personal API key. Kept only in the 0600 config file. */
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

/** All integrations the operator has configured on this machine. */
export interface IntegrationsFile {
  splitwise?: SplitwiseIntegration;
}

function configDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg && xdg.length > 0 ? xdg : join(homedir(), '.config');
  return join(base, 'mobills');
}

export function integrationsPath(): string {
  return join(configDir(), 'integrations.json');
}

export function readIntegrations(): IntegrationsFile {
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

export function readSplitwiseIntegration(): SplitwiseIntegration | null {
  return readIntegrations().splitwise ?? null;
}

export function saveSplitwiseIntegration(
  integration: SplitwiseIntegration,
): void {
  const file = readIntegrations();
  file.splitwise = integration;
  writeIntegrations(file);
}

/** Removes the stored Splitwise integration. Returns true if one existed. */
export function removeSplitwiseIntegration(): boolean {
  const file = readIntegrations();
  if (!file.splitwise) {
    return false;
  }
  delete file.splitwise;
  writeIntegrations(file);
  return true;
}
