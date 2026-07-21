'use node';

import {
  createSharedExpense,
  normalizeSplitwiseBaseUrl,
  type ExactParticipant,
  SplitwiseClient,
} from '@mobills/integration-splitwise';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
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
  const apiKey = await openSecret({
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

    const sealed = await sealSecret(apiKey);
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

/** Parse a stored (string) Splitwise id into the numeric id the API expects. */
function parseSplitwiseId(value: string | undefined, context: string): number {
  if (value === undefined || value.trim() === '') {
    throw new Error(`${context} is missing a Splitwise id`);
  }
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${context} has an invalid Splitwise id: ${value}`);
  }
  return id;
}

/**
 * Post a previously-created bill to Splitwise as a single expense, with each
 * member owing their computed total. The operator (the connected Splitwise
 * user) is recorded as the payer, so everyone else owes their share back.
 *
 * - Every line item's member must have a `splitwiseUserId`.
 * - The operator must themselves be a line item (their Splitwise id must match
 *   the connected account) so they can be the payer.
 * - The target group is taken from `groupId` when provided, otherwise inferred
 *   from the members' shared `splitwiseGroupId` (falling back to an individual
 *   friend expense).
 */
export const postBill = action({
  args: {
    billId: v.id('bills'),
    groupId: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    expenseId: number;
    groupId: number;
    cost: string;
    currencyCode: string;
    memberCount: number;
  }> => {
    const ownerClerkUserId = await requireIdentitySubject(ctx);

    const connection = await ctx.runQuery(
      internal.splitwiseStore.getConnectionForOwner,
      { ownerClerkUserId },
    );
    if (connection === null) {
      throw new Error(
        'Splitwise is not connected. Run `mobills integration splitwise setup`.',
      );
    }

    const bill = await ctx.runQuery(internal.bills.getBillForOwner, {
      billId: args.billId,
      ownerClerkUserId,
    });
    if (bill === null) {
      throw new Error('Bill not found');
    }
    if (bill.postings.some((p) => p.integration === 'splitwise')) {
      throw new Error('This bill has already been posted to Splitwise.');
    }
    if (bill.lineItems.length === 0) {
      throw new Error('Bill has no line items to post');
    }

    const members = await ctx.runQuery(
      internal.members.listByAccountInternal,
      { accountId: bill.accountId },
    );
    const membersById = new Map(members.map((m) => [m._id, m]));

    const participants: ExactParticipant[] = bill.lineItems.map((item) => {
      const member = membersById.get(item.memberId as Id<'members'>);
      const userId = parseSplitwiseId(
        member?.splitwiseUserId,
        `Member "${item.name}"`,
      );
      return { userId, amount: item.totalCents / 100 };
    });

    // The connected operator must be one of the participants so they can pay.
    if (!participants.some((p) => p.userId === connection.splitwiseUserId)) {
      throw new Error(
        'The connected Splitwise account is not among the bill members. Add ' +
          "yourself as a member with your Splitwise id (`mobills member edit " +
          '--splitwise-id <id>`) before posting.',
      );
    }

    // Prefer an explicit group; otherwise infer a single shared group id from
    // the members, falling back to an individual (friend-to-friend) expense.
    let groupId = args.groupId;
    if (groupId === undefined) {
      const groupIds = new Set(
        bill.lineItems.map((item) => {
          const member = membersById.get(item.memberId as Id<'members'>);
          return member?.splitwiseGroupId ?? '';
        }),
      );
      groupId =
        groupIds.size === 1 && !groupIds.has('')
          ? parseSplitwiseId([...groupIds][0], 'Member group')
          : 0;
    }

    await ctx.runMutation(internal.bills.beginSplitwisePosting, {
      billId: args.billId,
      ownerClerkUserId,
    });

    const expense = await (async () => {
      try {
        const apiKey = await openSecret({
          ciphertext: connection.ciphertext,
          iv: connection.iv,
          authTag: connection.authTag,
        });
        const client = new SplitwiseClient({
          apiKey,
          ...(connection.baseUrl ? { baseUrl: connection.baseUrl } : {}),
        });

        return await createSharedExpense(client, {
          description: bill.label,
          cost: bill.totalCents / 100,
          currencyCode: bill.currencyCode,
          groupId,
          split: {
            kind: 'exact',
            payerUserId: connection.splitwiseUserId,
            participants,
          },
        });
      } catch (error) {
        await ctx
          .runMutation(internal.bills.releaseSplitwisePosting, {
            billId: args.billId,
            ownerClerkUserId,
          })
          .catch(() => undefined);
        throw error;
      }
    })();

    await ctx.runMutation(internal.bills.appendPosting, {
      billId: args.billId,
      ownerClerkUserId,
      integration: 'splitwise',
      reference: String(expense.id),
      groupId,
    });

    return {
      expenseId: expense.id,
      groupId,
      cost: expense.cost,
      currencyCode: bill.currencyCode,
      memberCount: participants.length,
    };
  },
});
