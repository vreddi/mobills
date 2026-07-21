import { describe, expect, it } from 'vitest';
import {
  allocateByWeights,
  centsToString,
  toCents,
} from './money';

describe('toCents', () => {
  it('rounds dollars to integer cents', () => {
    expect(toCents(12.34)).toBe(1234);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(70.985)).toBe(7099);
  });

  it('throws on non-finite input', () => {
    expect(() => toCents(Number.NaN)).toThrow(/finite/);
    expect(() => toCents(Number.POSITIVE_INFINITY)).toThrow(/finite/);
  });
});

describe('centsToString', () => {
  it('formats cents with two decimals', () => {
    expect(centsToString(1234)).toBe('12.34');
    expect(centsToString(5)).toBe('0.05');
    expect(centsToString(0)).toBe('0.00');
    expect(centsToString(-125)).toBe('-1.25');
  });
});

describe('allocateByWeights', () => {
  it('splits evenly when it divides cleanly', () => {
    expect(allocateByWeights(900, [1, 1, 1])).toEqual([300, 300, 300]);
  });

  it('hands leftover cents to the largest remainders and sums exactly', () => {
    // 31000 cents ($310) across 9 equal members = 3444.44.. each.
    const parts = allocateByWeights(31000, new Array(9).fill(1));
    expect(parts.reduce((a, b) => a + b, 0)).toBe(31000);
    // Each member is either 3444 or 3445 cents.
    for (const part of parts) {
      expect([3444, 3445]).toContain(part);
    }
    // 31000 = 3444*9 + 4, so exactly 4 members get the extra cent.
    expect(parts.filter((p) => p === 3445)).toHaveLength(4);
  });

  it('respects weights', () => {
    expect(allocateByWeights(1000, [1, 3])).toEqual([250, 750]);
  });

  it('throws on empty or non-positive weights', () => {
    expect(() => allocateByWeights(100, [])).toThrow(/zero participants/);
    expect(() => allocateByWeights(100, [0, 0])).toThrow(/greater than zero/);
    expect(() => allocateByWeights(100, [-1, 2])).toThrow(/non-negative/);
  });
});

describe('safe integer cent inputs', () => {
  it('rejects unsafe or fractional cents', () => {
    expect(() => centsToString(1.5)).toThrow(/safe integer/);
    expect(() => centsToString(-1.5)).toThrow(/safe integer/);
    expect(() => allocateByWeights(1.5, [1, 1])).toThrow(/safe integer/);
    expect(() => toCents(Number.MAX_VALUE)).toThrow(/safe integer/);
  });
});
