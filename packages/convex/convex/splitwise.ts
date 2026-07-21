'use node';

import {
  normalizeSplitwiseBaseUrl,
  SplitwiseClient,
} from '@mobills/integration-splitwise';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { action, type ActionCtx } from './_generated/server';
import { openSecret, sealSecret } from './lib/secretbox';

async function requireIdentitySubject(ctx: ActionCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error('Not authenticated');
  }
  return identity.subject;
}

/**
 * Builds a Splitwise client for the signed-in operator by loading and
 * decrypting their stored credential. Throws when Splitwise is not connected.
 */
async function clientForOwner(
  ctx: ActionCtx,
  ownerClerkUserId: string,
): Promise<SplitwiseClient> {
  const row = await ctx.runQuery(
    internal.splitwiseStore.getConnectionForOwner,
    { ownerClerkUserId },
  );
  if (row === null) {
    throw new Error(
      'Splitwise is not connected. Run `mobills integration splitwise setup`.',
    );
  }
  const apiKey = openSecret({
    ciphertext: row.ciphertext,
    iv: row.iv,
    authTag: row.authTag,
  });
  return new SplitwiseClient({
    apiKey,
    ...(row.baseUrl ? { baseUrl: row.baseUrl } : {}),
  });
}

/**
 * Connect Splitwise: validate the API key against Splitwise, then store it
 * encrypted. The plaintext key is used only in-memory here and never persisted.
 */
export const connect = action({
  args: { apiKey: v.string(), baseUrl: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const ownerClerkUserId = await requireIdentitySubject(ctx);

    const apiKey = args.apiKey.trim();
    if (apiKey.length === 0) {
      throw new Error('API key cannot be empty');
    }

    // Validate the user-supplied base URL at this trust boundary: it is
    // persisted and reused for later server-side requests carrying the
    // decrypted key, so an unvalidated value is an SSRF risk.
    const baseUrl =
      args.baseUrl !== undefined
        ? normalizeSplitwiseBaseUrl(args.baseUrl)
        : undefined;

    const client = new SplitwiseClient({
      apiKey,
      ...(baseUrl ? { baseUrl } : {}),
    });
    const user = await client.getCurrentUser();
    const connectedAs = `${user.first_name} ${user.last_name ?? ''}`.trim();

    const sealed = sealSecret(apiKey);
    await ctx.runMutation(internal.splitwiseStore.upsertConnection, {
      ownerClerkUserId,
      ciphertext: sealed.ciphertext,
      iv: sealed.iv,
      authTag: sealed.authTag,
      baseUrl,
      splitwiseUserId: user.id,
      connectedAs,
    });

    return {
      splitwiseUserId: user.id,
      connectedAs,
      email: user.email,
    };
  },
});

/** Return the connected Splitwise user. */
export const whoami = action({
  args: {},
  handler: async (ctx) => {
    const ownerClerkUserId = await requireIdentitySubject(ctx);
    const client = await clientForOwner(ctx, ownerClerkUserId);
    return await client.getCurrentUser();
  },
});

/** Return the connected user's Splitwise groups. */
export const groups = action({
  args: {},
  handler: async (ctx) => {
    const ownerClerkUserId = await requireIdentitySubject(ctx);
    const client = await clientForOwner(ctx, ownerClerkUserId);
    return await client.getGroups();
  },
});

/** Return the connected user's Splitwise friends. */
export const friends = action({
  args: {},
  handler: async (ctx) => {
    const ownerClerkUserId = await requireIdentitySubject(ctx);
    const client = await clientForOwner(ctx, ownerClerkUserId);
    return await client.getFriends();
  },
});

/** Disconnect Splitwise, deleting the stored credential. */
export const disconnect = action({
  args: {},
  handler: async (ctx): Promise<boolean> => {
    const ownerClerkUserId = await requireIdentitySubject(ctx);
    return await ctx.runMutation(internal.splitwiseStore.removeConnection, {
      ownerClerkUserId,
    });
  },
});
