import { spawn } from 'node:child_process';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { getPublishableKey } from './env.js';

/**
 * Derive the Clerk Frontend API host from a publishable key. The key is
 * `pk_test_`/`pk_live_` followed by base64(`<frontend-api>$`).
 */
function frontendApiFromPublishableKey(publishableKey: string): string {
  const withoutPrefix = publishableKey.replace(/^pk_(test|live)_/, '');
  const decoded = Buffer.from(withoutPrefix, 'base64').toString('utf8');
  return decoded.replace(/\$+$/, '');
}

function openBrowser(url: string): void {
  const platform = process.platform;
  let command: string;
  let args: string[];
  if (platform === 'darwin') {
    command = 'open';
    args = [url];
  } else if (platform === 'win32') {
    command = 'cmd';
    args = ['/c', 'start', '', url];
  } else {
    command = 'xdg-open';
    args = [url];
  }
  try {
    const child = spawn(command, args, { stdio: 'ignore', detached: true });
    child.on('error', () => {
      // Ignore — the URL is printed so the user can open it manually.
    });
    child.unref();
  } catch {
    // Ignore — the URL is printed so the user can open it manually.
  }
}

function browserScript(): string {
  return `
  (function () {
    var app = document.getElementById('app');
    function show(html) { app.innerHTML = html; }
    async function post(payload) {
      try {
        await fetch('/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (e) {}
    }
    async function waitForClerk() {
      var start = Date.now();
      while (!window.Clerk && Date.now() - start < 20000) {
        await new Promise(function (r) { setTimeout(r, 100); });
      }
      return window.Clerk;
    }
    async function captureToken() {
      try {
        var token = await window.Clerk.session.getToken({ template: 'convex' });
        if (!token) {
          show('<h1>Sign-in error</h1><p class="muted">Could not mint a token from the convex JWT template. Make sure it exists in Clerk.</p>');
          await post({ error: 'no token from convex template' });
          return;
        }
        await post({ token: token });
        show('<h1>Signed in &#10003;</h1><p class="muted">You can close this tab and return to your terminal.</p>');
      } catch (e) {
        var message = (e && e.message) ? e.message : String(e);
        show('<h1>Sign-in error</h1><p class="muted">' + message + '</p>');
        await post({ error: message });
      }
    }
    (async function () {
      var Clerk = await waitForClerk();
      if (!Clerk) {
        show('<h1>Failed to load Clerk</h1><p class="muted">Check your CLERK_PUBLISHABLE_KEY and network connection.</p>');
        return;
      }
      try { if (!Clerk.loaded) { await Clerk.load(); } } catch (e) {}
      if (Clerk.user && Clerk.session) { await captureToken(); return; }
      show('<div id="sign-in"></div>');
      try { Clerk.mountSignIn(document.getElementById('sign-in')); } catch (e) {}
      Clerk.addListener(function (res) {
        if (res && res.user && Clerk.session) { captureToken(); }
      });
    })();
  })();
  `;
}

function signInPage(publishableKey: string, frontendApi: string): string {
  const clerkScript = `https://${frontendApi}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`;
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    '<title>mobills &mdash; Sign in</title>',
    '<style>',
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#e2e8f0}',
    '#app{width:100%;max-width:440px;padding:24px;text-align:center}',
    'h1{font-size:20px;margin:0 0 8px}',
    '.muted{color:#94a3b8;font-size:14px}',
    '</style>',
    '</head>',
    '<body>',
    '<div id="app"><p class="muted">Loading sign-in&hellip;</p></div>',
    `<script async crossorigin="anonymous" data-clerk-publishable-key="${publishableKey}" src="${clerkScript}" type="text/javascript"></script>`,
    `<script>${browserScript()}</script>`,
    '</body>',
    '</html>',
  ].join('\n');
}

export interface BrowserLoginOptions {
  timeoutMs?: number;
}

/**
 * Runs the browser-based Clerk sign-in flow and resolves with a `convex`
 * template session token.
 */
export function browserLogin(options: BrowserLoginOptions = {}): Promise<string> {
  const timeoutMs = options.timeoutMs ?? 5 * 60 * 1000;
  const publishableKey = getPublishableKey();
  const frontendApi = frontendApiFromPublishableKey(publishableKey);
  const html = signInPage(publishableKey, frontendApi);

  return new Promise<string>((resolve, reject) => {
    let settled = false;

    const finish = (error: Error | null, token?: string): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      server.close();
      if (error) {
        reject(error);
      } else {
        resolve(token as string);
      }
    };

    const handleRequest = (req: IncomingMessage, res: ServerResponse): void => {
      const url = req.url ?? '/';
      if (req.method === 'GET' && (url === '/' || url.startsWith('/?'))) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }
      if (req.method === 'POST' && url === '/callback') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
          if (body.length > 1_000_000) {
            req.destroy();
          }
        });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body) as {
              token?: string;
              error?: string;
            };
            if (parsed.error) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false }));
              finish(new Error(`Sign-in failed: ${parsed.error}`));
              return;
            }
            if (!parsed.token) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false }));
              return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
            finish(null, parsed.token);
          } catch {
            res.writeHead(400);
            res.end();
          }
        });
        return;
      }
      res.writeHead(404);
      res.end();
    };

    const server = createServer(handleRequest);
    const timer = setTimeout(
      () => finish(new Error('Timed out waiting for sign-in.')),
      timeoutMs,
    );

    server.on('error', (error) => finish(error));
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address === null || typeof address === 'string') {
        finish(new Error('Failed to start local login server.'));
        return;
      }
      const loginUrl = `http://127.0.0.1:${address.port}/`;
      console.log(`\nOpening your browser to sign in:\n  ${loginUrl}\n`);
      console.log(
        'If it does not open automatically, paste the URL above into your browser.\n',
      );
      openBrowser(loginUrl);
    });
  });
}
