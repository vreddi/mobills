import { divideBill, type BillMemberInput } from '@mobills/billing';
import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type QueryCtx,
} from './_generated/server';

async function requireOwnedAccount(
  ctx: QueryCtx,
  accountId: Id<'accounts'>,
  ownerClerkUserId: string,
): Promise<Doc<'accounts'>> {
  const account = await ctx.db.get(accountId);
  if (account === null) {
    throw new Error('Account not found');
  }
  if (account.ownerClerkUserId !== ownerClerkUserId) {
    throw new Error('Not authorized for this account');
  }
  return account;
}

const memberChargeArg = v.object({
  memberId: v.id('members'),
  individualTaxCents: v.optional(v.number()),
  contractPlanEquipmentCents: v.optional(v.number()),
  extraCents: v.optional(v.number()),
});

const LOCK_TTL_MS = 2 * 60 * 1000;

/**
 * Create a bill from the shared base pool plus each member's individual
 * charges. The server is authoritative: it re-derives the per-member breakdown
 * with the shared `@mobills/billing` logic rather than trusting client-computed
 * totals, and denormalizes each member's name onto the bill.
 */
export const createBill = mutation({
  args: {
    accountId: v.id('accounts'),
    label: v.string(),
    currencyCode: v.optional(v.string()),
    basePoolCents: v.number(),
    members: v.array(memberChargeArg),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }
    await requireOwnedAccount(ctx, args.accountId, identity.subject);

    const label = args.label.trim();
    if (label === '') {
      throw new Error('Bill label cannot be empty');
    }
    if (args.members.length === 0) {
      throw new Error('A bill needs at least one member');
    }

    const accountMembers = await ctx.db
      .query('members')
      .withIndex('by_account', (q) => q.eq('accountId', args.accountId))
      .collect();
    const membersById = new Map(accountMembers.map((m) => [m._id, m]));

    const input: BillMemberInput[] = args.members.map((entry) => {
      const member = membersById.get(entry.memberId);
      if (member === undefined) {
        throw new Error(
          `Member ${entry.memberId} does not belong to this account`,
        );
      }
      return {
        memberId: entry.memberId,
        name: member.name,
        individualTaxCents: entry.individualTaxCents,
        contractPlanEquipmentCents: entry.contractPlanEquipmentCents,
        extraCents: entry.extraCents,
      };
    });

    // `divideBill` validates non-negative integer cents, duplicates and a
    // non-zero total, and reconciles the shares exactly to the pool.
    const division = divideBill({
      basePoolCents: args.basePoolCents,
      currencyCode: args.currencyCode,
      members: input,
    });

    return await ctx.db.insert('bills', {
      accountId: args.accountId,
      ownerClerkUserId: identity.subject,
      label,
      currencyCode: division.currencyCode,
      basePoolCents: division.basePoolCents,
      totalCents: division.totalCents,
      lineItems: division.members.map((m) => ({
        memberId: m.memberId as Id<'members'>,
        name: m.name,
        baseShareCents: m.baseShareCents,
        individualTaxCents: m.individualTaxCents,
        contractPlanEquipmentCents: m.contractPlanEquipmentCents,
        extraCents: m.extraCents,
        totalCents: m.totalCents,
      })),
      postings: [],
      createdAt: Date.now(),
    });
  },
});

/** List the bills for an account, newest first. */
export const listBills = query({
  args: { accountId: v.id('accounts') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }
    await requireOwnedAccount(ctx, args.accountId, identity.subject);

    const bills = await ctx.db
      .query('bills')
      .withIndex('by_account', (q) => q.eq('accountId', args.accountId))
      .collect();
    return bills.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Fetch a single bill, verifying the caller owns it. */
export const getBill = query({
  args: { billId: v.id('bills') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }
    const bill = await ctx.db.get(args.billId);
    if (bill === null) {
      throw new Error('Bill not found');
    }
    if (bill.ownerClerkUserId !== identity.subject) {
      throw new Error('Not authorized for this bill');
    }
    return bill;
  },
});

/**
 * Internal: load a bill for a specific owner. Used by the Splitwise posting
 * action, which has already authenticated the operator.
 */
export const getBillForOwner = internalQuery({
  args: { billId: v.id('bills'), ownerClerkUserId: v.string() },
  handler: async (ctx, args) => {
    const bill = await ctx.db.get(args.billId);
    if (bill === null) {
      return null;
    }
    if (bill.ownerClerkUserId !== args.ownerClerkUserId) {
      throw new Error('Not authorized for this bill');
    }
    return bill;
  },
});

/** Internal: reserve a bill before posting it to Splitwise. */
export const beginSplitwisePosting = internalMutation({
  args: { billId: v.id('bills'), ownerClerkUserId: v.string() },
  handler: async (ctx, args) => {
    const bill = await ctx.db.get(args.billId);
    if (bill === null) {
      throw new Error('Bill not found');
    }
    if (bill.ownerClerkUserId !== args.ownerClerkUserId) {
      throw new Error('Not authorized for this bill');
    }
    if (bill.postings.some((p) => p.integration === 'splitwise')) {
      throw new Error('This bill has already been posted to splitwise.');
    }

    const now = Date.now();
    if (
      bill.splitwisePostingStartedAt !== undefined &&
      now - bill.splitwisePostingStartedAt < LOCK_TTL_MS
    ) {
      throw new Error('A Splitwise post for this bill is already in progress.');
    }

    await ctx.db.patch(args.billId, { splitwisePostingStartedAt: now });
    return args.billId;
  },
});

/** Internal: release a Splitwise posting reservation after a failed post. */
export const releaseSplitwisePosting = internalMutation({
  args: { billId: v.id('bills'), ownerClerkUserId: v.string() },
  handler: async (ctx, args) => {
    const bill = await ctx.db.get(args.billId);
    if (bill === null) {
      throw new Error('Bill not found');
    }
    if (bill.ownerClerkUserId !== args.ownerClerkUserId) {
      throw new Error('Not authorized for this bill');
    }
    if (bill.splitwisePostingStartedAt !== undefined) {
      await ctx.db.patch(args.billId, {
        splitwisePostingStartedAt: undefined,
      });
    }
    return args.billId;
  },
});

/** Internal: append a posting record after a bill is posted to an integration. */
export const appendPosting = internalMutation({
  args: {
    billId: v.id('bills'),
    ownerClerkUserId: v.string(),
    integration: v.literal('splitwise'),
    reference: v.string(),
    groupId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const bill = await ctx.db.get(args.billId);
    if (bill === null) {
      throw new Error('Bill not found');
    }
    if (bill.ownerClerkUserId !== args.ownerClerkUserId) {
      throw new Error('Not authorized for this bill');
    }
    // Enforce single-post per integration in the transactional mutation so a
    // retried or concurrent action cannot record (and thus effectively allow) a
    // duplicate posting.
    if (bill.postings.some((p) => p.integration === args.integration)) {
      throw new Error(
        `This bill has already been posted to ${args.integration}.`,
      );
    }
    await ctx.db.patch(args.billId, {
      postings: [
        ...bill.postings,
        {
          integration: args.integration,
          reference: args.reference,
          groupId: args.groupId,
          postedAt: Date.now(),
        },
      ],
      splitwisePostingStartedAt: undefined,
    });
    return args.billId;
  },
});
