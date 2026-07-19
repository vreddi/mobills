import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const createAccount = mutation({
  args: {
    name: v.string(),
    tmobileAccountNumber: v.optional(v.string()),
    planName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }

    return await ctx.db.insert('accounts', {
      name: args.name,
      tmobileAccountNumber: args.tmobileAccountNumber,
      planName: args.planName,
      ownerClerkUserId: identity.subject,
      createdAt: Date.now(),
    });
  },
});

export const listAccounts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }

    return await ctx.db
      .query('accounts')
      .withIndex('by_owner', (q) =>
        q.eq('ownerClerkUserId', identity.subject),
      )
      .collect();
  },
});
