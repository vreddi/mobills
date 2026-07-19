# AGENTS.md

Guidance for AI agents and human contributors working in the **mobills** repository.

## What this project is

`mobills` helps manage a shared T-Mobile bill that is split across a group
of friends. Today the group is tracked in Splitwise, where the repo owner posts a
monthly group transaction and requests money from each member. This project moves
that workflow into a purpose-built application, starting with a CLI that seeds and
manages the underlying account and member data.

## Repository conventions

### Commits — Conventional Commits only

**Every commit in this repository MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.** No exceptions.

Format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Common types:

- `feat:` — a new feature
- `fix:` — a bug fix
- `docs:` — documentation-only changes
- `chore:` — tooling, config, or maintenance work
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `test:` — adding or updating tests
- `build:` — build system or dependency changes
- `ci:` — CI configuration changes

Use an optional scope to point at the affected package, e.g.
`feat(cli): add member command` or `chore(repo): configure pnpm workspaces`.

This rule applies to humans and agents alike. Do not squash-merge in a way that
drops the conventional commit message.

## Toolchain

- **Monorepo:** [Nx](https://nx.dev)
- **Package manager:** [pnpm](https://pnpm.io) with **pnpm workspaces**
- **Runtime:** Node.js / TypeScript
- **Auth:** [Clerk](https://clerk.com)
- **Data / backend:** [Convex](https://www.convex.dev)

Always use `pnpm` (never `npm` or `yarn`) so the lockfile and workspace resolution
stay consistent.

## Workspace layout

The repo is an Nx monorepo organized around three top-level entry points:

```
/
├── apps/        # Deployable applications (e.g. the mobills.io landing page)
├── tools/       # Executable tooling and CLIs (e.g. the mobills CLI)
├── packages/    # Shared libraries and reusable packages
├── AGENTS.md
└── ...
```

- `apps/` — deployable applications (web front-ends, services).
- `tools/` — standalone tools and command-line apps.
- `packages/` — shared, importable libraries consumed by tools and apps.

## Planned components

### CLI (`tools/`)

A detailed CLI tool that gets the group's data into the application:

- Create a T-Mobile tracking account (a local representation — the real T-Mobile
  account and its members already exist; this just mirrors that data).
- Add members to the tracking account.
- Authenticate operators via **Clerk**.
- Persist data in **Convex** using a well-defined schema.

## Working agreements for agents

- Do exactly what is asked; keep changes surgical and scoped to the request.
- Respect the toolchain above — do not introduce alternative package managers,
  monorepo tools, auth providers, or datastores without being asked.
- Follow Conventional Commits for every commit (see above).
- Prefer opening focused PRs over large, mixed-scope changes.
