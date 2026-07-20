import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { mutation, query, type QueryCtx } from './_generated/server';

async function requireOwnedAccount(
  ctx: QueryCtx,
  accountId: Id<'accounts'>,
  ownerClerkUserId: string,
) {
  const account = await ctx.db.get(accountId);
  if (account === null) {
    throw new Error('Account not found');
  }
  if (account.ownerClerkUserId !== ownerClerkUserId) {
    throw new Error('Not authorized for this account');
  }
  return account;
}

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

export const updateAccount = mutation({
  args: {
    accountId: v.id('accounts'),
    name: v.optional(v.string()),
    tmobileAccountNumber: v.optional(v.union(v.string(), v.null())),
    planName: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }

    await requireOwnedAccount(ctx, args.accountId, identity.subject);

    const patch: {
      name?: string;
      tmobileAccountNumber?: string | undefined;
      planName?: string | undefined;
    } = {};

    if (args.name !== undefined) {
      if (args.name.trim() === '') {
        throw new Error('name cannot be empty');
      }
      patch.name = args.name;
    }
    if (args.tmobileAccountNumber !== undefined) {
      patch.tmobileAccountNumber = args.tmobileAccountNumber ?? undefined;
    }
    if (args.planName !== undefined) {
      patch.planName = args.planName ?? undefined;
    }

    if (Object.keys(patch).length === 0) {
      throw new Error('No fields provided to update');
    }

    await ctx.db.patch(args.accountId, patch);
    return args.accountId;
  },
});
