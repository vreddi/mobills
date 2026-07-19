/* eslint-disable */
/**
 * Generated utilities for implementing server-side Convex query and mutation functions.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * This file mirrors the output of `npx convex codegen`. Run
 * `pnpm --filter @mobills/convex codegen` after connecting Convex to
 * regenerate it against the deployment.
 */

import {
  actionGeneric,
  httpActionGeneric,
  queryGeneric,
  mutationGeneric,
  internalActionGeneric,
  internalMutationGeneric,
  internalQueryGeneric,
} from 'convex/server';

/**
 * Define a query in this Convex app's public API.
 */
export const query = queryGeneric;

/**
 * Define a query that is only accessible from other Convex functions.
 */
export const internalQuery = internalQueryGeneric;

/**
 * Define a mutation in this Convex app's public API.
 */
export const mutation = mutationGeneric;

/**
 * Define a mutation that is only accessible from other Convex functions.
 */
export const internalMutation = internalMutationGeneric;

/**
 * Define an action in this Convex app's public API.
 */
export const action = actionGeneric;

/**
 * Define an action that is only accessible from other Convex functions.
 */
export const internalAction = internalActionGeneric;

/**
 * Define an HTTP action.
 */
export const httpAction = httpActionGeneric;
