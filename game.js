const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const $ = (selector) => document.querySelector(selector);

const party = [
  { name: 'LYRA', role: 'TIDEBOUND', glyph: '✧', hp: 112, maxHp: 112, mp: 28, maxMp: 28, color: '#f2b878' },
  { name: 'KAEL', role: 'ASHEN KNIGHT', glyph: '⚔', hp: 138, maxHp: 138, mp: 22, maxMp: 22, color: '#85b5d8' },
  { name: 'MOSS', role: 'STAR WITCH', glyph: '✦', hp: 96, maxHp: 96, mp: 36, maxMp: 36, color: '#a8d69b' }
];

const enemies = [
  { name: 'TIDE WRAITH', hp: 76, maxHp: 76, type: 'wraith', alive: true },
  { name: 'RIFTLING', hp: 56, maxHp: 56, type: 'rift', alive: true },
  { name: 'RIFTLING', hp: 56, maxHp: 56, type: 'rift', alive: true }
];

let game = {
  started: false,
  over: false,
  won: false,
  active: 0,
  round: 1,
  phase: 'intro',
  sub: null,
  target: 0,
  items: 2,
  combo: 0,
  charge: 0,
  action: null,
  enemySource: '',
  enemyTarget: 0,
  guarding: false,
  log: 'The tide has brought <em>something ancient</em> to shore.',
  shake: 0,
  attackBonus: false,
  aimValue: 0
};

let particles = [];

function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function text(t, x, y, size, color = '#fff', font = 'monospace', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${size}px ${font}`;
  ctx.textAlign = align;
  ctx.fillText(String(t), x, y);
}

function path(points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  points.slice(1).forEach((p) => ctx.lineTo(...p));
  ctx.closePath();
  ctx.fill();
}

function setLog(s) {
  game.log = s;
  $('#logline').innerHTML = s;
}

function aliveParty() {
  return party.map((p, i) => (p.hp > 0 ? i : -1)).filter((i) => i >= 0);
}

function aliveEnemies() {
  return enemies.map((e, i) => (e.alive ? i : -1)).filter((i) => i >= 0);
}

function firstAliveEnemy() {
  return aliveEnemies()[0] ?? 0;
}

function chooseEnemyTarget() {
  const living = aliveParty();
  if (!living.length) return 0;
  return living.reduce((best, next) => (party[next].hp < party[best].hp ? next : best), living[0]);
}

function drawBackground(t) {
  const g = ctx.createLinearGradient(0, 0, 0, 440);
  g.addColorStop(0, '#1b2b40');
  g.addColorStop(0.52, '#596878');
  g.addColorStop(0.7, '#c28b71');
  g.addColorStop(1, '#243b43');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 960, 440);

  for (let i = 0; i < 42; i += 1) {
    const x = (i * 173 + 31) % 960;
    const y = (i * 61 + 18) % 190;
    rect(x, y, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1, i % 4 ? '#d9dfd3' : '#f2ce90');
  }

  ctx.fillStyle = '#ffe0a6';
  ctx.globalAlpha = 0.22;
  ctx.beginPath();
  ctx.arc(722, 121, 68, 0, 6.3);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#f9dca9';
  ctx.beginPath();
  ctx.arc(722, 121, 37, 0, 6.3);
  ctx.fill();
  ctx.fillStyle = '#e7c89c';
  ctx.beginPath();
  ctx.arc(736, 112, 36, 0, 6.3);
  ctx.fill();

  path([[0, 195], [83, 138], [132, 170], [207, 106], [285, 162], [356, 121], [442, 177], [505, 145], [573, 184], [646, 131], [730, 178], [811, 123], [890, 164], [960, 136], [960, 316], [0, 316]], '#354653');
  path([[0, 231], [100, 192], [178, 217], [276, 171], [358, 231], [440, 190], [531, 227], [623, 184], [700, 225], [791, 180], [873, 213], [960, 185], [960, 337], [0, 337]], '#293a43');

  rect(467, 157, 12, 105, '#263944');
  rect(476, 155, 91, 12, '#263944');
  rect(552, 162, 12, 104, '#263944');
  rect(488, 167, 10, 77, '#53636a');
  rect(498, 161, 53, 8, '#53636a');
  rect(544, 170, 8, 66, '#53636a');
  rect(481, 149, 10, 8, '#d7ad72');
  rect(551, 151, 10, 8, '#d7ad72');

  path([[0, 294], [123, 280], [218, 299], [335, 281], [443, 300], [569, 282], [693, 298], [822, 280], [960, 296], [960, 393], [0, 393]], '#263e48');
  for (let i = 0; i < 38; i += 1) {
    const x = (i * 109 + 24) % 960;
    const y = 300 + (i * 29) % 82;
    rect(x, y, 12 + (i % 4) * 4, 1, i % 3 ? '#66817e' : '#d0a47b');
  }

  path([[0, 348], [103, 331], [221, 340], [320, 321], [449, 342], [578, 326], [710, 340], [833, 322], [960, 343], [960, 440], [0, 440]], '#55564e');
  path([[0, 348], [103, 331], [221, 340], [320, 321], [449, 342], [578, 326], [710, 340], [833, 322], [960, 343], [960, 357], [0, 372]], '#9a8066');
  for (let i = 0; i < 90; i += 1) {
    const x = (i * 83 + 11) % 960;
    const y = 365 + (i * 47) % 74;
    rect(x, y, 4 + (i % 4) * 2, 2, ['#746b5c', '#3d5150', '#b18a69', '#56615b'][i % 4]);
  }

  rect(0, 418, 960, 22, '#1d3037');
  rect(82, 355, 2, 14, '#688068');
  rect(88, 350, 3, 12, '#82916f');
  rect(330, 350, 2, 13, '#72846e');
  rect(337, 355, 3, 9, '#94a075');
  rect(911, 349, 3, 12, '#71866b');

  const vg = ctx.createRadialGradient(480, 220, 150, 480, 220, 600);
  vg.addColorStop(0.45, '#0000');
  vg.addColorStop(1, '#07111b99');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, 960, 440);
}

function drawHero(i, x, y, t) {
  const bob = Math.sin(t / 270 + i * 1.7) * 3;
  const dy = y + bob;
  const colors = ['#d9a577', '#83a8bf', '#9ac78f'];
  ctx.save();
  ctx.translate(x, dy);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#101820';
  ctx.beginPath();
  ctx.ellipse(0, 23, 20, 5, 0, 0, 6.3);
  ctx.fill();
  ctx.globalAlpha = 1;

  rect(-10, 8, 8, 12, '#29363e');
  rect(2, 8, 8, 12, '#29363e');
  rect(-12, 18, 11, 4, '#a67f67');
  rect(1, 18, 12, 4, '#a67f67');
  rect(-13, -12, 26, 21, ['#c86d61', '#567e9d', '#546f62'][i]);
  rect(-16, -7, 4, 14, colors[i]);
  rect(12, -7, 5, 14, colors[i]);
  rect(-9, -17, 18, 8, '#e1c59c');
  rect(-8, -27, 16, 13, '#dbad89');
  rect(-9, -30, 18, 7, ['#633e3b', '#453d3c', '#d7d0ac'][i]);
  rect(-11, -25, 4, 9, ['#633e3b', '#453d3c', '#d7d0ac'][i]);
  rect(3, -21, 3, 2, '#17232a');

  if (i === 0) {
    rect(15, -9, 3, 28, '#d9c292');
    rect(13, -11, 7, 5, '#8de1d6');
    rect(16, -14, 2, 3, '#f9d783');
  }
  if (i === 1) {
    rect(14, -21, 4, 35, '#c7d6d3');
    rect(12, -24, 8, 4, '#e2c57f');
    rect(16, -27, 3, 5, '#e2c57f');
  }
  if (i === 2) {
    rect(-18, -16, 3, 35, '#9b795a');
    rect(-21, -20, 9, 7, '#b3d9a0');
    rect(-21, -24, 3, 4, '#f0dd95');
  }

  ctx.restore();
}

function drawEnemy(i, x, y, t) {
  const e = enemies[i];
  if (!e.alive) return;
  const dy = y + Math.sin(t / 230 + i) * 4;
  ctx.save();
  ctx.translate(x, dy);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#101820';
  ctx.beginPath();
  ctx.ellipse(0, 19, 21, 5, 0, 0, 6.3);
  ctx.fill();
  ctx.globalAlpha = 1;

  if (e.type === 'wraith') {
    ctx.fillStyle = '#70dddc';
    ctx.beginPath();
    ctx.moveTo(0, -35);
    ctx.lineTo(18, -16);
    ctx.lineTo(13, 10);
    ctx.lineTo(0, 20);
    ctx.lineTo(-16, 9);
    ctx.lineTo(-20, -14);
    ctx.closePath();
    ctx.fill();
    rect(-13, -19, 26, 17, '#90efdf');
    rect(-10, -27, 20, 10, '#b8f5db');
    rect(-8, -16, 5, 3, '#244450');
    rect(4, -16, 5, 3, '#244450');
    rect(-5, -5, 10, 3, '#37777b');
    rect(-15, 7, 8, 7, '#56bebb');
    rect(8, 7, 8, 7, '#56bebb');
  } else {
    ctx.fillStyle = '#8c7cce';
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(18, -9);
    ctx.lineTo(13, 13);
    ctx.lineTo(-13, 13);
    ctx.lineTo(-18, -9);
    ctx.closePath();
    ctx.fill();
    rect(-13, -16, 26, 21, '#7967ba');
    rect(-10, -22, 20, 9, '#a391e4');
    rect(-8, -12, 5, 3, '#fff0bb');
    rect(4, -12, 5, 3, '#fff0bb');
    rect(-5, -3, 10, 3, '#44356e');
    rect(-17, 1, 7, 7, '#b19bde');
    rect(10, 1, 7, 7, '#b19bde');
  }

  const barW = i === 0 ? 74 : 58;
  rect(-barW / 2, -48, barW, 4, '#10171d');
  rect(-barW / 2, -48, barW * Math.max(0, e.hp / e.maxHp), 4, i === 0 ? '#63dbcf' : '#b89bea');
  ctx.restore();
}

function burst(x, y, color, n = 18) {
  const now = performance.now();
  for (let i = 0; i < n; i += 1) {
    particles.push({
      kind: 'spark',
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 18,
      color,
      born: now,
      life: 450 + Math.random() * 500
    });
  }
}

function drawEffects(t) {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    const age = (t - p.born) / p.life;
    if (age >= 1) {
      particles.splice(i, 1);
      continue;
    }

    const a = 1 - age;
    ctx.globalAlpha = a;
    if (p.kind === 'slash') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 5 * a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 25 + age * 38, p.start, p.start + 2.4);
      ctx.stroke();
      ctx.strokeStyle = '#fff4c4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 27 + age * 38, p.start, p.start + 2.4);
      ctx.stroke();
    } else if (p.kind === 'ring') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 4 * a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12 + age * 64, 0, 6.3);
      ctx.stroke();
    } else if (p.kind === 'bolt') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 4 * a;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.tx, p.ty);
      ctx.stroke();
    } else {
      rect(p.x + Math.sin(age * 20) * 12, p.y - age * 45, 4, 4, p.color);
    }
    ctx.globalAlpha = 1;
  }
}

function drawTiming(t) {
  const p = Math.min(1, (t - game.charge) / 1100);
  const x = 310 + p * 340;
  ctx.fillStyle = '#101923e8';
  ctx.fillRect(270, 272, 420, 75);
  ctx.strokeStyle = '#76847e';
  ctx.strokeRect(270.5, 272.5, 419, 74);
  text(game.action?.label === 'Starfall' ? 'STARFALL · RELEASE ON THE GOLD' : 'STRIKE · RELEASE ON THE GOLD', 480, 292, 10, '#f3d48f', 'monospace', 'center');
  rect(310, 308, 340, 12, '#27353b');
  rect(310 + 340 * 0.61, 308, 340 * 0.14, 12, '#e7b961');
  rect(x - 3, 302, 6, 24, '#f7f0d8');
  text('SPACE / ENTER', 480, 338, 9, '#aab7b4', 'monospace', 'center');
}

function drawGuard(t) {
  const p = Math.min(1, (t - game.charge) / 1050);
  const x = 310 + p * 340;
  ctx.fillStyle = '#101923ed';
  ctx.fillRect(270, 272, 420, 75);
  ctx.strokeStyle = '#74877e';
  ctx.strokeRect(270.5, 272.5, 419, 74);
  text(`${game.enemySource || 'ENEMY'} · PARRY THE BLOW`, 480, 292, 10, '#f3d48f', 'monospace', 'center');
  rect(310, 308, 340, 12, '#27353b');
  rect(310 + 340 * 0.36, 308, 340 * 0.2, 12, '#67c9a8');
  rect(x - 3, 302, 6, 24, '#f7f0d8');
  text('SPACE / ENTER', 480, 338, 9, '#aab7b4', 'monospace', 'center');
}

function drawScene(t) {
  if (game.shake > 0) game.shake *= 0.84;

  ctx.save();
  ctx.translate(game.shake > 0 ? (Math.random() - 0.5) * game.shake : 0, 0);
  drawBackground(t);

  for (const x of [214, 275, 336, 654, 790, 886]) {
    const g = ctx.createRadialGradient(x, 345, 1, x, 345, 47);
    g.addColorStop(0, '#f5cb8760');
    g.addColorStop(1, '#f5cb8700');
    ctx.fillStyle = g;
    ctx.fillRect(x - 48, 298, 96, 75);
  }

  drawEffects(t);
  enemies.forEach((enemy, i) => drawEnemy(i, [658, 790, 886][i], [320, 330, 322][i], t));
  party.forEach((p, i) => {
    if (p.hp > 0) drawHero(i, [207, 270, 333][i], [334, 342, 334][i], t); 
  });

  if (game.started && !game.over && game.phase === 'command' && game.sub === 'target' && enemies[game.target]?.alive) {
    text('▼', [658, 790, 886][game.target], 250, 15, '#f3d37e', 'monospace', 'center');
  }
  if (game.phase === 'timing' && game.started) drawTiming(t);
  if (game.phase === 'guard' && game.started) drawGuard(t);

  if (!game.started || game.over) {
    ctx.fillStyle = '#1019239c';
    ctx.fillRect(0, 0, 960, 440);
    ctx.fillStyle = '#172630ed';
    ctx.fillRect(260, 104, 440, 230);
    ctx.strokeStyle = '#c19f6c';
    ctx.lineWidth = 1;
    ctx.strokeRect(260.5, 104.5, 439, 229);
    text(!game.started ? 'A TIDE OUT OF TIME' : game.won ? 'THE HOUR HOLDS' : 'THE TIDE TAKES ALL', 480, 153, 13, '#f2cf89', 'monospace', 'center');

    if (!game.started) {
      text('A broken clock. A shore that remembers.', 480, 190, 17, '#f0e9d9', 'Georgia', 'center');
      text('Three wanderers. One last chance to turn the tide.', 480, 217, 12, '#b7c5c6', 'monospace', 'center');
      text('TAKE YOUR STAND', 480, 281, 11, '#8ce2d2', 'monospace', 'center');
      text('Press ENTER or click to begin', 480, 305, 10, '#8b9b9f', 'monospace', 'center');
    } else {
      text(game.won ? 'The Meridian stirs beneath the waves.' : 'The shore falls silent once more.', 480, 193, 15, '#f0e9d9', 'Georgia', 'center');
      text(game.won ? 'A new path opens beyond the broken clock.' : 'The tide will wait. Your story need not end here.', 480, 220, 11, '#b7c5c6', 'monospace', 'center');
      text('PLAY AGAIN', 480, 280, 11, '#8ce2d2', 'monospace', 'center');
      text('Press ENTER to begin again', 480, 305, 10, '#8b9b9f', 'monospace', 'center');
    }
  }

  ctx.restore();
}

function renderParty() {
  const node = $('#party');
  node.innerHTML = party.map((p, i) => {
    const pct = Math.max(0, (p.hp / p.maxHp) * 100);
    const mp = Math.max(0, (p.mp / p.maxMp) * 100);
    return `
      <article class="hero-card ${p.hp <= 0 ? 'down' : ''} ${game.started && !game.over && i === game.active && game.phase === 'command' ? 'active' : ''}">
        ${game.started && i === game.active && game.phase === 'command' ? '<span class="ready">YOUR TURN</span>' : ''}
        <div class="hero-top">
          <div class="portrait" style="color:${p.color}">${p.glyph}</div>
          <div>
            <div class="hero-name">${p.name}</div>
            <div class="hero-role">${p.role}</div>
          </div>
        </div>
        <div class="hp-row"><span>HP</span><b>${p.hp} / ${p.maxHp}</b></div>
        <div class="bar"><i style="width:${pct}%;${pct < 30 ? 'background:linear-gradient(90deg,#d65c54,#f28c70)' : ''}"></i></div>
        <div class="mp-row"><span>MP ${p.mp}/${p.maxMp}</span><div class="mp-bar"><i style="width:${mp}%"></i></div></div>
      </article>
    `;
  }).join('');

  $('#partyStatus').textContent = `${party.filter((p) => p.hp > 0).length} SOULS · ONE FATE`;
  $('#activeName').textContent = game.started && !game.over && game.phase === 'command'
    ? `${party[game.active].name} · ${party[game.active].role}`
    : game.started && !game.over
      ? 'BATTLE IN MOTION'
      : 'AWAITING THE HOUR';

  $('#turnLabel').innerHTML = game.started && !game.over
    ? `TURN ${game.round}<strong>${game.phase === 'command' ? 'YOUR MOVE' : 'THE TIDE TURNS'}</strong>`
    : game.won
      ? 'THE HOUR HOLDS<strong>—</strong>'
      : 'THE HOUR IS FADING<strong>—</strong>';

  $('#footerStatus').textContent = game.started && !game.over
    ? (game.phase === 'command' ? 'CHOOSE YOUR ACTION' : 'FATE IN MOTION')
    : 'READY WHEN YOU ARE';
}

function renderCommands() {
  const b = $('#commandBody');
  if (!game.started || game.over) {
    b.innerHTML = '';
    return;
  }

  if (game.phase === 'timing') {
    b.innerHTML = '<div class="subpanel"><button class="subbtn" id="tapBtn">✦ &nbsp;TIME YOUR STRIKE<small>PRESS SPACE WHEN THE MARKER HITS GOLD</small></button></div>';
    $('#tapBtn').onclick = confirmAction;
    return;
  }

  if (game.phase === 'guard') {
    b.innerHTML = '<div class="subpanel"><button class="subbtn" id="tapBtn">◈ &nbsp;PARRY THE BLOW<small>PRESS SPACE WHEN THE MARKER HITS MINT</small></button></div>';
    $('#tapBtn').onclick = confirmAction;
    return;
  }

  const p = party[game.active];

  if (game.sub === 'skills') {
    b.innerHTML = `
      <div class="subpanel">
        <button class="subbtn" data-skill="Tidal Cut" ${p.mp < 5 ? 'disabled' : ''}>〰 &nbsp;Tidal Cut <small>5 MP · single target · 31 dmg</small></button>
        <button class="subbtn" data-skill="Starfall" ${p.mp < 9 ? 'disabled' : ''}>✦ &nbsp;Starfall <small>9 MP · all foes · 22 dmg</small></button>
        <button class="back" id="back">← &nbsp;BACK TO COMMANDS</button>
      </div>
    `;
    b.querySelectorAll('[data-skill]').forEach((btn) => {
      btn.onclick = () => chooseSkill(btn.dataset.skill);
    });
    $('#back').onclick = () => {
      game.sub = null;
      renderCommands();
    };
    return;
  }

  if (game.sub === 'target') {
    b.innerHTML = `
      <div class="subpanel">
        <button class="subbtn" data-target="0" ${!enemies[0].alive ? 'disabled' : ''}>◉ &nbsp;Tide Wraith <small>${enemies[0].alive ? enemies[0].hp + ' / 76 HP' : 'DEFEATED'}</small></button>
        <button class="subbtn" data-target="1" ${!enemies[1].alive ? 'disabled' : ''}>◉ &nbsp;Riftling I <small>${enemies[1].alive ? enemies[1].hp + ' / 56 HP' : 'DEFEATED'}</small></button>
        <button class="subbtn" data-target="2" ${!enemies[2].alive ? 'disabled' : ''}>◉ &nbsp;Riftling II <small>${enemies[2].alive ? enemies[2].hp + ' / 56 HP' : 'DEFEATED'}</small></button>
        <button class="back" id="back">← &nbsp;BACK</button>
      </div>
    `;
    b.querySelectorAll('[data-target]').forEach((btn) => {
      btn.onclick = () => {
        game.target = Number(btn.dataset.target);
        beginAttack();
      };
    });
    $('#back').onclick = () => {
      game.sub = null;
      game.action = null;
      renderCommands();
    };
    return;
  }

  if (game.sub === 'items') {
    b.innerHTML = `
      <div class="subpanel">
        <button class="subbtn" data-item="potion" ${game.items <= 0 ? 'disabled' : ''}>✚ &nbsp;Moon Tonic <small>HEAL 24 HP · ${game.items} left</small></button>
        <button class="subbtn" data-item="focus" ${p.mp >= p.maxMp ? 'disabled' : ''}>✦ &nbsp;Refrain <small>RESTORE 8 MP</small></button>
        <button class="back" id="back">← &nbsp;BACK</button>
      </div>
    `;
    b.querySelectorAll('[data-item]').forEach((btn) => {
      btn.onclick = () => useItem(btn.dataset.item);
    });
    $('#back').onclick = () => {
      game.sub = null;
      renderCommands();
    };
    return;
  }

  b.innerHTML = `
    <div class="command-grid">
      <button class="cmd" data-action="attack">⚔ &nbsp;Attack <kbd>1</kbd></button>
      <button class="cmd" data-action="skills">✦ &nbsp;Skills <kbd>2</kbd></button>
      <button class="cmd" data-action="item">✚ &nbsp;Item <kbd>3</kbd></button>
      <button class="cmd" data-action="guard">⛨ &nbsp;Guard <kbd>4</kbd></button>
    </div>
  `;

  b.querySelectorAll('[data-action]').forEach((btn) => {
    btn.onclick = () => handleCommand(btn.dataset.action);
  });
}

function handleCommand(action) {
  const current = party[game.active];
  if (!current || current.hp <= 0) return;

  if (action === 'attack') {
    game.action = { type: 'attack', label: 'Attack', damage: 21, kind: 'single' };
    game.sub = 'target';
    game.target = firstAliveEnemy();
    renderCommands();
    return;
  }

  if (action === 'skills') {
    game.sub = 'skills';
    renderCommands();
    return;
  }

  if (action === 'item') {
    game.sub = 'items';
    renderCommands();
    return;
  }

  if (action === 'guard') {
    setLog(`${current.name} takes a breath and braces for the next blow.`);
    game.guarding = true;
    game.action = { type: 'guard', label: 'Guard', damage: 0, kind: 'guard' };
    window.setTimeout(() => {
      if (game.started && !game.over) {
        enemyTurn();
      }
    }, 350);
  }
}

function chooseSkill(name) {
  const current = party[game.active];
  if (!current) return;

  if (name === 'Starfall') {
    if (current.mp < 9) return;
    current.mp -= 9;
    game.action = { type: 'skill', label: 'Starfall', damage: 22, kind: 'all', cost: 9 };
    beginAttack();
    renderParty();
    return;
  }

  if (name === 'Tidal Cut') {
    if (current.mp < 5) return;
    current.mp -= 5;
    game.action = { type: 'skill', label: 'Tidal Cut', damage: 31, kind: 'single', cost: 5 };
    game.sub = 'target';
    game.target = firstAliveEnemy();
    renderCommands();
    renderParty();
  }
}

function useItem(kind) {
  const current = party[game.active];
  if (!current) return;

  if (kind === 'potion') {
    if (game.items <= 0) return;
    const heal = 24;
    current.hp = Math.min(current.maxHp, current.hp + heal);
    game.items -= 1;
    setLog(`${current.name} drinks a Moon Tonic and recovers ${heal} HP.`);
    renderParty();
    game.sub = null;
    renderCommands();
    window.setTimeout(() => {
      if (game.started && !game.over) enemyTurn();
    }, 500);
    return;
  }

  if (kind === 'focus') {
    if (current.mp >= current.maxMp) return;
    const restore = Math.min(8, current.maxMp - current.mp);
    current.mp += restore;
    setLog(`${current.name} settles their breath and restores ${restore} MP.`);
    renderParty();
    game.sub = null;
    renderCommands();
    window.setTimeout(() => {
      if (game.started && !game.over) enemyTurn();
    }, 500);
  }
}

function beginAttack() {
  game.phase = 'timing';
  game.sub = null;
  game.charge = performance.now();
  game.attackBonus = false;
  setLog(`${party[game.active].name} steadies their stance. <em>Find the golden moment.</em>`);
  renderParty();
  renderCommands();
}

function confirmAction() {
  if (game.phase === 'timing') {
    const elapsed = performance.now() - game.charge;
    const ratio = Math.min(1, elapsed / 1100);
    game.attackBonus = ratio >= 0.61 && ratio <= 0.75;
    resolvePlayerAttack();
    return;
  }

  if (game.phase === 'guard') {
    const elapsed = performance.now() - game.charge;
    const ratio = Math.min(1, elapsed / 1050);
    resolveEnemyGuard(ratio >= 0.36 && ratio <= 0.52);
  }
}

function resolvePlayerAttack() {
  const actor = party[game.active];
  const act = game.action;
  if (!actor || !act) return;

  let hits = [];
  let boost = game.attackBonus ? 1.7 : 1;

  if (act.kind === 'all') {
    enemies.forEach((enemy, idx) => {
      if (!enemy.alive) return;
      const damage = Math.round(act.damage * boost);
      enemy.hp = Math.max(0, enemy.hp - damage);
      if (enemy.hp <= 0) enemy.alive = false;
      hits.push(idx);
    });
  } else {
    const enemy = enemies[game.target];
    if (enemy && enemy.alive) {
      const damage = Math.round((act.type === 'attack' ? 21 : act.damage) * boost);
      enemy.hp = Math.max(0, enemy.hp - damage);
      if (enemy.hp <= 0) enemy.alive = false;
      hits.push(game.target);
    }
  }

  if (act.label === 'Starfall') {
    setLog(`${actor.name} calls <em>Starfall</em> from the dark between hours!`);
    hits.forEach((idx) => {
      particles.push({ kind: 'bolt', x: 200 + Math.random() * 130, y: 92, tx: [658, 790, 886][idx], ty: 310, color: '#b4a1f2', born: performance.now(), life: 550 });
      window.setTimeout(() => burst([658, 790, 886][idx], 315, '#b4a1f2', 22), 250);
    });
  } else if (act.label === 'Tidal Cut') {
    const hitIndex = hits[0] ?? game.target;
    const x = [658, 790, 886][hitIndex];
    setLog(`${actor.name} unleashes <em>Tidal Cut</em>!`);
    particles.push({ kind: 'slash', x, y: 313, color: '#67ead9', start: -2.7, born: performance.now(), life: 500 });
    burst(x, 315, game.attackBonus ? '#ffe39c' : '#d9ece2', 12);
    game.shake = game.attackBonus ? 8 : 4;
  } else {
    const hitIndex = hits[0] ?? game.target;
    const x = [658, 790, 886][hitIndex];
    setLog(`${actor.name} strikes for <em>${game.attackBonus ? 'perfect ' : ''}impact</em>!`);
    particles.push({ kind: 'slash', x, y: 313, color: game.attackBonus ? '#ffe39c' : '#d8e2dd', start: -2.6, born: performance.now(), life: 380 });
    burst(x, 315, game.attackBonus ? '#ffe39c' : '#d9ece2', 12);
    game.shake = game.attackBonus ? 8 : 4;
  }

  if (game.attackBonus) {
    game.combo = Math.min(100, game.combo + 18);
    setLog(`${actor.name} lands a <em>perfect strike!</em> The tide surges.`);
  }

  game.action = null;
  game.phase = 'command';
  renderCommands();
  renderParty();

  if (aliveEnemies().length === 0) {
    winGame();
    return;
  }

  if (game.started && !game.over) {
    window.setTimeout(() => enemyTurn(), 550);
  }
}

function enemyTurn() {
  const living = aliveEnemies();
  if (!living.length || !game.started || game.over) return;

  const foeIndex = living[Math.floor(Math.random() * living.length)];
  const foe = enemies[foeIndex];
  const victim = chooseEnemyTarget();
  const target = party[victim];
  const damage = foe.type === 'wraith' ? 14 + Math.random() * 10 : 11 + Math.random() * 8;

  game.enemySource = foe.name;
  game.enemyTarget = victim;
  game.phase = 'guard';
  game.charge = performance.now();
  game.action = { kind: 'enemy', label: foe.name, target: victim, damage };
  setLog(`${foe.name} lashes out at ${target.name}! <em>Brace for impact.</em>`);
  renderParty();
  renderCommands();
}

function resolveEnemyGuard(parried) {
  const action = game.action;
  if (!action || action.kind !== 'enemy') return;

  const target = party[action.target];
  if (!target) return;

  const damage = Math.round(action.damage);
  if (parried) {
    const reduced = Math.max(1, Math.round(damage * 0.35));
    target.hp = Math.max(0, target.hp - reduced);
    setLog(`${target.name} catches the arc and <em>parries</em> the blow for ${reduced} damage.`);
  } else {
    target.hp = Math.max(0, target.hp - damage);
    setLog(`${target.name} is struck by ${action.label} for ${damage} damage.`);
  }

  game.action = null;
  game.phase = 'command';
  renderParty();
  renderCommands();

  if (aliveParty().length === 0) {
    loseGame();
    return;
  }

  const nextIndex = findNextLivingHero(game.active + 1);
  if (nextIndex === null) {
    loseGame();
    return;
  }

  if (!game.over) {
    game.active = nextIndex;
    game.round += 1;
    setLog(`${party[game.active].name} steps in. <em>Choose your next move.</em>`);
    renderParty();
    renderCommands();
  }
}

function findNextLivingHero(start = 0) {
  for (let i = 0; i < party.length; i += 1) {
    const idx = (start + i) % party.length;
    if (party[idx].hp > 0) return idx;
  }
  return null;
}

function winGame() {
  game.over = true;
  game.won = true;
  game.phase = 'intro';
  setLog('The Meridian breaks free and the tide bends to your will.');
  renderCommands();
  renderParty();
}

function loseGame() {
  game.over = true;
  game.won = false;
  game.phase = 'intro';
  setLog('The tide closes in. The hour is lost.');
  renderCommands();
  renderParty();
}

function startGame() {
  party.forEach((p, i) => {
    p.hp = p.maxHp;
    p.mp = p.maxMp;
    p.name = ['LYRA', 'KAEL', 'MOSS'][i];
  });

  enemies.forEach((enemy, i) => {
    enemy.hp = enemy.maxHp;
    enemy.alive = true;
    if (i > 0) enemy.name = 'RIFTLING';
  });

  game.started = true;
  game.over = false;
  game.won = false;
  game.active = 0;
  game.round = 1;
  game.phase = 'command';
  game.sub = null;
  game.target = 0;
  game.items = 2;
  game.combo = 0;
  game.action = null;
  game.enemySource = '';
  game.enemyTarget = 0;
  game.shake = 0;
  particles.length = 0;
  setLog('The shore whispers. <em>Rise and take the hour.</em>');
  renderParty();
  renderCommands();
}

function handleInput(e) {
  if (!game.started && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    startGame();
    return;
  }

  if (game.over && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    startGame();
    return;
  }

  if (game.phase === 'timing' || game.phase === 'guard') {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      confirmAction();
    }
    return;
  }

  if (!game.started || game.over) return;

  if (['1', '2', '3', '4'].includes(e.key)) {
    e.preventDefault();
    const actions = ['attack', 'skills', 'item', 'guard'];
    handleCommand(actions[Number(e.key) - 1]);
  }

  if (e.key === 'Escape' && game.sub) {
    e.preventDefault();
    game.sub = null;
    renderCommands();
  }
}

document.addEventListener('keydown', handleInput);
canvas.addEventListener('click', () => {
  if (!game.started || game.over) {
    startGame();
    return;
  }
  if (game.phase === 'timing' || game.phase === 'guard') {
    confirmAction();
  }
});

function loop(ts) {
  drawScene(ts);
  requestAnimationFrame(loop);
}

renderParty();
renderCommands();
setLog(game.log);
requestAnimationFrame(loop);
