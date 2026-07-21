/**
 * Best-effort access to the operating system keychain via `@napi-rs/keyring`
 * (macOS Keychain, Windows Credential Manager, Linux Secret Service).
 *
 * The native module is loaded lazily and every call is wrapped so that a
 * missing prebuilt binary or an unavailable secret service (e.g. a headless
 * Linux box without libsecret) degrades gracefully instead of crashing the
 * CLI. Callers treat a `false`/`null` result as "keychain unavailable" and
 * fall back to file storage.
 */

const SERVICE = 'mobills';

interface EntryLike {
  getPassword(): string | null;
  setPassword(password: string): void;
  deletePassword(): boolean;
}

interface KeyringModule {
  Entry: new (service: string, account: string) => EntryLike;
}

let modulePromise: Promise<KeyringModule | null> | undefined;

async function loadKeyring(): Promise<KeyringModule | null> {
  if (modulePromise === undefined) {
    modulePromise = import('@napi-rs/keyring')
      .then((mod) => mod as unknown as KeyringModule)
      .catch(() => null);
  }
  return modulePromise;
}

/** Returns true when the OS keychain can be used on this machine. */
export async function isKeychainAvailable(): Promise<boolean> {
  return (await loadKeyring()) !== null;
}

/** Reads a secret, or null when it is missing or the keychain is unavailable. */
export async function getKeychainSecret(account: string): Promise<string | null> {
  const mod = await loadKeyring();
  if (!mod) {
    return null;
  }
  try {
    return new mod.Entry(SERVICE, account).getPassword();
  } catch {
    return null;
  }
}

/** Stores a secret. Returns false when the keychain is unavailable. */
export async function setKeychainSecret(
  account: string,
  secret: string,
): Promise<boolean> {
  const mod = await loadKeyring();
  if (!mod) {
    return false;
  }
  try {
    new mod.Entry(SERVICE, account).setPassword(secret);
    return true;
  } catch {
    return false;
  }
}

/** Deletes a secret. Returns true only when an entry was actually removed. */
export async function deleteKeychainSecret(account: string): Promise<boolean> {
  const mod = await loadKeyring();
  if (!mod) {
    return false;
  }
  try {
    return new mod.Entry(SERVICE, account).deletePassword();
  } catch {
    return false;
  }
}
