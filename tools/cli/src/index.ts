#!/usr/bin/env node
import { Command } from 'commander';
import { registerAccountCommands } from './commands/account.js';
import { registerMemberCommands } from './commands/member.js';

const program = new Command();

program
  .name('mobills')
  .description(
    'CLI to seed and manage the shared T-Mobile bill tracking data (Convex + Clerk).',
  )
  .version('0.0.0');

registerAccountCommands(program);
registerMemberCommands(program);

function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/auth|identated|not authenticated|unauthor|token|jwt/i.test(message)) {
    return (
      `${message}\n\n` +
      'This looks like an authentication problem. Your CLERK_SESSION_TOKEN may ' +
      'be missing or expired — mint a fresh token from the Clerk `convex` JWT ' +
      'template and update your .env, then try again.'
    );
  }
  return message;
}

async function main(): Promise<void> {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error(`\nError: ${describeError(error)}`);
    process.exitCode = 1;
  }
}

void main();
