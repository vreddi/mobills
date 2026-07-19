import { createClerkClient } from '@clerk/backend';

export interface ClerkUserProfile {
  name: string | null;
  email: string | null;
  signInMethod: string;
  imageUrl?: string;
  lastSignInAt?: number;
}

/**
 * Turns a Clerk `externalAccounts` provider id (e.g. `oauth_google`) into a
 * human-friendly label (e.g. `Google`).
 */
function providerLabel(provider: string): string {
  const name = provider.replace(/^oauth_/, '');
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Fetches the full Clerk user profile for `userId` using the server-side
 * `CLERK_SECRET_KEY`. Returns `null` if the key isn't configured or the
 * lookup fails for any reason, so callers can fall back to JWT claims.
 */
export async function fetchClerkUser(
  userId: string,
): Promise<ClerkUserProfile | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  try {
    const clerkClient = createClerkClient({ secretKey });
    const user = await clerkClient.users.getUser(userId);

    const primaryEmail = user.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId,
    );
    const email = primaryEmail?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;

    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

    let signInMethod = 'Email';
    if (user.externalAccounts.length > 0) {
      signInMethod = user.externalAccounts
        .map((account) => providerLabel(account.provider))
        .join(', ');
    } else if (user.passwordEnabled) {
      signInMethod = 'Email & password';
    }

    return {
      name: name.length > 0 ? name : (user.username ?? null),
      email,
      signInMethod,
      imageUrl: user.imageUrl,
      lastSignInAt: user.lastSignInAt ?? undefined,
    };
  } catch {
    return null;
  }
}
