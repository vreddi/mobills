/**
 * Money helpers for bill division. All arithmetic runs in integer minor units
 * (cents) so the per-member shares reconcile EXACTLY to the bill total without
 * binary floating-point drift.
 *
 * These intentionally mirror the helpers in `@mobills/integration-splitwise` so
 * the billing package stays decoupled from any particular payout integration.
 */

/** Convert a major-unit amount (e.g. dollars) to integer cents. */
export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new Error(`Amount must be a finite number, got ${amount}`);
  }
  return requireSafeIntegerCents(Math.round(amount * 100), 'Amount');
}

function requireSafeIntegerCents(value: number, label: string): number {
  if (!Number.isSafeInteger(value)) {
    throw new Error(
      `${label} must be a safe integer number of cents, got ${value}`,
    );
  }
  return value;
}

/** Format integer cents as a fixed 2-decimal string (e.g. 1234 -> "12.34"). */
export function centsToString(cents: number): string {
  const value = requireSafeIntegerCents(cents, 'cents');
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  return `${sign}${whole}.${frac.toString().padStart(2, '0')}`;
}

/**
 * Split `totalCents` across the given non-negative `weights` so the
 * parts sum EXACTLY to `totalCents`. Uses the largest-remainder method: the
 * leftover cents go to the entries with the biggest fractional part, keeping the
 * shares as fair as possible.
 */
export function allocateByWeights(
  totalCents: number,
  weights: number[],
): number[] {
  const total = requireSafeIntegerCents(totalCents, 'totalCents');

  if (weights.length === 0) {
    throw new Error('Cannot allocate across zero participants');
  }
  if (weights.some((w) => w < 0 || !Number.isFinite(w))) {
    throw new Error('Weights must be non-negative finite numbers');
  }

  const weightTotal = weights.reduce((sum, w) => sum + w, 0);
  if (weightTotal <= 0) {
    throw new Error('Sum of weights must be greater than zero');
  }

  const exact = weights.map((w) => (total * w) / weightTotal);
  const floors = exact.map((value) => Math.floor(value));
  let remainder = total - floors.reduce((sum, value) => sum + value, 0);

  const order = exact
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floors];
  for (let i = 0; i < order.length && remainder > 0; i += 1) {
    result[order[i].index] += 1;
    remainder -= 1;
  }
  return result;
}
