# Contributing to mobills

Thanks for helping improve **mobills**! This guide describes what a change needs
before it is ready to open a pull request. Both requirements below are enforced
in CI, so it is fastest to satisfy them locally before you push.

## Prerequisites

```bash
pnpm install
```

Use **pnpm** for everything — never `npm` or `yarn` — so the lockfile and Nx
workspace resolution stay consistent.

## PR readiness checklist

A change is ready to submit when **both** of these are true:

- [ ] Every commit follows [Conventional Commits](https://www.conventionalcommits.org/).
- [ ] A [version plan](#2-version-plan-required) exists for every publishable project you touched.

Plus the usual: `pnpm nx run-many -t typecheck build test` passes.

## 1. Conventional Commits (required)

Every commit message MUST follow the
[Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>
```

Common types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `build`, `ci`.
Use a scope to point at the affected package, e.g. `feat(cli): add member command`.

**CI check:** the `Commits` job in `.github/workflows/ci.yml` lints every commit
in the pull request and fails if any commit does not conform.

## 2. Version plan (required)

We version and publish packages independently using
[Nx Release **version plans**](https://nx.dev/docs/guides/nx-release/file-based-versioning-version-plans).
A version plan is a small markdown file in `.nx/version-plans/` that records the
intended semver bump (`patch` / `minor` / `major`) and the changelog entry for
your change. It is committed alongside your code and consumed automatically when
we cut a release.

**Any change that touches a publishable project needs a version plan.** Currently
the only publishable package is `@mobills/cli` (see the `npm:publishable` tag in
`tools/cli/project.json` and `release.projects` in `nx.json`). Changes limited to
tests, markdown, or config files are ignored — see
`release.versionPlans.ignorePatternsForPlanCheck` in `nx.json`.

### Generate a plan with Nx (do not write the file by hand)

Always use the Nx tooling so the file name, location, and Front Matter are valid:

```bash
# Interactive: pick the project(s), bump type, and write a description
pnpm plan

# Or non-interactively supply the bump and changelog message
pnpm plan patch -m "fix(cli): correct member lookup"
```

Do **not** create or edit files under `.nx/version-plans/` manually.

### Verify before you push

```bash
pnpm plan:check
```

This runs `nx release plan:check`, which fails with a non-zero exit code if a
project you changed is missing a version plan.

**CI check:** the `Version plan` job in `.github/workflows/ci.yml` runs the same
command against your PR's changes and blocks the merge if a plan is missing.

## Releasing (maintainers)

Publishing to the [`@mobills` npm org](https://www.npmjs.com/settings/mobills/packages)
is automated by `.github/workflows/publish.yml`. On a push to `develop` it applies
the accumulated version plans (`nx release version` + changelog), then publishes
the packages tagged `npm:publishable` to npm. Only packages carrying that tag are
ever published, so today that is just `@mobills/cli`. To make another package
publishable, add the `npm:publishable` tag to its `project.json` and make its
`package.json` publishable (remove `"private": true`, add `publishConfig.access`).
