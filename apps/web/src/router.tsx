import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { LandingPage } from '@/pages/Landing';
import { DocsLayout } from '@/pages/docs/DocsLayout';
import { DocsIntroduction } from '@/pages/docs/Introduction';
import { DocsInstallation } from '@/pages/docs/Installation';
import { DocsAuthentication } from '@/pages/docs/Authentication';
import { DocsTMobile } from '@/pages/docs/TMobile';
import { DocsAccountCommands } from '@/pages/docs/AccountCommands';
import { DocsMemberCommands } from '@/pages/docs/MemberCommands';
import { DocsBillCommands } from '@/pages/docs/BillCommands';
import { DocsSplitwise } from '@/pages/docs/Splitwise';
import { DocsSkills } from '@/pages/docs/Skills';
import { NotFound } from '@/pages/NotFound';

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFound,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'docs',
  component: DocsLayout,
});

const docsIndexRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: '/',
  component: DocsIntroduction,
});

const docsInstallationRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: 'installation',
  component: DocsInstallation,
});

const docsAuthenticationRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: 'authentication',
  component: DocsAuthentication,
});

const docsTMobileRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: 'providers/tmobile',
  component: DocsTMobile,
});

const docsAccountRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: 'commands/account',
  component: DocsAccountCommands,
});

const docsMemberRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: 'commands/member',
  component: DocsMemberCommands,
});

const docsBillRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: 'commands/bill',
  component: DocsBillCommands,
});

const docsSplitwiseRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: 'integrations/splitwise',
  component: DocsSplitwise,
});

const docsSkillsRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: 'skills',
  component: DocsSkills,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  docsRoute.addChildren([
    docsIndexRoute,
    docsInstallationRoute,
    docsAuthenticationRoute,
    docsTMobileRoute,
    docsAccountRoute,
    docsMemberRoute,
    docsBillRoute,
    docsSplitwiseRoute,
    docsSkillsRoute,
  ]),
]);

export const router = createRouter({ routeTree, scrollRestoration: true });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
