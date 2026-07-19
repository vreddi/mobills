/**
 * Money helpers. All arithmetic is done in integer minor units (cents) to avoid
 * binary floating-point rounding errors, then formatted back to fixed 2-decimal
 * strings for the Splitwise API.
 */

/** Convert a major-unit amount (e.g. dollars) to integer cents. */
export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new Error(`Amount must be a finite number, got ${amount}`);
  }
  return Math.round(amount * 100);
}

/** Format integer cents as a fixed 2-decimal string (e.g. 1234 -> "12.34"). */
export function centsToString(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  return `${sign}${whole}.${frac.toString().padStart(2, '0')}`;
}

/**
 * Split `totalCents` across the given non-negative integer `weights` so the
 * parts sum exactly to `totalCents`. Uses the largest-remainder method so the
 * leftover cents are handed to the entries with the biggest fractional part —
 * this keeps individual shares as fair as possible.
 */
export function allocateByWeights(
  totalCents: number,
  weights: number[],
): number[] {
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

  const exact = weights.map((w) => (totalCents * w) / weightTotal);
  const floors = exact.map((value) => Math.floor(value));
  let remainder = totalCents - floors.reduce((sum, value) => sum + value, 0);

  // Distribute the leftover cents to the largest fractional remainders.
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
