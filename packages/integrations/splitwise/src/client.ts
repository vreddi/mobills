/**
 * Thin HTTP wrapper around the Splitwise REST API (v3.0).
 *
 * Only the endpoints the mobills workflow needs are implemented:
 *  - `get_current_user` — connectivity / identity check.
 *  - `create_expense`   — post an individual or group expense.
 *
 * The client is transport-only: split math and validation live in `splits.ts`.
 */
import { DEFAULT_SPLITWISE_BASE_URL, type SplitwiseConfig } from './config.js';
import type {
  ExpenseUserShare,
  SplitwiseExpense,
  SplitwiseUser,
} from './types.js';

/** Low-level parameters accepted by the Splitwise `create_expense` endpoint. */
export interface CreateExpenseParams {
  cost: string;
  description: string;
  currencyCode: string;
  groupId: number;
  details?: string;
  date?: string;
  categoryId?: number;
  users: ExpenseUserShare[];
}

/** Raised when Splitwise returns a payload containing errors. */
export class SplitwiseApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errors: unknown,
  ) {
    super(message);
    this.name = 'SplitwiseApiError';
  }
}

export interface SplitwiseClientOptions {
  apiKey: string;
  baseUrl?: string;
  /** Injectable fetch, primarily for testing. Defaults to global `fetch`. */
  fetch?: typeof fetch;
}

export class SplitwiseClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: SplitwiseClientOptions) {
    if (!options.apiKey) {
      throw new Error('SplitwiseClient requires an apiKey');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_SPLITWISE_BASE_URL).replace(
      /\/$/,
      '',
    );
    const fetchImpl = options.fetch ?? globalThis.fetch;
    if (typeof fetchImpl !== 'function') {
      throw new Error(
        'No fetch implementation available; pass one via options.fetch',
      );
    }
    this.fetchImpl = fetchImpl;
  }

  /** Build a client from validated environment config. */
  static fromConfig(config: SplitwiseConfig): SplitwiseClient {
    return new SplitwiseClient({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
    });
  }

  /** Returns the authenticated Splitwise user — a cheap credential check. */
  async getCurrentUser(): Promise<SplitwiseUser> {
    const data = await this.request<{ user: SplitwiseUser }>(
      'GET',
      'get_current_user',
    );
    return data.user;
  }

  /**
   * Create an expense. Pass `groupId: 0` for an individual (non-group) expense
   * shared directly between friends, or a real group id to post to a group.
   */
  async createExpense(params: CreateExpenseParams): Promise<SplitwiseExpense> {
    const body = new URLSearchParams();
    body.set('cost', params.cost);
    body.set('description', params.description);
    body.set('currency_code', params.currencyCode);
    body.set('group_id', String(params.groupId));
    if (params.details !== undefined) {
      body.set('details', params.details);
    }
    if (params.date !== undefined) {
      body.set('date', params.date);
    }
    if (params.categoryId !== undefined) {
      body.set('category_id', String(params.categoryId));
    }

    params.users.forEach((user, index) => {
      const prefix = `users__${index}__`;
      if (user.userId !== undefined) {
        body.set(`${prefix}user_id`, String(user.userId));
      }
      if (user.email !== undefined) {
        body.set(`${prefix}email`, user.email);
      }
      if (user.firstName !== undefined) {
        body.set(`${prefix}first_name`, user.firstName);
      }
      if (user.lastName !== undefined) {
        body.set(`${prefix}last_name`, user.lastName);
      }
      body.set(`${prefix}paid_share`, user.paidShare);
      body.set(`${prefix}owed_share`, user.owedShare);
    });

    const data = await this.request<{
      expenses: SplitwiseExpense[];
      errors?: Record<string, string[]>;
    }>('POST', 'create_expense', body);

    // Splitwise returns HTTP 200 with an `errors` object on validation failure.
    if (data.errors && Object.keys(data.errors).length > 0) {
      throw new SplitwiseApiError(
        formatErrors(data.errors),
        200,
        data.errors,
      );
    }
    const [expense] = data.expenses ?? [];
    if (!expense) {
      throw new SplitwiseApiError(
        'Splitwise did not return a created expense',
        200,
        data,
      );
    }
    return expense;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: URLSearchParams,
  ): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
        ...(body
          ? { 'Content-Type': 'application/x-www-form-urlencoded' }
          : {}),
      },
      body,
    });

    const text = await response.text();
    let payload: unknown;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      throw new SplitwiseApiError(
        `Splitwise returned non-JSON response (HTTP ${response.status}): ${text.slice(0, 200)}`,
        response.status,
        text,
      );
    }

    if (!response.ok) {
      const errors =
        (payload as { errors?: unknown }).errors ?? payload;
      throw new SplitwiseApiError(
        `Splitwise request to ${path} failed: ${formatErrors(errors)}`,
        response.status,
        errors,
      );
    }

    return payload as T;
  }
}

function formatErrors(errors: unknown): string {
  if (!errors) {
    return 'unknown error';
  }
  if (typeof errors === 'string') {
    return errors;
  }
  if (Array.isArray(errors)) {
    return errors.join('; ');
  }
  if (typeof errors === 'object') {
    return Object.entries(errors as Record<string, unknown>)
      .map(([key, value]) => {
        const detail = Array.isArray(value) ? value.join(', ') : String(value);
        return key === 'base' ? detail : `${key}: ${detail}`;
      })
      .join('; ');
  }
  return String(errors);
}
