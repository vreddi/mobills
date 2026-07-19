/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * This file mirrors the output of `npx convex codegen`. It is committed so the
 * workspace typechecks and builds without a live Convex deployment. Run
 * `pnpm --filter @mobills/convex codegen` after connecting Convex to
 * regenerate it against the deployment.
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from 'convex/server';
import type * as accounts from '../accounts.js';
import type * as members from '../members.js';

/**
 * A utility for referencing Convex functions in your app's API.
 */
declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  members: typeof members;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'public'>
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'internal'>
>;
