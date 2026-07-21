/**
 * Bill division: turn a {@link BillInput} into an exact, per-member breakdown.
 *
 * Rules:
 *  - The base pool ("Base + Base Tax") is split EQUALLY across every member,
 *    with leftover cents distributed by the largest-remainder method so the
 *    shares reconcile exactly to the pool.
 *  - Each member additionally owes their own individual line items
 *    (individual tax, contract/plan/equipment, extra usage).
 *  - The bill total is the sum of every member's total, which always equals
 *    `basePoolCents + sum(all individual line items)`.
 */
import { allocateByWeights } from './money.js';
import type { BillDivision, BillInput, BillMemberCharge } from './types.js';

const DEFAULT_CURRENCY = 'USD';

function requireNonNegativeInteger(value: number, label: string): number {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer number of cents, got ${value}`);
  }
  if (value < 0) {
    throw new Error(`${label} must be non-negative, got ${value}`);
  }
  return value;
}

/**
 * Divide a bill across its members. Throws if the input is malformed (no
 * members, non-integer/negative cents, or a zero total).
 */
export function divideBill(input: BillInput): BillDivision {
  const { members } = input;
  if (members.length === 0) {
    throw new Error('A bill needs at least one member');
  }

  const seen = new Set<string>();
  for (const member of members) {
    if (seen.has(member.memberId)) {
      throw new Error(`Duplicate member in bill: ${member.memberId}`);
    }
    seen.add(member.memberId);
  }

  const basePoolCents = requireNonNegativeInteger(
    input.basePoolCents,
    'basePoolCents',
  );

  const baseShares = allocateByWeights(
    basePoolCents,
    members.map(() => 1),
  );

  const charges: BillMemberCharge[] = members.map((member, index) => {
    const individualTaxCents = requireNonNegativeInteger(
      member.individualTaxCents ?? 0,
      `individualTaxCents for ${member.name}`,
    );
    const contractPlanEquipmentCents = requireNonNegativeInteger(
      member.contractPlanEquipmentCents ?? 0,
      `contractPlanEquipmentCents for ${member.name}`,
    );
    const extraCents = requireNonNegativeInteger(
      member.extraCents ?? 0,
      `extraCents for ${member.name}`,
    );
    const baseShareCents = baseShares[index];
    const totalCents =
      baseShareCents +
      individualTaxCents +
      contractPlanEquipmentCents +
      extraCents;

    return {
      memberId: member.memberId,
      name: member.name,
      baseShareCents,
      individualTaxCents,
      contractPlanEquipmentCents,
      extraCents,
      totalCents,
      // Filled in below once the grand total is known.
      billValueBps: 0,
    };
  });

  const totalCents = charges.reduce((sum, c) => sum + c.totalCents, 0);
  if (totalCents <= 0) {
    throw new Error('A bill must total more than zero');
  }

  for (const charge of charges) {
    charge.billValueBps = Math.round((charge.totalCents * 10000) / totalCents);
  }

  return {
    currencyCode: input.currencyCode ?? DEFAULT_CURRENCY,
    basePoolCents,
    totalCents,
    memberCount: members.length,
    members: charges,
  };
}
