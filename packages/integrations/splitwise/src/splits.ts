/**
 * Split strategies. Each turns a total cost and a set of participants into the
 * per-user `paidShare` / `owedShare` lines Splitwise expects, guaranteeing that
 * both columns sum exactly to the total cost.
 */
import { allocateByWeights, centsToString, toCents } from './money.js';
import type {
  ExpenseUserShare,
  Participant,
  Split,
} from './types.js';

/** Small tolerance (in cents) when validating user-supplied sums. */
const CENT_TOLERANCE = 0;

function identityFields(participant: Participant): Omit<
  ExpenseUserShare,
  'paidShare' | 'owedShare'
> {
  if (participant.userId === undefined && !participant.email) {
    throw new Error(
      'Each participant needs a userId or an email so Splitwise can identify them',
    );
  }
  return {
    userId: participant.userId,
    email: participant.email,
    firstName: participant.firstName,
    lastName: participant.lastName,
  };
}

function resolvePayerIndex(
  participants: Participant[],
  payerUserId: number | undefined,
): number {
  if (payerUserId === undefined) {
    return 0;
  }
  const index = participants.findIndex((p) => p.userId === payerUserId);
  if (index === -1) {
    throw new Error(
      `Payer userId ${payerUserId} is not one of the participants`,
    );
  }
  return index;
}

/**
 * Build the per-user shares for an expense. `owedCents` is the already-allocated
 * amount each participant owes; the payer is credited with paying the full cost.
 */
function buildShares(
  participants: Participant[],
  owedCents: number[],
  payerIndex: number,
  totalCents: number,
): ExpenseUserShare[] {
  return participants.map((participant, index) => ({
    ...identityFields(participant),
    paidShare: centsToString(index === payerIndex ? totalCents : 0),
    owedShare: centsToString(owedCents[index]),
  }));
}

/**
 * Turn a {@link Split} plus total cost into validated Splitwise user shares.
 * Throws if percentages/amounts don't reconcile to the total.
 */
export function buildUserShares(
  split: Split,
  cost: number,
): ExpenseUserShare[] {
  const totalCents = toCents(cost);
  if (totalCents <= 0) {
    throw new Error('Expense cost must be greater than zero');
  }
  if (split.participants.length === 0) {
    throw new Error('An expense needs at least one participant');
  }

  const participants: Participant[] = split.participants;
  const payerIndex = resolvePayerIndex(participants, split.payerUserId);

  switch (split.kind) {
    case 'equal': {
      const owed = allocateByWeights(
        totalCents,
        participants.map(() => 1),
      );
      return buildShares(participants, owed, payerIndex, totalCents);
    }

    case 'percentage': {
      const percents = split.participants.map((p) => p.percent);
      if (percents.some((pct) => pct < 0)) {
        throw new Error('Percentages must be non-negative');
      }
      const percentSum = percents.reduce((sum, pct) => sum + pct, 0);
      if (Math.abs(percentSum - 100) > 1e-9) {
        throw new Error(
          `Percentages must sum to 100, got ${percentSum}`,
        );
      }
      const owed = allocateByWeights(totalCents, percents);
      return buildShares(participants, owed, payerIndex, totalCents);
    }

    case 'exact': {
      const owedCents = split.participants.map((p) => toCents(p.amount));
      if (owedCents.some((c) => c < 0)) {
        throw new Error('Exact amounts must be non-negative');
      }
      const owedSum = owedCents.reduce((sum, c) => sum + c, 0);
      if (Math.abs(owedSum - totalCents) > CENT_TOLERANCE) {
        throw new Error(
          `Exact amounts must sum to the total cost (${centsToString(
            totalCents,
          )}), got ${centsToString(owedSum)}`,
        );
      }
      return buildShares(participants, owedCents, payerIndex, totalCents);
    }

    default: {
      const exhaustive: never = split;
      throw new Error(
        `Unsupported split kind: ${(exhaustive as { kind: string }).kind}`,
      );
    }
  }
}

/**
 * Assert that the paid and owed columns each reconcile to `cost`. Useful as a
 * final guard before posting, and handy in tests.
 */
export function assertSharesBalance(
  shares: ExpenseUserShare[],
  cost: number,
): void {
  const totalCents = toCents(cost);
  const paidCents = shares.reduce((sum, s) => sum + toCents(Number(s.paidShare)), 0);
  const owedCents = shares.reduce((sum, s) => sum + toCents(Number(s.owedShare)), 0);
  if (paidCents !== totalCents) {
    throw new Error(
      `Paid shares (${centsToString(paidCents)}) do not sum to cost (${centsToString(totalCents)})`,
    );
  }
  if (owedCents !== totalCents) {
    throw new Error(
      `Owed shares (${centsToString(owedCents)}) do not sum to cost (${centsToString(totalCents)})`,
    );
  }
}
