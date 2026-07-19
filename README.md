# mobills

Manage a shared T-Mobile bill split across a group of friends. This monorepo
mirrors the T-Mobile account and its members into a purpose-built application,
starting with a CLI that seeds and manages the underlying data.

## Toolchain

- **Monorepo:** [Nx](https://nx.dev)
- **Package manager:** [pnpm](https://pnpm.io) with pnpm workspaces
- **Runtime:** Node.js / TypeScript (ESM)
- **Auth:** [Clerk](https://clerk.com)
- **Data / backend:** [Convex](https://www.convex.dev)

## Layout

```
/
├── apps/
│   └── web/       # @mobills/web — Vite landing page (mobills.io, GitHub Pages)
├── packages/
│   └── convex/    # @mobills/convex — schema + Convex functions
├── tools/
│   └── cli/       # @mobills/cli — the `mobills` CLI
```

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

| Variable                  | Required | Description                                                                 |
| ------------------------- | -------- | --------------------------------------------------------------------------- |
| `CONVEX_URL`              | yes      | Convex deployment URL (from `npx convex dev`).                              |
| `CLERK_SESSION_TOKEN`     | yes      | Clerk session token minted from the JWT template named exactly `convex`.    |
| `CONVEX_DEPLOY_KEY`       | no       | Used by `convex deploy` in CI/non-interactive environments.                 |
| `CLERK_PUBLISHABLE_KEY`   | no       | Clerk publishable key.                                                       |
| `CLERK_SECRET_KEY`        | no       | Clerk secret key.                                                            |
| `CLERK_JWT_ISSUER_DOMAIN` | no       | Clerk issuer / Frontend API URL; must match the `convex` JWT template.      |

Secrets always come from the environment — never commit a real `.env`.

## Configure Clerk

You can set the Clerk values by hand from the [dashboard](https://dashboard.clerk.com),
or use the official [Clerk CLI](https://clerk.com/docs) to automate most of it.

### Option A — Clerk CLI (recommended)

Install once (`npm install -g clerk` or `brew install clerk/stable/clerk`), then
from the repo root:

```bash
clerk apps create "mobills"   # or: clerk link  (pick an existing app)
clerk env pull --file .env          # writes CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY
clerk whoami                        # confirm the logged-in user and linked app
```

Still set manually (the CLI does not do these for you):

- **The `convex` JWT template** — Convex needs a Clerk JWT template named exactly
  `convex` whose claims include `{ "aud": "convex" }` (matching `applicationID:
  'convex'` in `auth.config.ts`). Create it in one command with the Clerk CLI:

  ```bash
  clerk api -X POST /jwt_templates \
    -d '{"name":"convex","claims":{"aud":"convex"}}'
  ```

  `name` and `claims` are the only required fields; Clerk fills the rest with the
  same defaults as its dashboard "Convex" preset (`RS256`, `lifetime` 60s,
  `allowed_clock_skew` 5s). Keep the name lowercase `convex` and `aud` as a plain
  string (not an array), or Convex won't recognize the token. (Alternatively,
  activating Clerk's Convex integration at `dashboard.clerk.com/apps/setup/convex`
  bakes `aud: "convex"` into the session token, and no template is needed.)
- **`CLERK_JWT_ISSUER_DOMAIN`** — your instance's Frontend API / issuer URL
  (e.g. `https://<subdomain>.clerk.accounts.dev`). It must match the `convex`
  JWT template issuer. Convex also displays this after you add the template.
- **`CLERK_SESSION_TOKEN`** — a session token minted from the `convex` template.
  This requires a signed-in session; `clerk impersonate <user>` gives you a
  sign-in URL to obtain one, then copy the `convex`-template token into `.env`.

### Option B — Clerk dashboard

Create the application, copy the publishable/secret keys, add the `convex` JWT
template, and grab a session token — all from the dashboard — then fill in `.env`.

## Getting started

```bash
pnpm install

# 1. Connect Convex (creates a deployment, sets CONVEX_URL, regenerates the API):
pnpm --filter @mobills/convex dev

# 2. In another shell, run the CLI:
pnpm --filter @mobills/cli start --help
pnpm --filter @mobills/cli start account create --name "T-Mobile Family"
pnpm --filter @mobills/cli start account list
pnpm --filter @mobills/cli start member add --account <accountId> --name "Alex"
pnpm --filter @mobills/cli start member list --account <accountId>
```

### Convex code generation

`packages/convex/convex/_generated` is committed so the workspace typechecks and
builds without a live Convex deployment. After connecting Convex, regenerate it
against your deployment:

```bash
pnpm --filter @mobills/convex codegen
```

## Validate

```bash
pnpm nx run-many -t typecheck
pnpm nx run-many -t build
```

## Contributing

Every commit MUST follow [Conventional Commits](https://www.conventionalcommits.org/),
and every change to a publishable package MUST ship with an Nx version plan
(generate one with `pnpm plan`). Both are enforced in CI. See
[docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) for the full PR checklist and
[AGENTS.md](./AGENTS.md) for the working agreements.
