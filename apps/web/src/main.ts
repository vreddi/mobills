import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <main class="hero">
    <span class="badge">mobills.io</span>
    <h1>mobills</h1>
    <p class="tagline">
      Split a shared mobile bill across a group of friends — without the
      spreadsheet gymnastics.
    </p>
    <div class="actions">
      <a class="button" href="https://github.com/vreddi/mobills">View on GitHub</a>
    </div>
    <footer>Built with Nx, pnpm, Convex &amp; Clerk.</footer>
  </main>
`;
