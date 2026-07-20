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
    createdAt: v.number(),
  }).index('by_account', ['accountId']),
});
