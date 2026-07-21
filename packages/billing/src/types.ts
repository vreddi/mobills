/**
 * Types describing how a mobills bill is divided across the members of a
 * tracking account.
 *
 * The model mirrors the columns the group historically tracked in a
 * spreadsheet:
 *
 *   Base + Base Tax | Indi-Tax | Contract/Plan/Equipment | Extra | Total
 *
 * The "Base + Base Tax" pool is the shared plan cost (plus the taxes that apply
 * to everyone) and is split EQUALLY across every participating member. The other
 * three categories are individual line items charged only to the member they
 * belong to.
 */

/** The four labelled charge categories that make up a member's total. */
export type ChargeCategory =
  | 'baseShare'
  | 'individualTax'
  | 'contractPlanEquipment'
  | 'extra';

/**
 * One member's individual (non-shared) charges for a bill, in integer cents.
 * Every field is optional and defaults to 0 — a member with no individual
 * charges still receives an equal share of the base pool.
 */
export interface BillMemberInput {
  /** Opaque member identifier (e.g. a Convex member id). */
  memberId: string;
  /** Display name, snapshotted onto the bill for historical breakdowns. */
  name: string;
  /** Tax tied to this specific line (Indi-Tax). */
  individualTaxCents?: number;
  /** Device installment / plan / equipment charge for this line. */
  contractPlanEquipmentCents?: number;
  /** Extra usage or one-time charges for this line. */
  extraCents?: number;
}

/** Everything needed to divide a single bill. */
export interface BillInput {
  /**
   * The shared "Base + Base Tax" pool, in integer cents. Split equally across
   * every member in {@link BillInput.members}.
   */
  basePoolCents: number;
  /** ISO 4217 currency code. Defaults to `USD`. */
  currencyCode?: string;
  /** The members participating in this bill. Must be non-empty. */
  members: BillMemberInput[];
}

/** The fully-resolved charge breakdown for one member, in integer cents. */
export interface BillMemberCharge {
  memberId: string;
  name: string;
  /** This member's equal share of the base pool. */
  baseShareCents: number;
  individualTaxCents: number;
  contractPlanEquipmentCents: number;
  extraCents: number;
  /** Sum of the four categories above — what this member owes. */
  totalCents: number;
  /**
   * This member's share of the whole bill, in basis points (0–10000). Divide by
   * 100 for a percentage. Rounded for display only; not used for money math.
   */
  billValueBps: number;
}

/** The complete, validated division of a bill. */
export interface BillDivision {
  currencyCode: string;
  basePoolCents: number;
  /** Sum of every member's total — the whole bill. */
  totalCents: number;
  memberCount: number;
  members: BillMemberCharge[];
}
