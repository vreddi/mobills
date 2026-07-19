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

export const addMember = mutation({
  args: {
    accountId: v.id('accounts'),
    name: v.string(),
    email: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    lineType: v.optional(
      v.union(v.literal('primary'), v.literal('additional')),
    ),
    monthlyShare: v.optional(v.number()),
    splitwiseUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }

    await requireOwnedAccount(ctx, args.accountId, identity.subject);

    return await ctx.db.insert('members', {
      accountId: args.accountId,
      name: args.name,
      email: args.email,
      phoneNumber: args.phoneNumber,
      lineType: args.lineType,
      monthlyShare: args.monthlyShare,
      splitwiseUserId: args.splitwiseUserId,
      createdAt: Date.now(),
    });
  },
});

export const listMembers = query({
  args: {
    accountId: v.id('accounts'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }

    await requireOwnedAccount(ctx, args.accountId, identity.subject);

    return await ctx.db
      .query('members')
      .withIndex('by_account', (q) => q.eq('accountId', args.accountId))
      .collect();
  },
});
