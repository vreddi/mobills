# Running the CLI locally

The `mobills` CLI lives in `tools/cli` (`@mobills/cli`). For day-to-day
development you can build it from source and expose it on your `PATH` as
`mobills`, so you run the exact code in your working tree. When you want the
real thing, unlink it and use the published package instead.

## Prerequisites

- Dependencies installed from the repo root: `pnpm install`.
- A directory on your `PATH` to hold the symlink. By default the linker uses
  `~/.local/bin` when it is on your `PATH`, otherwise the first writable
  `PATH` directory under your home folder. See
  [Choosing the bin directory](#choosing-the-bin-directory) to override this.

## Link the local build

From the repo root:

```bash
pnpm cli:link
```

This runs `cli:build` (via `tsup`) and then symlinks the built entry point
(`tools/cli/dist/index.js`) to `mobills` in a directory on your `PATH`. Now you
can run it from anywhere:

```bash
mobills --help
mobills login
mobills account list
```

> The build output has a `#!/usr/bin/env node` shebang and is executable, and
> its runtime dependencies resolve from the workspace `node_modules`, so the
> symlink works without a global install.

## Refresh after code changes

The symlink always points at `tools/cli/dist/index.js`, so after editing the
CLI source just rebuild — no need to re-link:

```bash
pnpm cli:build
```

## Unlink the local build

```bash
pnpm cli:unlink
```

This removes **only** our own symlink. It never deletes a real file (for
example, a globally installed published binary), so it is safe to run anytime.

## Switch to the published package

Once `@mobills/cli` is published, install it globally and use that instead of
the local build:

```bash
# 1. Remove the local link so it can't shadow the published binary:
pnpm cli:unlink

# 2. Install the published package globally (choose your package manager):
pnpm add -g @mobills/cli
# or: npm install -g @mobills/cli

mobills --help   # now runs the published version
```

If both a local link and a global install exist at the same time, whichever
directory comes first on your `PATH` wins. `pnpm cli:unlink` clears the local
link so there is no ambiguity.

## Choosing the bin directory

The linker picks the target directory in this order:

1. `MOBILLS_BIN_DIR`, if set (an explicit override).
2. `~/.local/bin`, if it is on your `PATH`.
3. The first writable directory on your `PATH` that is under your home folder
   (node-version-specific `nvm` directories are skipped so the link doesn't
   break when you switch Node versions).
4. Otherwise `~/.local/bin` is created and you are warned to add it to `PATH`.

To force a specific location:

```bash
MOBILLS_BIN_DIR="$HOME/bin" pnpm cli:link
MOBILLS_BIN_DIR="$HOME/bin" pnpm cli:unlink
```

If the linker warns that its directory is not on your `PATH`, add it (in your
`~/.zshrc`, `~/.bashrc`, etc.):

```bash
export PATH="$HOME/.local/bin:$PATH"
```

## Why not `pnpm link --global`?

`pnpm link --global` / `npm link` depend on a configured global bin directory
(`pnpm setup`) and a matching global pnpm store version. In a monorepo that
pins its own pnpm via `packageManager`, those can conflict with a differently
versioned global pnpm. The `cli:link` script sidesteps all of that by managing
a single symlink itself.
