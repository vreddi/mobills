import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  accounts: defineTable({
    name: v.string(),
    tmobileAccountNumber: v.optional(v.string()),
    planName: v.optional(v.string()),
    ownerClerkUserId: v.string(),
    createdAt: v.number(),
  }).index('by_owner', ['ownerClerkUserId']),

  members: defineTable({
    accountId: v.id('accounts'),
    name: v.string(),
    email: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    lineType: v.optional(
      v.union(v.literal('primary'), v.literal('additional')),
    ),
    splitwiseUserId: v.optional(v.string()),
    splitwiseGroupId: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_account', ['accountId']),

  // A bill for one cycle: the shared base pool plus each member's individual
  // charges, divided into a per-member breakdown. The breakdown is denormalized
  // (member name + every category, all in integer cents) so a historical bill
  // stays accurate even if a member is later renamed or removed.
  bills: defineTable({
    accountId: v.id('accounts'),
    ownerClerkUserId: v.string(),
    // Human label / cadence, e.g. "Jan 2025 0".
    label: v.string(),
    currencyCode: v.string(),
    // Shared "Base + Base Tax" pool, split equally across the line items.
    basePoolCents: v.number(),
    // Sum of every line item's total — the whole bill.
    totalCents: v.number(),
    lineItems: v.array(
      v.object({
        memberId: v.id('members'),
        name: v.string(),
        baseShareCents: v.number(),
        individualTaxCents: v.number(),
        contractPlanEquipmentCents: v.number(),
        extraCents: v.number(),
        totalCents: v.number(),
      }),
    ),
    // Record of where this bill has been posted (e.g. Splitwise). Empty until
    // the operator posts it through an integration.
    postings: v.array(
      v.object({
        integration: v.literal('splitwise'),
        // Comma-separated Splitwise expense ids, or similar external reference.
        reference: v.string(),
        // Splitwise group id the expense landed in, or 0 for an individual
        // (friend-to-friend) expense.
        groupId: v.optional(v.number()),
        postedAt: v.number(),
      }),
    ),
    splitwisePostingLock: v.optional(
      v.object({ token: v.string(), startedAt: v.number() }),
    ),
    createdAt: v.number(),
  }).index('by_account', ['accountId']),

  // Per-operator Splitwise credential, encrypted at rest. The plaintext API key
  // is never stored — only the AES-256-GCM ciphertext plus the iv/authTag
  // needed to decrypt it inside a Convex action.
  splitwiseConnections: defineTable({
    ownerClerkUserId: v.string(),
    ciphertext: v.string(),
    iv: v.string(),
    authTag: v.string(),
    baseUrl: v.optional(v.string()),
    splitwiseUserId: v.number(),
    connectedAs: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_owner', ['ownerClerkUserId']),
});
