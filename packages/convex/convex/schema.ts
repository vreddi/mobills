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
