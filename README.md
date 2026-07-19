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
│   └── convex/         # @mobills/convex — schema + Convex functions
│   └── integrations/
│       └── splitwise/  # @mobills/integration-splitwise — Splitwise expense capabilities
├── tools/
│   └── cli/       # @mobills/cli — the `mobills` CLI
```

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

| Variable                  | Required | Description                                                                 |
| ------------------------- | -------- | --------------------------------------------------------------------------- |
| `CONVEX_URL`              | yes      | Convex deployment URL (from `npx convex dev`).                              |
| `CLERK_PUBLISHABLE_KEY`   | yes\*    | Required for `mobills login` (hotloads Clerk.js in the browser).            |
| `CLERK_SESSION_TOKEN`     | no       | Legacy/fallback token from the `convex` JWT template. Prefer `mobills login`. |
| `CONVEX_DEPLOY_KEY`       | no       | Used by `convex deploy` in CI/non-interactive environments.                 |
| `CLERK_SECRET_KEY`        | no       | Clerk secret key.                                                            |
| `CLERK_JWT_ISSUER_DOMAIN` | no       | Clerk issuer / Frontend API URL; must match the `convex` JWT template.      |
| `SPLITWISE_API_KEY`       | no\*     | Splitwise personal API key; required to use the Splitwise capabilities.      |
| `SPLITWISE_API_BASE_URL`  | no       | Override the Splitwise API base URL (defaults to the v3.0 endpoint).         |

\* Required only when invoking the `@mobills/integration-splitwise` capabilities.

\* `CLERK_PUBLISHABLE_KEY` is required to sign in with `mobills login`. If you
instead supply a `CLERK_SESSION_TOKEN` directly, it is not needed.

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

# 2. In another shell, sign in and run the CLI:
pnpm --filter @mobills/cli start login
pnpm --filter @mobills/cli start account create --name "T-Mobile Family"
pnpm --filter @mobills/cli start account list
pnpm --filter @mobills/cli start member add --account <accountId> --name "Alex"
pnpm --filter @mobills/cli start member list --account <accountId>
```

Prefer running the CLI as a plain `mobills` command? See
[Running the CLI locally](./docs/cli/local-install.md) to build it and put it on
your `PATH` (`pnpm cli:link`), then unlink it (`pnpm cli:unlink`) to fall back to
the published package.

### Signing in

The CLI authenticates to Convex as a Clerk user. The easiest way is a browser
sign-in:

```bash
pnpm --filter @mobills/cli start login    # opens the browser, caches a token
pnpm --filter @mobills/cli start whoami   # show the signed-in user
pnpm --filter @mobills/cli start logout   # remove the cached token
```

`login` serves a small sign-in page on `127.0.0.1`, hotloads Clerk.js using
`CLERK_PUBLISHABLE_KEY`, mints a token from the `convex` JWT template, and caches
it at `~/.config/mobills/credentials.json` (mode `0600`). Commands use this
cached token automatically, falling back to `CLERK_SESSION_TOKEN` if set.

> The `convex` JWT template defaults to a **60-second** lifetime, so cached
> tokens expire quickly. Run commands right after `login`, or raise the
> template's token lifetime in Clerk for a smoother experience. If a command
> reports it is not authenticated, run `login` again.

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

## Docs

- [Splitwise integration](./docs/splitwise-integration.md) — how mobills posts
  individual and group expenses to Splitwise and splits them by percentage,
  equally, or by exact amount.
