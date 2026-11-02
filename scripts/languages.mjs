// Draws assets/languages-{light,dark}.svg: a GitHub-style language bar built from
// the languages across my public, non-fork repos. Needs GITHUB_TOKEN or GH_TOKEN.
// Run locally: GH_TOKEN=$(gh auth token) node scripts/languages.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LOGIN = 'SankalpMathur05';
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) throw new Error('Set GITHUB_TOKEN or GH_TOKEN');

const query = `query($login: String!) {
  user(login: $login) {
    repositories(privacy: PUBLIC, ownerAffiliations: OWNER, isFork: false, first: 100) {
      nodes { languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } } }
    }
  }
}`;
const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': LOGIN },
  body: JSON.stringify({ query, variables: { login: LOGIN } }),
});
const json = await res.json();
if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors ?? json));

// Build scripts and config files say little about what I actually write.
const SKIP = new Set(['Batchfile', 'Shell', 'PowerShell', 'Dockerfile', 'Makefile', 'Procfile']);
const totals = new Map();
for (const repo of json.data.user.repositories.nodes)
  for (const { size, node } of repo.languages.edges)
    if (!SKIP.has(node.name)) totals.set(node.name, { size: (totals.get(node.name)?.size ?? 0) + size, color: node.color ?? '#8b949e' });
const sum = [...totals.values()].reduce((n, l) => n + l.size, 0);
const langs = [...totals]
  .map(([name, l]) => ({ name, color: l.color, pct: (l.size / sum) * 100 }))
  .filter((l) => l.pct >= 1)
  .sort((a, b) => b.pct - a.pct)
  .slice(0, 6);

const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif`;
const W = 840, H = 92;

function card({ fg, muted, track }) {
  const shown = langs.reduce((n, l) => n + l.pct, 0);
  let x = 0;
  const bar = langs
    .map((l) => {
      const w = (l.pct / shown) * W;
      const seg = `<rect x="${x.toFixed(1)}" y="34" width="${Math.max(w - 2, 1).toFixed(1)}" height="8" fill="${l.color}"/>`;
      x += w;
      return seg;
    })
    .join('');
  let lx = 0;
  const legend = langs
    .map((l) => {
      const label = `${l.name} ${l.pct.toFixed(1)}%`;
      const item = `<circle cx="${lx + 5}" cy="70" r="5" fill="${l.color}"/><text x="${lx + 16}" y="74.5" fill="${fg}" font-size="13" font-weight="600">${l.name}<tspan fill="${muted}" font-weight="400"> ${l.pct.toFixed(1)}%</tspan></text>`;
      lx += 30 + label.length * 7.4;
      return item;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Most used languages: ${langs.map((l) => `${l.name} ${l.pct.toFixed(1)}%`).join(', ')}">
<style>text{font-family:${FONT}}</style>
<text x="0" y="18" fill="${fg}" font-size="14" font-weight="600">Most used languages</text>
<clipPath id="r"><rect x="0" y="34" width="${W}" height="8" rx="4"/></clipPath>
<rect x="0" y="34" width="${W}" height="8" rx="4" fill="${track}"/>
<g clip-path="url(#r)">${bar}</g>
${legend}
</svg>
`;
}

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'languages-light.svg'), card({ fg: '#1f2328', muted: '#59636e', track: '#eff2f5' }));
writeFileSync(join(out, 'languages-dark.svg'), card({ fg: '#f0f6fc', muted: '#9198a1', track: '#262c36' }));
console.log(langs.map((l) => `${l.name} ${l.pct.toFixed(1)}%`).join(', '));
