/**
 * High-level Splitwise capability: turn a mobills-style split description into a
 * validated Splitwise expense and (optionally) post it.
 *
 * This is the main entry point other code should use. It composes the split
 * math (`splits.ts`) with the transport client (`client.ts`).
 */
import type { SplitwiseClient } from './client.js';
import { assertSharesBalance, buildUserShares } from './splits.js';
import type {
  ExpenseUserShare,
  SharedExpenseInput,
  SplitwiseExpense,
} from './types.js';

const DEFAULT_CURRENCY = 'USD';

/** The fully-resolved expense, ready to inspect or post. */
export interface PreparedExpense {
  description: string;
  cost: string;
  currencyCode: string;
  groupId: number;
  details?: string;
  date?: string;
  categoryId?: number;
  users: ExpenseUserShare[];
}

/**
 * Validate a split and compute the exact per-user shares WITHOUT calling
 * Splitwise. Handy for a dry-run / preview before posting.
 */
export function prepareSharedExpense(
  input: SharedExpenseInput,
): PreparedExpense {
  const users = buildUserShares(input.split, input.cost);
  assertSharesBalance(users, input.cost);

  return {
    description: input.description,
    cost: input.cost.toFixed(2),
    currencyCode: input.currencyCode ?? DEFAULT_CURRENCY,
    groupId: input.groupId ?? 0,
    details: input.details,
    date: input.date,
    categoryId: input.categoryId,
    users,
  };
}

/**
 * Prepare and post a shared expense to Splitwise.
 *
 * - Pass `groupId` to post to a group, or omit it (defaults to `0`) to create an
 *   individual expense shared directly between friends.
 * - The split may be `equal`, `percentage`, or `exact`; shares are validated to
 *   reconcile to the total before anything is sent.
 */
export async function createSharedExpense(
  client: SplitwiseClient,
  input: SharedExpenseInput,
): Promise<SplitwiseExpense> {
  const prepared = prepareSharedExpense(input);
  return client.createExpense(prepared);
}
