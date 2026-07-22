import { describe, expect, it } from 'vitest';
import { divideBill } from './divide';
import { toCents } from './money';
import type { BillMemberInput } from './types';

/**
 * Reproduces the group's historical "Dec-Jan'25" spreadsheet:
 *  - base pool $310 split equally across 9 lines
 *  - Bhavesh: +$12.50 equipment, +$24.04 extra
 *  - Amba:    +$0.25 extra
 *  - Anjali:  +$41.67 equipment
 *  - Habiba:  +$4.25 extra
 *  - bill total: $392.71
 */
function decJanMembers(): BillMemberInput[] {
  const names = [
    'Vishrut',
    'Ojasvi',
    'Akash',
    'Aviral',
    'Bhavesh',
    'Amba',
    'Diksha',
    'Anjali',
    'Habiba',
  ];
  const base = names.map((name, i) => ({ memberId: `m${i}`, name }));
  const byName = (n: string) => base.find((m) => m.name === n)!;
  Object.assign(byName('Bhavesh'), {
    contractPlanEquipmentCents: toCents(12.5),
    extraCents: toCents(24.04),
  });
  Object.assign(byName('Amba'), { extraCents: toCents(0.25) });
  Object.assign(byName('Anjali'), {
    contractPlanEquipmentCents: toCents(41.67),
  });
  Object.assign(byName('Habiba'), { extraCents: toCents(4.25) });
  return base;
}

describe('divideBill', () => {
  it('reproduces the Dec-Jan spreadsheet totals', () => {
    const division = divideBill({
      basePoolCents: toCents(310),
      members: decJanMembers(),
    });

    expect(division.totalCents).toBe(toCents(392.71));
    expect(division.memberCount).toBe(9);

    const total = (name: string) =>
      division.members.find((m) => m.name === name)!.totalCents;
    // Base share is 3444 or 3445 cents; the plain members owe just the share.
    const plain = division.members.filter((m) =>
      ['Ojasvi', 'Akash', 'Aviral', 'Diksha'].includes(m.name),
    );
    for (const m of plain) {
      expect([3444, 3445]).toContain(m.totalCents);
    }
    // Members with extras owe base share + their own items.
    const share = (name: string) =>
      division.members.find((m) => m.name === name)!.baseShareCents;
    expect(total('Bhavesh')).toBe(share('Bhavesh') + toCents(12.5) + toCents(24.04));
    expect(total('Amba')).toBe(share('Amba') + toCents(0.25));
    expect(total('Anjali')).toBe(share('Anjali') + toCents(41.67));
    expect(total('Habiba')).toBe(share('Habiba') + toCents(4.25));
  });

  it('base shares reconcile exactly to the base pool', () => {
    const division = divideBill({
      basePoolCents: toCents(310),
      members: decJanMembers(),
    });
    const baseSum = division.members.reduce(
      (sum, m) => sum + m.baseShareCents,
      0,
    );
    expect(baseSum).toBe(toCents(310));
  });

  it('member totals sum to the bill total', () => {
    const division = divideBill({
      basePoolCents: toCents(310),
      members: decJanMembers(),
    });
    const sum = division.members.reduce((s, m) => s + m.totalCents, 0);
    expect(sum).toBe(division.totalCents);
  });

  it('bill value basis points sum to 100%', () => {
    const division = divideBill({
      basePoolCents: toCents(310),
      members: decJanMembers(),
    });
    const bps = division.members.reduce((s, m) => s + m.billValueBps, 0);
    expect(bps).toBe(10000);
  });

  it('defaults currency to USD', () => {
    const division = divideBill({
      basePoolCents: toCents(90),
      members: [
        { memberId: 'a', name: 'A' },
        { memberId: 'b', name: 'B' },
        { memberId: 'c', name: 'C' },
      ],
    });
    expect(division.currencyCode).toBe('USD');
    expect(division.members.map((m) => m.baseShareCents)).toEqual([
      3000, 3000, 3000,
    ]);
  });

  it('rejects an empty member list', () => {
    expect(() => divideBill({ basePoolCents: 100, members: [] })).toThrow(
      /at least one member/,
    );
  });

  it('rejects duplicate members', () => {
    expect(() =>
      divideBill({
        basePoolCents: 100,
        members: [
          { memberId: 'dup', name: 'A' },
          { memberId: 'dup', name: 'B' },
        ],
      }),
    ).toThrow(/Duplicate member/);
  });

  it('rejects non-integer cents', () => {
    expect(() =>
      divideBill({
        basePoolCents: 100.5,
        members: [{ memberId: 'a', name: 'A' }],
      }),
    ).toThrow(/integer number of cents/);
  });

  it('rejects negative individual charges', () => {
    expect(() =>
      divideBill({
        basePoolCents: 100,
        members: [{ memberId: 'a', name: 'A', extraCents: -5 }],
      }),
    ).toThrow(/non-negative/);
  });

  it('rejects a zero-total bill', () => {
    expect(() =>
      divideBill({
        basePoolCents: 0,
        members: [{ memberId: 'a', name: 'A' }],
      }),
    ).toThrow(/more than zero/);
  });
});
