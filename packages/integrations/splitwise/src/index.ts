/**
 * Public surface of the `@mobills/integration-splitwise` capability package.
 */
export { SplitwiseClient, SplitwiseApiError } from './client.js';
export type {
  CreateExpenseParams,
  SplitwiseClientOptions,
} from './client.js';

export {
  configFromEnv,
  DEFAULT_SPLITWISE_BASE_URL,
  type SplitwiseConfig,
} from './config.js';

export {
  createSharedExpense,
  prepareSharedExpense,
  type PreparedExpense,
} from './expenses.js';

export { buildUserShares, assertSharesBalance } from './splits.js';

export {
  toCents,
  centsToString,
  allocateByWeights,
} from './money.js';

export type {
  Participant,
  PercentageParticipant,
  ExactParticipant,
  EqualSplit,
  PercentageSplit,
  ExactSplit,
  Split,
  ExpenseUserShare,
  SharedExpenseInput,
  SplitwiseExpense,
  SplitwiseUser,
} from './types.js';
