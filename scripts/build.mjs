// Draws the profile's neon cards into assets/:
//   header.svg     name card with cycling roles
//   orbit.svg      my stack orbiting my initials
//   languages.svg  language split across my public repos (needs GITHUB_TOKEN or GH_TOKEN;
//                  skipped without one, so the static art can still be rebuilt offline)
// Run: node scripts/build.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LOGIN = 'SankalpMathur05';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

const C = { bg: '#07080d', edge: '#1a1f2b', ring: '#1c2333', text: '#eef4ff', muted: '#7d8aa3', cyan: '#00e5ff', pink: '#ff2bd6' };
const NEON = [C.cyan, C.pink, '#a855f7', '#39ff88', '#ffd166', '#ff6b3d'];
const SANS = `-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif`;
const MONO = `ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Shared shell: dark rounded card, faint dot grid, neon glow filter.
function card(w, h, label, body, css = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
<title>${esc(label)}</title>
<style>
.sans{font-family:${SANS}}.mono{font-family:${MONO}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes blink{50%{opacity:0}}
${css}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<defs>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#ffffff" opacity=".07"/></pattern>
<clipPath id="card"><rect width="${w}" height="${h}" rx="16"/></clipPath>
</defs>
<g clip-path="url(#card)">
<rect width="${w}" height="${h}" fill="${C.bg}"/>
<rect width="${w}" height="${h}" fill="url(#dots)"/>
${body}
</g>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="15.5" fill="none" stroke="${C.edge}"/>
</svg>
`;
}

// ---------- header ----------

function header() {
  const W = 840, H = 232;
  const roles = ['AI engineer', 'Frontend developer', 'On-device ML', 'Full-stack & mobile'];
  const step = 3; // seconds each role stays up
  const cycle = roles.length * step;
  const lines = roles
    .map((r, i) => {
      const caretX = 66 + r.length * 10.85 + 4;
      return `<g class="role" style="animation-delay:${i * step}s">
<text x="66" y="150" class="mono" font-size="18" fill="${C.cyan}" filter="url(#glow)">${esc(r)}</text>
<rect x="${caretX.toFixed(1)}" y="135" width="9" height="19" fill="${C.cyan}" class="caret" filter="url(#glow)"/>
</g>`;
    })
    .join('');
  const body = `
<text x="44" y="102" class="sans" font-size="46" font-weight="700" letter-spacing="-.5" fill="${C.text}">Sankalp Mathur</text>
<text x="44" y="150" class="mono" font-size="18" fill="${C.muted}">&gt;</text>
${lines}
<text x="44" y="194" class="mono" font-size="13" fill="${C.muted}">New Delhi, IN  ·  AI &amp; backend @ IntelGrader</text>
<g transform="translate(700 112)">
  <circle r="80" fill="none" stroke="${C.ring}" stroke-dasharray="2 6"/>
  <circle r="56" fill="none" stroke="${C.cyan}" stroke-width="1.5" opacity=".75" filter="url(#glow)"/>
  <circle r="30" fill="none" stroke="${C.pink}" stroke-width="1" opacity=".5" filter="url(#glow)"/>
  <g class="orbiter"><circle cx="56" cy="0" r="4.5" fill="${C.pink}" filter="url(#glow)"/></g>
  <g class="orbiter2"><circle cx="0" cy="-80" r="3" fill="${C.cyan}" filter="url(#glow)"/></g>
</g>
<linearGradient id="edge" x1="0" x2="1"><stop offset="0" stop-color="${C.cyan}" stop-opacity="0"/><stop offset=".2" stop-color="${C.cyan}"/><stop offset=".8" stop-color="${C.pink}"/><stop offset="1" stop-color="${C.pink}" stop-opacity="0"/></linearGradient>
<rect x="0" y="${H - 3}" width="${W}" height="2" fill="url(#edge)" opacity=".55" filter="url(#glow)"/>
<linearGradient id="sweep" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<rect class="sweep" x="-160" y="${H - 3}" width="160" height="2" fill="url(#sweep)" filter="url(#glow)"/>`;
  const css = `
@keyframes role{0%{opacity:0}3%{opacity:1}${((step / cycle) * 100 - 3).toFixed(1)}%{opacity:1}${((step / cycle) * 100).toFixed(1)}%{opacity:0}100%{opacity:0}}
.role{opacity:0;animation:role ${cycle}s linear infinite}
.caret{animation:blink 1s steps(1,end) infinite}
.orbiter{animation:spin 8s linear infinite}
.orbiter2{animation:spin 14s linear infinite reverse}
@keyframes sweep{to{transform:translateX(${W + 160}px)}}
.sweep{animation:sweep 5s cubic-bezier(.45,0,.55,1) infinite}`;
  return card(W, H, `Sankalp Mathur. ${roles.join(', ')}. New Delhi, India. AI and backend at IntelGrader.`, body, css);
}

// ---------- orbit ----------

function orbit() {
  const W = 840, H = 400, cx = 420, cy = 196;
  const rings = [
    { r: 74, secs: 36, items: ['Python', 'TypeScript'] },
    { r: 116, secs: 60, items: ['React', 'Next.js', 'PyTorch', 'FastAPI'] },
    { r: 168, secs: 90, items: ['Kotlin', 'PostgreSQL', 'ONNX', 'Docker', 'React Native'] },
  ];
  let css = '';
  const groups = rings
    .map((ring, ri) => {
      css += `.r${ri}{transform-origin:${cx}px ${cy}px;animation:spin ${ring.secs}s linear infinite}\n`;
      const nodes = ring.items
        .map((name, i) => {
          const a = (i / ring.items.length) * Math.PI * 2 + ri * 0.7;
          const x = +(cx + Math.cos(a) * ring.r).toFixed(1), y = +(cy + Math.sin(a) * ring.r).toFixed(1);
          const col = NEON[(ri * 2 + i) % NEON.length];
          // counter-rotate each node so its label stays upright; centred under the dot
          // so it never runs into the core as the ring turns
          return `<g style="transform-origin:${x}px ${y}px;animation:spin ${ring.secs}s linear infinite reverse">
<circle cx="${x}" cy="${y}" r="4" fill="${col}" filter="url(#glow)"/>
<text x="${x}" y="${y + 20}" class="mono" font-size="12.5" fill="#d7e6ff" text-anchor="middle">${esc(name)}</text>
</g>`;
        })
        .join('');
      return `<circle cx="${cx}" cy="${cy}" r="${ring.r}" fill="none" stroke="${C.ring}"${ri === 1 ? ' stroke-dasharray="3 7"' : ''}/>
<g class="r${ri}">${nodes}</g>`;
    })
    .join('\n');
  const body = `
<text x="28" y="40" class="mono" font-size="13" fill="${C.muted}">// stack in orbit</text>
${groups}
<circle cx="${cx}" cy="${cy}" r="30" fill="${C.bg}" stroke="${C.cyan}" stroke-width="1.5" filter="url(#glow)" class="core"/>
<text x="${cx}" y="${cy + 6}" class="sans" font-size="17" font-weight="700" fill="${C.text}" text-anchor="middle">SM</text>`;
  css += `@keyframes core{50%{stroke-opacity:.35}}.core{animation:core 3s ease-in-out infinite}`;
  return card(W, H, 'My stack in orbit: Python, TypeScript, React, Next.js, PyTorch, FastAPI, Kotlin, PostgreSQL, ONNX, Docker and React Native.', body, css);
}

// ---------- languages ----------

async function languages() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) return null;
  const query = `query($login: String!) { user(login: $login) {
    repositories(privacy: PUBLIC, ownerAffiliations: OWNER, isFork: false, first: 100) {
      nodes { languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name } } } } } } }`;
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
    for (const { size, node } of repo.languages.edges) if (!SKIP.has(node.name)) totals.set(node.name, (totals.get(node.name) ?? 0) + size);
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  const langs = [...totals]
    .map(([name, size]) => ({ name, pct: (size / sum) * 100 }))
    .filter((l) => l.pct >= 1)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 6);

  const W = 840, H = 124, BX = 28, BW = W - 56;
  const shown = langs.reduce((n, l) => n + l.pct, 0);
  let x = BX, lx = BX;
  const bar = langs
    .map((l, i) => {
      const w = (l.pct / shown) * BW;
      const seg = `<rect x="${x.toFixed(1)}" y="56" width="${Math.max(w - 3, 1).toFixed(1)}" height="6" rx="3" fill="${NEON[i]}" filter="url(#glow)"/>`;
      x += w;
      return seg;
    })
    .join('');
  const legend = langs
    .map((l, i) => {
      const item = `<circle cx="${lx + 4}" cy="94" r="4" fill="${NEON[i]}" filter="url(#glow)"/><text x="${lx + 14}" y="98" class="mono" font-size="12.5" fill="#d7e6ff">${esc(l.name)} <tspan fill="${C.muted}">${l.pct.toFixed(1)}%</tspan></text>`;
      lx += 34 + (l.name.length + l.pct.toFixed(1).length + 2) * 7.6;
      return item;
    })
    .join('');
  const body = `<text x="28" y="38" class="mono" font-size="13" fill="${C.muted}">// most used languages</text>${bar}${legend}`;
  console.log(langs.map((l) => `${l.name} ${l.pct.toFixed(1)}%`).join(', '));
  return card(W, H, 'Most used languages across my public repos: ' + langs.map((l) => `${l.name} ${l.pct.toFixed(1)}%`).join(', '), body);
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'header.svg'), header());
writeFileSync(join(OUT, 'orbit.svg'), orbit());
const langs = await languages();
if (langs) writeFileSync(join(OUT, 'languages.svg'), langs);
else console.log('no token: kept the existing languages.svg');
