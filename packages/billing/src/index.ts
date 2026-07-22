/**
 * Public surface of the `@mobills/billing` package: the bill division model and
 * the money helpers used to compute it.
 */
export { divideBill } from './divide.js';

export { toCents, centsToString, allocateByWeights } from './money.js';

export type {
  ChargeCategory,
  BillMemberInput,
  BillInput,
  BillMemberCharge,
  BillDivision,
} from './types.js';
