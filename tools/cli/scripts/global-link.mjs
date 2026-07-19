#!/usr/bin/env node
// Link or unlink the locally built `mobills` CLI onto your PATH.
//
//   node tools/cli/scripts/global-link.mjs link     # symlink dist -> a PATH bin dir
//   node tools/cli/scripts/global-link.mjs unlink   # remove that symlink
//
// This intentionally avoids `pnpm link --global` / `npm link` so it does not
// depend on a configured global bin dir or a matching pnpm store version. It
// only ever creates/removes a single symlink named `mobills`, and `unlink`
// refuses to touch anything that is not our own symlink (so a globally
// installed, published @mobills/cli is never removed by accident).

import {
  accessSync,
  chmodSync,
  constants,
  existsSync,
  lstatSync,
  mkdirSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BIN_NAME = 'mobills';
const scriptDir = dirname(fileURLToPath(import.meta.url));
const cliDir = resolve(scriptDir, '..');
const target = join(cliDir, 'dist', 'index.js');

function pathDirs() {
  return (process.env.PATH ?? '')
    .split(delimiter)
    .filter(Boolean)
    .map((dir) => resolve(dir));
}

function isWritable(dir) {
  try {
    accessSync(dir, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function chooseBinDir() {
  if (process.env.MOBILLS_BIN_DIR) {
    return resolve(process.env.MOBILLS_BIN_DIR);
  }
  const home = homedir();
  const localBin = join(home, '.local', 'bin');
  const onPath = new Set(pathDirs());

  // Prefer ~/.local/bin when it is already on PATH.
  if (onPath.has(localBin) && isWritable(localBin)) {
    return localBin;
  }
  // Otherwise the first writable PATH dir under $HOME (skip node-version-
  // specific nvm dirs, which change whenever you switch Node versions).
  for (const dir of pathDirs()) {
    if (dir.startsWith(home) && !dir.includes('/.nvm/') && isWritable(dir)) {
      return dir;
    }
  }
  // Fall back to ~/.local/bin (created below); the caller warns about PATH.
  return localBin;
}

function symlinkPointsAtTarget(linkPath) {
  try {
    if (!lstatSync(linkPath).isSymbolicLink()) {
      return false;
    }
    return realpathSync(linkPath) === realpathSync(target);
  } catch {
    return false;
  }
}

function warnIfNotShadowing(binDir) {
  const shadowedBy = pathDirs().find(
    (dir) => dir !== binDir && existsSync(join(dir, BIN_NAME)),
  );
  const dirs = pathDirs();
  if (!dirs.includes(binDir)) {
    console.warn(
      `\n! ${binDir} is not on your PATH. Add it, e.g.:\n` +
        `    export PATH="${binDir}:$PATH"\n`,
    );
    return;
  }
  if (shadowedBy && dirs.indexOf(shadowedBy) < dirs.indexOf(binDir)) {
    console.warn(
      `\n! Another "${BIN_NAME}" earlier on PATH (${join(shadowedBy, BIN_NAME)}) ` +
        `will take precedence over the linked build.`,
    );
  }
}

function link() {
  if (!existsSync(target)) {
    console.error(
      `Build output not found at ${target}.\n` +
        'Run `pnpm --filter @mobills/cli build` (or `pnpm cli:link`) first.',
    );
    process.exit(1);
  }

  const binDir = chooseBinDir();
  mkdirSync(binDir, { recursive: true });
  chmodSync(target, 0o755);

  const linkPath = join(binDir, BIN_NAME);
  if (existsSync(linkPath) || lstatSync(linkPath, { throwIfNoEntry: false })) {
    const wasOurs = symlinkPointsAtTarget(linkPath);
    rmSync(linkPath, { force: true });
    if (!wasOurs) {
      console.warn(`Replaced an existing "${BIN_NAME}" at ${linkPath}.`);
    }
  }

  symlinkSync(target, linkPath);
  console.log(`Linked ${BIN_NAME} -> ${target}`);
  console.log(`  via ${linkPath}`);
  warnIfNotShadowing(binDir);
  console.log(
    `\nRun \`${BIN_NAME} --help\` to try it. After code changes, run ` +
      '`pnpm cli:build` to refresh (the symlink keeps pointing at dist/).',
  );
}

function unlink() {
  const dirs = process.env.MOBILLS_BIN_DIR
    ? [resolve(process.env.MOBILLS_BIN_DIR)]
    : pathDirs();
  let removed = false;
  for (const dir of dirs) {
    const linkPath = join(dir, BIN_NAME);
    if (symlinkPointsAtTarget(linkPath)) {
      rmSync(linkPath, { force: true });
      console.log(`Unlinked ${linkPath}`);
      removed = true;
    }
  }
  if (!removed) {
    console.log(
      `No linked ${BIN_NAME} found. A globally installed (published) ` +
        `@mobills/cli, if any, is untouched.`,
    );
  } else {
    console.log(
      `\nRemoved the local link. Any globally installed (published) ` +
        `@mobills/cli now takes over.`,
    );
  }
}

const command = process.argv[2];
if (command === 'link') {
  link();
} else if (command === 'unlink') {
  unlink();
} else {
  console.error('Usage: global-link.mjs <link|unlink>');
  process.exit(1);
}
