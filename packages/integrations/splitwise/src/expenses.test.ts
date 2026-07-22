import { describe, expect, it } from 'vitest';
import { prepareSharedExpense } from './expenses';
import { centsToString, toCents } from './money';
import type { ExactParticipant } from './types';

/**
 * These lock the money invariants that `mobills bill post` relies on: when a
 * bill is posted to Splitwise, the expense total must equal the bill total, and
 * the operator (the payer) must be reimbursed for exactly what everyone else
 * owes — no more, no less.
 *
 * `mobills bill post` builds an `exact` split where each participant owes their
 * bill total in dollars and the operator is the payer, which is what we model
 * here.
 */
function postBillExpense(
  memberTotalsCents: number[],
  payerIndex: number,
) {
  const participants: ExactParticipant[] = memberTotalsCents.map((cents, index) => ({
    userId: 1000 + index,
    amount: cents / 100,
  }));
  const totalCents = memberTotalsCents.reduce((sum, c) => sum + c, 0);
  return prepareSharedExpense({
    description: 'Jul 2026 0',
    cost: totalCents / 100,
    split: {
      kind: 'exact',
      payerUserId: participants[payerIndex].userId,
      participants,
    },
  });
}

function sumShares(values: string[]): number {
  return values.reduce((sum, v) => sum + toCents(Number(v)), 0);
}

describe('posting a bill to Splitwise', () => {
  // The Jul 2026 T-Mobile bill: $260 plan split across 6 lines + a $2.43
  // one-time charge on one line → $262.43 total.
  const billTotals = [4334, 4334, 4333, 4333, 4333 + 243, 4333];
  const grandTotal = billTotals.reduce((a, b) => a + b, 0); // 26243

  it('posts an expense whose total equals the bill total', () => {
    const prepared = postBillExpense(billTotals, 0);
    expect(prepared.cost).toBe(centsToString(grandTotal)); // "262.43"
  });

  it('reimburses the owner for exactly what everyone else owes', () => {
    const payerIndex = 0;
    const prepared = postBillExpense(billTotals, payerIndex);

    const payer = prepared.users[payerIndex];
    // The payer fronts the whole bill...
    expect(payer.paidShare).toBe(centsToString(grandTotal));
    // ...and owes only their own share.
    expect(payer.owedShare).toBe(centsToString(billTotals[payerIndex]));

    // The money coming back to the owner is the sum of everyone else's owed
    // shares, which is the bill total minus the owner's own share.
    const owedToOwner = grandTotal - billTotals[payerIndex];
    const othersOwe = prepared.users
      .filter((_, i) => i !== payerIndex)
      .reduce((sum, u) => sum + toCents(Number(u.owedShare)), 0);
    expect(othersOwe).toBe(owedToOwner);
  });

  it('keeps paid and owed columns reconciled to the total', () => {
    const prepared = postBillExpense(billTotals, 2);
    expect(sumShares(prepared.users.map((u) => u.paidShare))).toBe(grandTotal);
    expect(sumShares(prepared.users.map((u) => u.owedShare))).toBe(grandTotal);
  });

  it('gives every non-payer a zero paid share (owner fronts it all)', () => {
    const payerIndex = 4;
    const prepared = postBillExpense(billTotals, payerIndex);
    prepared.users.forEach((user, i) => {
      expect(user.paidShare).toBe(
        i === payerIndex ? centsToString(grandTotal) : '0.00',
      );
      expect(user.owedShare).toBe(centsToString(billTotals[i]));
    });
  });
});
