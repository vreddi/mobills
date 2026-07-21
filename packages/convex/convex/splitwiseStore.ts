import { v } from 'convex/values';
import {
  internalMutation,
  internalQuery,
  query,
} from './_generated/server';

/**
 * Internal: fetch the raw (still-encrypted) Splitwise connection for an owner.
 * Only callable from other Convex functions (the actions decrypt it in Node).
 */
export const getConnectionForOwner = internalQuery({
  args: { ownerClerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('splitwiseConnections')
      .withIndex('by_owner', (q) =>
        q.eq('ownerClerkUserId', args.ownerClerkUserId),
      )
      .unique();
  },
});

/** Internal: create or replace an owner's encrypted Splitwise connection. */
export const upsertConnection = internalMutation({
  args: {
    ownerClerkUserId: v.string(),
    ciphertext: v.string(),
    iv: v.string(),
    authTag: v.string(),
    baseUrl: v.optional(v.string()),
    splitwiseUserId: v.number(),
    connectedAs: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('splitwiseConnections')
      .withIndex('by_owner', (q) =>
        q.eq('ownerClerkUserId', args.ownerClerkUserId),
      )
      .unique();

    const now = Date.now();
    const fields = {
      ownerClerkUserId: args.ownerClerkUserId,
      ciphertext: args.ciphertext,
      iv: args.iv,
      authTag: args.authTag,
      baseUrl: args.baseUrl,
      splitwiseUserId: args.splitwiseUserId,
      connectedAs: args.connectedAs,
    };

    if (existing !== null) {
      await ctx.db.patch(existing._id, { ...fields, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert('splitwiseConnections', {
      ...fields,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Internal: delete an owner's Splitwise connection. Returns whether one existed. */
export const removeConnection = internalMutation({
  args: { ownerClerkUserId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('splitwiseConnections')
      .withIndex('by_owner', (q) =>
        q.eq('ownerClerkUserId', args.ownerClerkUserId),
      )
      .unique();
    if (existing === null) {
      return false;
    }
    await ctx.db.delete(existing._id);
    return true;
  },
});

/**
 * Public: report whether the signed-in operator has connected Splitwise,
 * returning only non-secret metadata (never the API key).
 */
export const status = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }
    const row = await ctx.db
      .query('splitwiseConnections')
      .withIndex('by_owner', (q) =>
        q.eq('ownerClerkUserId', identity.subject),
      )
      .unique();
    if (row === null) {
      return { connected: false as const };
    }
    return {
      connected: true as const,
      connectedAs: row.connectedAs,
      splitwiseUserId: row.splitwiseUserId,
      connectedAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },
});
