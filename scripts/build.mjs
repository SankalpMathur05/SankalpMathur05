// Draws the profile's neon cards into assets/:
//   header.svg     name card with cycling roles
//   breakout.svg   a self-playing Breakout game whose bricks are my stack
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

// ---------- breakout ----------

// Seeded PRNG so every rebuild plays the same match (no churn in git).
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A self-playing Breakout match. The game is simulated here, then every bounce,
// brick break and paddle move is baked into SMIL animations, which GitHub can play
// inside an image (no JavaScript allowed there).
function breakout() {
  const W = 840, H = 430;
  const L = 16, R = W - 16, TOP = 58;
  const rows = [
    ['TypeScript', 'JavaScript', 'Python', 'Kotlin', 'Java', 'C++'],
    ['React', 'Next.js', 'React Native', 'Tailwind', 'Three.js', 'Figma'],
    ['FastAPI', 'Django', 'Spring', 'Node.js', 'PostgreSQL', 'Redis'],
    ['PyTorch', 'ONNX', 'OpenCV', 'Docker', 'AWS', 'Git'],
  ];
  const ROW_COL = [C.cyan, C.pink, '#a855f7', '#39ff88'];
  const GAP = 10, BX = 28, BY = 74, BH = 28, BW = (W - 2 * BX - 5 * GAP) / 6;
  const bricks = rows.flatMap((row, r) => row.map((name, c) => ({ name, r, x: BX + c * (BW + GAP), y: BY + r * (BH + GAP), t: null })));
  const PY = 396, PW = 112, RAD = 6, SPEED = 480;
  const rand = rng(7);

  let x = W / 2, y = PY - RAD, t = 0, vx = 0, vy = 0, tEnd = null;
  // On every paddle hit, aim at a random surviving brick (clamped to sane angles).
  const aim = () => {
    const alive = bricks.filter((b) => b.t === null);
    const b = alive.length ? alive[Math.floor(rand() * alive.length)] : null;
    const tx = b ? b.x + BW / 2 + (rand() - 0.5) * BW * 0.6 : L + rand() * (R - L);
    const ty = b ? b.y + BH / 2 : TOP;
    const ang = Math.min(-0.45, Math.max(Math.PI * -0.86, Math.atan2(ty - y, tx - x)));
    vx = Math.cos(ang) * SPEED;
    vy = Math.sin(ang) * SPEED;
  };
  const paddleAt = (bx) => Math.min(R - PW / 2, Math.max(L + PW / 2, bx - (vx / SPEED) * PW * 0.35));

  aim();
  const path = [[0, x, y]];
  const paddle = [[0, paddleAt(x)]];
  const dt = 1 / 600;
  while (t < 150) {
    const px = x, py = y;
    x += vx * dt; y += vy * dt; t += dt;
    let bounced = false;
    if (x - RAD < L) { x = L + RAD; vx = Math.abs(vx); bounced = true; }
    if (x + RAD > R) { x = R - RAD; vx = -Math.abs(vx); bounced = true; }
    if (y - RAD < TOP) { y = TOP + RAD; vy = Math.abs(vy); bounced = true; }
    for (const b of bricks) {
      if (b.t !== null) continue;
      const nx = Math.max(b.x, Math.min(x, b.x + BW)), ny = Math.max(b.y, Math.min(y, b.y + BH));
      if ((x - nx) ** 2 + (y - ny) ** 2 > RAD * RAD) continue;
      b.t = t;
      // came in from the side if it was level with the brick a moment ago
      if ((px < b.x || px > b.x + BW) && py >= b.y && py <= b.y + BH) vx = -vx;
      else vy = -vy;
      x = px; y = py; bounced = true;
      break;
    }
    if (vy > 0 && y + RAD >= PY) {
      y = PY - RAD;
      aim();
      paddle.push([t, paddleAt(x)]);
      bounced = true;
    }
    if (bounced) path.push([t, x, y]);
    if (tEnd === null && bricks.every((b) => b.t !== null)) tEnd = t;
    if (tEnd !== null && t >= tEnd + 2.6) break;
  }
  const T = t;
  path.push([T, x, y]);
  paddle.push([T, paddle.at(-1)[1]]);

  const f = (n) => n.toFixed(2);
  const kt = (s) => Math.min(Math.max(s / T, 0), 1).toFixed(4);
  const loop = `dur="${f(T)}s" repeatCount="indefinite"`;

  // ball: exact timing via keyPoints (distance) mapped to keyTimes (time)
  const lens = [0];
  for (let i = 1; i < path.length; i++) lens.push(lens[i - 1] + Math.hypot(path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]));
  const total = lens.at(-1);
  const d = 'M' + path.map(([, px, py]) => `${f(px)} ${f(py)}`).join(' L');
  const ball = `<circle r="${RAD}" fill="#ffffff" filter="url(#glow)"><animateMotion path="${d}" keyPoints="${lens.map((l) => (l / total).toFixed(4)).join(';')}" keyTimes="${path.map(([s]) => kt(s)).join(';')}" calcMode="linear" ${loop}/></circle>`;

  const pad = `<rect x="${-PW / 2}" y="${PY}" width="${PW}" height="8" rx="4" fill="${C.cyan}" filter="url(#glow)"><animateTransform attributeName="transform" type="translate" values="${paddle.map(([, px]) => `${f(px)} 0`).join(';')}" keyTimes="${paddle.map(([s]) => kt(s)).join(';')}" ${loop}/></rect>`;

  // bricks vanish on their hit time and throw a ring of sparks
  const brickSvg = bricks
    .map((b) => {
      const col = ROW_COL[b.r], a = b.t / T, a1 = Math.min(a + 0.003, 0.999), a2 = Math.min(a + 0.55 / T, 0.9995);
      const cx = b.x + BW / 2, cy = b.y + BH / 2;
      const sparks = Array.from({ length: 8 }, (_, i) => {
        const ang = (i / 8) * Math.PI * 2 + 0.3, dist = 24 + (i % 3) * 9;
        return `<circle cx="${f(cx)}" cy="${f(cy)}" r="2.2" fill="${col}" opacity="0"><animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;${a.toFixed(4)};${a1.toFixed(4)};${a2.toFixed(4)};1" ${loop}/><animateTransform attributeName="transform" type="translate" values="0 0;0 0;${f(Math.cos(ang) * dist)} ${f(Math.sin(ang) * dist)};${f(Math.cos(ang) * dist)} ${f(Math.sin(ang) * dist)}" keyTimes="0;${a.toFixed(4)};${a2.toFixed(4)};1" ${loop}/></circle>`;
      }).join('');
      return `<g><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;${a.toFixed(4)};${a1.toFixed(4)};1" ${loop}/>
<rect x="${f(b.x)}" y="${b.y}" width="${f(BW)}" height="${BH}" rx="6" fill="${col}" fill-opacity=".08" stroke="${col}" stroke-width="1.2" filter="url(#glow)"/>
<text x="${f(cx)}" y="${cy + 4}" class="mono" font-size="12" fill="#e6f2ff" text-anchor="middle">${esc(b.name)}</text></g>${sparks}`;
    })
    .join('\n');

  // score ticks up by 10 per brick
  const times = bricks.map((b) => b.t).sort((p, q) => p - q);
  const score = [0, ...times]
    .map((start, k) => {
      const end = times[k];
      const vals = k === 0 ? `values="1;0" keyTimes="0;${kt(end)}"` : end === undefined ? `values="0;1" keyTimes="0;${kt(start)}"` : `values="0;1;0" keyTimes="0;${kt(start)};${kt(end)}"`;
      return `<text x="${W - 28}" y="38" class="mono" font-size="13" fill="${C.cyan}" text-anchor="end" opacity="${k === 0 ? 1 : 0}">score ${String(k * 10).padStart(4, '0')}<animate attributeName="opacity" calcMode="discrete" ${vals} ${loop}/></text>`;
    })
    .join('');

  const cleared = `<text x="${W / 2}" y="290" class="mono" font-size="22" font-weight="700" letter-spacing="4" fill="${C.cyan}" text-anchor="middle" filter="url(#glow)" opacity="0">STACK CLEARED<animate attributeName="opacity" calcMode="discrete" values="0;1" keyTimes="0;${kt(tEnd)}" ${loop}/></text>`;
  const fade = `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;${kt(0.25)};${kt(T - 0.45)};1" ${loop}/>`;

  const body = `
<text x="28" y="38" class="mono" font-size="13" fill="${C.muted}">// breakout.ts · autoplay</text>
${score}
${brickSvg}
${cleared}
<g>${fade}${pad}${ball}</g>`;
  return { svg: card(W, H, `A self-playing neon Breakout game. The bricks are my stack: ${rows.flat().join(', ')}.`, body), T, tEnd };
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
const game = breakout();
writeFileSync(join(OUT, 'breakout.svg'), game.svg);
console.log(`breakout: board cleared at ${game.tEnd.toFixed(1)} s, loops every ${game.T.toFixed(1)} s`);
const langs = await languages();
if (langs) writeFileSync(join(OUT, 'languages.svg'), langs);
else console.log('no token: kept the existing languages.svg');
