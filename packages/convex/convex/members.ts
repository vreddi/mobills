import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import {
  internalQuery,
  mutation,
  query,
  type QueryCtx,
} from './_generated/server';

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
    splitwiseUserId: v.optional(v.string()),
    splitwiseGroupId: v.optional(v.string()),
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
      splitwiseUserId: args.splitwiseUserId,
      splitwiseGroupId: args.splitwiseGroupId,
      createdAt: Date.now(),
    });
  },
});

export const updateMember = mutation({
  args: {
    memberId: v.id('members'),
    name: v.optional(v.string()),
    email: v.optional(v.union(v.string(), v.null())),
    phoneNumber: v.optional(v.union(v.string(), v.null())),
    lineType: v.optional(
      v.union(v.literal('primary'), v.literal('additional'), v.null()),
    ),
    splitwiseUserId: v.optional(v.union(v.string(), v.null())),
    splitwiseGroupId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }

    const member = await ctx.db.get(args.memberId);
    if (member === null) {
      throw new Error('Member not found');
    }
    await requireOwnedAccount(ctx, member.accountId, identity.subject);

    const patch: {
      name?: string;
      email?: string | undefined;
      phoneNumber?: string | undefined;
      lineType?: 'primary' | 'additional' | undefined;
      splitwiseUserId?: string | undefined;
      splitwiseGroupId?: string | undefined;
    } = {};

    if (args.name !== undefined) {
      if (args.name.trim() === '') {
        throw new Error('name cannot be empty');
      }
      patch.name = args.name;
    }
    if (args.email !== undefined) {
      patch.email = args.email ?? undefined;
    }
    if (args.phoneNumber !== undefined) {
      patch.phoneNumber = args.phoneNumber ?? undefined;
    }
    if (args.lineType !== undefined) {
      patch.lineType = args.lineType ?? undefined;
    }
    if (args.splitwiseUserId !== undefined) {
      patch.splitwiseUserId = args.splitwiseUserId ?? undefined;
    }
    if (args.splitwiseGroupId !== undefined) {
      patch.splitwiseGroupId = args.splitwiseGroupId ?? undefined;
    }

    if (Object.keys(patch).length === 0) {
      throw new Error('No fields provided to update');
    }

    await ctx.db.patch(args.memberId, patch);
    return args.memberId;
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

/**
 * Internal: list the members of an account without an auth check. Used by the
 * Splitwise posting action (which has already authenticated and authorized the
 * operator) to resolve each line item's Splitwise identity.
 */
export const listByAccountInternal = internalQuery({
  args: { accountId: v.id('accounts') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('members')
      .withIndex('by_account', (q) => q.eq('accountId', args.accountId))
      .collect();
  },
});
