<!--
  Thanks for contributing to mobills! This template enforces the repo
  conventions documented in AGENTS.md. If anything here conflicts with
  AGENTS.md, AGENTS.md is the source of truth.
-->

## Summary

<!-- Describe what this PR does and why. -->

## Checklist

- [ ] All commits in this PR follow [Conventional Commits](../AGENTS.md#commits--conventional-commits-only) (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `build:`, `ci:`, with an optional scope).
- [ ] This change includes an [Nx release version plan](../AGENTS.md#version-plans--required-for-every-project-change) generated via `pnpm plan` and verified with `pnpm plan:check` — **or** N/A because this change doesn't touch a publishable project (e.g. docs/config-only).

## Notes for AI agents

If you are an AI coding agent (GitHub Copilot, Claude Code, Codex, or similar) opening this PR, before submitting:

1. Run `pnpm plan` to generate a version plan for any publishable project you touched, then run `pnpm plan:check` to confirm nothing is missing. **Never hand-author files under `.nx/version-plans/`.**
2. Make sure every commit message follows Conventional Commits (see the checklist above).
3. Remember that [version plan descriptions are public changelog content](../AGENTS.md#version-plan-descriptions-are-public-changelog-content) — never include personal or internal-only info (real names, phone numbers, account/billing identifiers, internal tool or employee details, private URLs, credentials, etc.) in the `pnpm plan -m "..."` message. Write it like a public open-source changelog entry.

See [AGENTS.md](../AGENTS.md) for the full conventions — it is the source of truth if anything here conflicts with it.
