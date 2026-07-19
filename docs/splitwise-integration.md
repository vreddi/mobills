# Splitwise integration

mobills mirrors a shared T-Mobile bill and, each month, records who owes what.
Today that reconciliation lives in [Splitwise](https://www.splitwise.com). This
document describes how mobills integrates with Splitwise to create expenses and
split them across the group.

The integration lives in the **`@mobills/splitwise`** package
(`packages/integrations/splitwise/`). It is a standalone, reusable capability: it is **not yet
wired into the `mobills` CLI** (`tools/cli`). It can be invoked directly today via
a small runner (see [Invoking it](#invoking-it-today)) and imported by other
packages later.

## What it can do

- **Create an expense on Splitwise** — a single charge (e.g. `"T-Mobile — March 2026"`).
- **Post individually or in a group:**
  - _Individual_ — omit the group (Splitwise `group_id = 0`); the expense is
    shared directly between friends.
  - _Group_ — pass a Splitwise `group_id` to post into an existing group.
- **Assign each person a share of the full amount using one of three strategies:**
  - `percentage` — each participant owes a percent of the total (must sum to 100).
  - `equal` — the total is divided evenly.
  - `exact` — each participant owes a fixed amount (must sum to the total).

All amounts are computed in integer cents and reconciled with a largest-remainder
allocation, so the per-person shares always add up **exactly** to the total —
Splitwise rejects expenses whose shares don't balance.

## How it works

```
SharedExpenseInput ──▶ buildUserShares() ──▶ per-user paid/owed shares
   (split + cost)          (splits.ts)        (validated to sum to cost)
                                   │
                                   ▼
                        createSharedExpense()
                            (expenses.ts)
                                   │
                                   ▼
                 SplitwiseClient.createExpense()
                            (client.ts)
                                   │
                                   ▼
              POST /api/v3.0/create_expense  (Splitwise)
```

### Modules

| File          | Responsibility                                                                 |
| ------------- | ------------------------------------------------------------------------------ |
| `types.ts`    | Public types: participants, split strategies, expense input/result.            |
| `money.ts`    | Integer-cent math + largest-remainder allocation (`allocateByWeights`).        |
| `splits.ts`   | Turn a split + cost into validated per-user paid/owed shares.                  |
| `client.ts`   | `SplitwiseClient` — transport-only wrapper over the Splitwise REST API.        |
| `expenses.ts` | `prepareSharedExpense` / `createSharedExpense` — the high-level capability.    |
| `config.ts`   | `configFromEnv()` — read/validate `SPLITWISE_API_KEY`.                         |
| `run.ts`      | Standalone runner for invoking the capability from a terminal.                 |

### Authentication

Authentication uses a **Splitwise personal API key** (a Bearer token). Create one
under _Your apps_ at <https://secure.splitwise.com/apps> and set it in `.env`:

```
SPLITWISE_API_KEY=your-personal-api-key
# optional override; defaults to https://secure.splitwise.com/api/v3.0
SPLITWISE_API_BASE_URL=
```

A personal API key is the simplest option for an operator-run tool. OAuth can be
layered on later without changing the capability surface.

### Splitwise API

The client calls two Splitwise v3.0 endpoints:

- `GET get_current_user` — a cheap credentials/connectivity check.
- `POST create_expense` — creates the expense. Per-user lines are sent as
  `users__{i}__user_id`, `users__{i}__paid_share`, and `users__{i}__owed_share`
  (with `users__{i}__email` / `first_name` for people who aren't friends yet).

Splitwise returns HTTP 200 with an `errors` object on validation failure, so the
client inspects the payload and raises `SplitwiseApiError` with a readable message.

## Using it from code

```ts
import { SplitwiseClient, configFromEnv, createSharedExpense } from '@mobills/splitwise';

const client = SplitwiseClient.fromConfig(configFromEnv());

// Group expense split by percentage.
await createSharedExpense(client, {
  description: 'T-Mobile — March 2026',
  cost: 180,
  currencyCode: 'USD',
  groupId: 12345,
  split: {
    kind: 'percentage',
    payerUserId: 111, // who fronted the money
    participants: [
      { userId: 111, percent: 40 },
      { userId: 222, percent: 30 },
      { userId: 333, percent: 30 },
    ],
  },
});
```

Preview the computed shares without posting using `prepareSharedExpense(input)`.

## Invoking it today

The capability ships with a standalone runner (separate from the `mobills` CLI):

```bash
# Verify credentials
pnpm --filter @mobills/splitwise demo -- whoami

# Preview a percentage split without posting
pnpm --filter @mobills/splitwise demo -- create-expense \
  --description "T-Mobile — March 2026" --cost 180 \
  --split percentage --payer 111 \
  -p 111:40 -p 222:30 -p 333:30 --dry-run

# Post an equal split into a group
pnpm --filter @mobills/splitwise demo -- create-expense \
  --description "T-Mobile — March 2026" --cost 180 \
  --group 12345 --split equal --payer 111 \
  -p 111 -p 222 -p 333
```

Each `-p / --participant` is `userId-or-email[:value]`, where `value` is a percent
(`percentage` split) or an amount (`exact` split), and is ignored for `equal`.

## Not done yet

- Wiring these capabilities into the `mobills` CLI command tree.
- Resolving mobills members to Splitwise user ids automatically (members already
  carry an optional `splitwiseUserId` in the Convex schema).
- OAuth-based authentication.
