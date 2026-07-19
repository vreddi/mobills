/**
 * Public types for the Splitwise capability.
 *
 * These describe how a mobills operator wants to split a bill and the shape of
 * the data we send to / receive from the Splitwise REST API.
 */

/** A person taking part in an expense. */
export interface Participant {
  /**
   * Splitwise user id. Optional so an expense can include someone who is not
   * yet a Splitwise friend — in that case provide `email` (and optionally a
   * name) and Splitwise will invite them.
   */
  userId?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
}

/** A participant who owes a percentage of the total. */
export interface PercentageParticipant extends Participant {
  /** Percent of the total this person owes, e.g. `25` for 25%. */
  percent: number;
}

/** A participant who owes an exact amount of the total. */
export interface ExactParticipant extends Participant {
  /** Exact amount this person owes, in major currency units (e.g. dollars). */
  amount: number;
}

/**
 * Split the full cost equally between the listed participants. The optional
 * `payerUserId` marks who fronted the money (defaults to the first participant).
 */
export interface EqualSplit {
  kind: 'equal';
  payerUserId?: number;
  participants: Participant[];
}

/** Split the full cost by percentage. Percentages must sum to 100. */
export interface PercentageSplit {
  kind: 'percentage';
  payerUserId?: number;
  participants: PercentageParticipant[];
}

/** Split the full cost by exact per-person amounts. Amounts must sum to cost. */
export interface ExactSplit {
  kind: 'exact';
  payerUserId?: number;
  participants: ExactParticipant[];
}

export type Split = EqualSplit | PercentageSplit | ExactSplit;

/**
 * A single Splitwise expense line for one user. Amounts are formatted decimal
 * strings (e.g. `"12.34"`) as required by the Splitwise API.
 */
export interface ExpenseUserShare {
  userId?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  /** How much this user paid up front. */
  paidShare: string;
  /** How much this user owes. */
  owedShare: string;
}

/** Everything needed to create one shared expense. */
export interface SharedExpenseInput {
  /** Human-readable description, e.g. `"T-Mobile — March 2026"`. */
  description: string;
  /** Total cost in major currency units (e.g. dollars). */
  cost: number;
  /** ISO 4217 currency code. Defaults to `USD`. */
  currencyCode?: string;
  /**
   * Splitwise group id. Omit or pass `0` to post an individual (non-group)
   * expense shared directly between friends.
   */
  groupId?: number;
  /** Optional free-form notes stored on the expense. */
  details?: string;
  /** Optional ISO-8601 date the expense occurred. Defaults to now. */
  date?: string;
  /** Optional Splitwise category id. */
  categoryId?: number;
  /** How the cost is divided across participants. */
  split: Split;
}

/** Minimal shape of a Splitwise expense object returned by the API. */
export interface SplitwiseExpense {
  id: number;
  description: string;
  cost: string;
  currency_code: string;
  group_id: number | null;
  date: string;
  [key: string]: unknown;
}

/** Minimal shape of the Splitwise current-user object. */
export interface SplitwiseUser {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string;
  [key: string]: unknown;
}
