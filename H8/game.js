const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const intro = document.querySelector("#intro");
const startButton = document.querySelector("#startButton");
const playerHpEl = document.querySelector("#playerHp");
const bossHpEl = document.querySelector("#bossHp");
const stageNameEl = document.querySelector("#stageName");

const W = canvas.width;
const H = canvas.height;
const GROUND = 454;
const WORLD_W = 4300;
const GRAVITY = 0.62;
const keys = { left: false, right: false, jump: false, attack: false, power: false };

const heroSheet = new Image();
heroSheet.src = "assets/hero-core-spritesheet.png";

const FRAME_W = 192;
const FRAME_H = 128;
const ANIMS = {
  idle: { row: 0, frames: 6, fps: 5 },
  run: { row: 1, frames: 6, fps: 12 },
  attack: { row: 2, frames: 6, fps: 18 },
  hit: { row: 3, frames: 6, fps: 11 },
  victory: { row: 4, frames: 6, fps: 7 },
  death: { row: 5, frames: 6, fps: 4 }
};

const level = {
  name: "Дом Синих Листьев",
  bossX: 3820,
  prepStart: 3150,
  prepEnd: 3600,
  platforms: [
    { x: 1120, y: 384, w: 210, h: 14 },
    { x: 1488, y: 398, w: 150, h: 14 },
    { x: 1660, y: 356, w: 260, h: 14 },
    { x: 2190, y: 292, w: 230, h: 14 },
    { x: 2700, y: 360, w: 220, h: 14 },
    { x: 3280, y: 342, w: 130, h: 14 },
    { x: 3480, y: 300, w: 130, h: 14 }
  ]
};

const enemyPlan = [
  { id: "rookie", name: "Mask 11", number: "11", color: "#f0efe4", stripe: "#1c1c20", x: 980, floorY: GROUND, hp: 28, damage: 5, passive: true, back: true, w: 58, h: 58, drop: "heal" },
  { id: "blade-a", name: "Blade 5", number: "5", color: "#e8a13c", stripe: "#1b1510", x: 1245, floorY: 384, hp: 40, damage: 8, w: 66, h: 66, drop: "shield" },
  { id: "mask-b", name: "Mask 11", number: "11", color: "#f0efe4", stripe: "#1c1c20", x: 1800, floorY: 356, hp: 46, damage: 8, w: 62, h: 62, drop: "focus" },
  { id: "twin", name: "Twin 22", number: "22", color: "#1c2636", stripe: "#f2efe1", x: 2310, floorY: 292, hp: 58, damage: 10, w: 78, h: 54, twin: true, drop: "shield" },
  { id: "blade-b", name: "Blade 5", number: "5", color: "#e8a13c", stripe: "#1b1510", x: 2805, floorY: 360, hp: 70, damage: 11, w: 72, h: 72, drop: "focus" }
];

const bossTemplate = { name: "Crazy 88", number: "88", color: "#16161a", stripe: "#d73831", hp: 360, maxHp: 360, damage: 18 };
const melody = [
  0.50, 0.88, 1.26, 1.64, 2.12, 2.50, 2.88, 3.26,
  3.74, 4.02, 4.30, 4.78, 5.16, 5.54, 5.92, 6.40,
  6.78, 7.16, 7.54, 8.02, 8.30, 8.58, 9.06, 9.44,
  9.82, 10.20, 10.68, 11.06, 11.44, 11.82, 12.30, 12.58,
  12.86, 13.34, 13.72, 14.10, 14.48, 14.96, 15.34, 15.72,
  16.10, 16.58, 16.86, 17.14, 17.62, 18.00, 18.38, 18.76
];
const melodyPitches = [220, 277, 330, 370, 440, 370, 330, 277];
const BOSS_TEMPO = 1.32;

const player = {
  x: 90,
  y: GROUND - 76,
  w: 58,
  h: 76,
  vx: 0,
  vy: 0,
  hp: 100,
  facing: 1,
  grounded: false,
  invuln: 0,
  attack: 0,
  defeated: 0,
  power: { heal: 0, shield: 0, focus: 0 },
  shieldTime: 0,
  focusTime: 0
};

let enemies = [];
let boss = { ...bossTemplate };
let powerups = [];
let particles = [];
let cameraX = 0;
let started = false;
let state = "play";
let last = 0;
let message = "";
let messageTimer = 0;
let bossFight = null;
let audioCtx = null;
let nextPickupId = 0;

function resetGame() {
  enemies = enemyPlan.map((enemy, index) => ({
    ...enemy,
    maxHp: enemy.hp,
    homeFloorY: enemy.floorY,
    dead: false,
    cooldown: 0,
    hitFlash: 0,
    descend: false,
    phase: index * 1.7
  }));
  boss = { ...bossTemplate };
  powerups = [];
  particles = [];
  Object.assign(player, {
    x: 90,
    y: GROUND - 76,
    vx: 0,
    vy: 0,
    hp: 100,
    facing: 1,
    grounded: false,
    invuln: 0,
    attack: 0,
    defeated: 0,
    power: { heal: 0, shield: 0, focus: 0 },
    shieldTime: 0,
    focusTime: 0
  });
  state = "play";
  bossFight = null;
  cameraX = 0;
  message = "Первые шаги безопасны. Освой движение и прыжок.";
  messageTimer = 3;
  updateHud();
}

function makePickup(type, x, y) {
  nextPickupId += 1;
  return { id: nextPickupId, type, x, y, taken: false, t: 0 };
}

function updateHud() {
  playerHpEl.textContent = Math.max(0, Math.ceil(player.hp));
  bossHpEl.textContent = state === "boss" ? Math.max(0, Math.ceil(boss.hp)) : `${player.defeated}/5`;
  stageNameEl.textContent = level.name;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function screenX(worldX) {
  return worldX - cameraX;
}

function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function beep(freq, duration = 0.07, type = "square", volume = 0.04) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.stop(audioCtx.currentTime + duration);
}

function jumpSound() {
  beep(340, 0.045, "square", 0.035);
  setTimeout(() => beep(520, 0.055, "triangle", 0.025), 35);
}

function attackSound() {
  beep(140, 0.04, "sawtooth", 0.035);
  setTimeout(() => beep(95, 0.05, "square", 0.025), 30);
}

function pickupSound() {
  beep(580, 0.05, "triangle", 0.04);
  setTimeout(() => beep(880, 0.06, "square", 0.03), 55);
}

function powerSound(type) {
  const freq = type === "heal" ? 640 : type === "shield" ? 430 : 780;
  beep(freq, 0.08, type === "focus" ? "sine" : "triangle", 0.05);
  setTimeout(() => beep(freq * 1.25, 0.06, "square", 0.025), 70);
}

function spawnDust(x, y, direction) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: x - direction * (10 + Math.random() * 12),
      y: y + Math.random() * 5,
      vx: -direction * (0.2 + Math.random() * 1.1),
      vy: -0.2 - Math.random() * 0.7,
      life: 0.2 + Math.random() * 0.16,
      color: Math.random() > 0.5 ? "#85775f" : "#5d5449",
      size: 3 + Math.random() * 3
    });
  }
}

function spawnHit(x, y, color) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: -1 - Math.random() * 4,
      life: 0.35 + Math.random() * 0.25,
      color,
      size: 3 + Math.random() * 4
    });
  }
}

function damagePlayer(amount) {
  if (player.invuln > 0 || player.shieldTime > 0) return;
  player.hp -= amount;
  player.invuln = 0.85;
  player.vx = -player.facing * 5;
  player.vy = -6;
  spawnHit(player.x + player.w / 2, player.y + 32, "#dd3d33");
  if (player.hp <= 0) {
    state = "dead";
    message = "Ты проиграл";
    messageTimer = 999;
  }
}

function usePower() {
  ensureAudio();
  if (state === "dead" || state === "win") {
    resetGame();
    return;
  }
  if (player.power.heal > 0 && player.hp <= 68) {
    player.power.heal -= 1;
    player.hp = Math.min(100, player.hp + 32);
    message = "Усиление: здоровье";
    messageTimer = 1.2;
    powerSound("heal");
    return;
  }
  if (player.power.shield > 0) {
    player.power.shield -= 1;
    player.shieldTime = 3.2;
    message = "Усиление: щит";
    messageTimer = 1.2;
    powerSound("shield");
    return;
  }
  if (player.power.focus > 0) {
    player.power.focus -= 1;
    player.focusTime = 4.2;
    message = "Усиление: фокус";
    messageTimer = 1.2;
    powerSound("focus");
  }
}

function attack() {
  ensureAudio();
  if (state === "dead" || state === "win") {
    resetGame();
    return;
  }
  if (state === "boss") {
    hitBossNote();
    return;
  }
  if (player.attack > 0) return;
  player.attack = 0.34;
  attackSound();
  const tongue = player.facing > 0
    ? { x: player.x + 34, y: player.y + 34, w: 112, h: 18 }
    : { x: player.x - 88, y: player.y + 34, w: 112, h: 18 };
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    if (overlap(tongue, enemyHitbox(enemy))) {
      enemy.hp -= enemy.passive ? enemy.maxHp : 24;
      enemy.hitFlash = 0.18;
      spawnHit(enemy.x, GROUND - 50, "#f8e47a");
      if (enemy.hp <= 0) {
        enemy.dead = true;
        player.defeated += 1;
        if (enemy.drop) powerups.push(makePickup(enemy.drop, enemy.x, enemy.floorY - 34));
        message = enemy.passive ? "Первый устранён. Дальше будут отвечать." : `${enemy.name} выбит`;
        messageTimer = 1.6;
      }
      updateHud();
      return;
    }
  }
}

function enemyHitbox(enemy) {
  const w = enemy.hitW || enemy.w * 0.78;
  const h = enemy.hitH || enemy.h * 0.78;
  return { x: enemy.x - w / 2, y: enemy.floorY - h, w, h };
}

function pickupBox(pickup) {
  return { x: pickup.x - 15, y: pickup.y - 15, w: 30, h: 30 };
}

function collect(pickup) {
  pickup.taken = true;
  player.power[pickup.type] += 1;
  const names = { heal: "здоровье", shield: "щит", focus: "фокус" };
  message = `Подобрано: ${names[pickup.type]}`;
  messageTimer = 1.2;
  pickupSound();
  spawnHit(pickup.x, pickup.y, "#f8e47a");
}

function startBossFight() {
  state = "boss";
  boss.hp = boss.maxHp;
  bossFight = {
    time: 0,
    nextNote: 0,
    notes: [],
    combo: 0,
    message: "Слушай мелодию",
    missFlash: 0
  };
  cameraX = level.bossX - 520;
  message = "Босс: попадай в мелодию";
  messageTimer = 2;
}

function hitBossNote() {
  if (!bossFight) return;
  player.attack = 0.34;
  const hitLine = 185;
  let best = null;
  let bestDist = Infinity;
  for (const note of bossFight.notes) {
    const dist = Math.abs(note.x - hitLine);
    if (dist < bestDist) {
      best = note;
      bestDist = dist;
    }
  }
  const window = player.focusTime > 0 ? 38 : 22;
  if (!best || bestDist > window) {
    bossFight.combo = 0;
    bossFight.message = "Мимо";
    return;
  }
  bossFight.notes = bossFight.notes.filter((note) => note !== best);
  const perfect = bestDist < (player.focusTime > 0 ? 14 : 8);
  const damage = perfect ? 11 + bossFight.combo * 0.35 : 6 + bossFight.combo * 0.18;
  boss.hp -= damage;
  bossFight.combo += 1;
  bossFight.message = perfect ? "Идеально" : "Попал";
  spawnHit(level.bossX, GROUND - 72, perfect ? "#f8e47a" : "#f4efe0");
  beep(perfect ? 880 : 660, 0.07, "square", 0.035);
  if (boss.hp <= 0) state = "win";
}

function missBossNote() {
  if (!bossFight) return;
  bossFight.combo = 0;
  bossFight.message = "Пропуск";
  bossFight.missFlash = 0.25;
  if (player.shieldTime <= 0) damagePlayer(boss.damage);
  else beep(300, 0.05, "triangle", 0.04);
}

function updatePlay(dt) {
  const prevGrounded = player.grounded;
  const speed = 4.2;
  const prevX = player.x;
  const prevY = player.y;
  player.vx *= 0.82;
  if (keys.left) {
    player.vx = -speed;
    player.facing = -1;
  }
  if (keys.right) {
    player.vx = speed;
    player.facing = 1;
  }
  if (keys.jump && player.grounded) {
    player.vy = -12.6;
    player.grounded = false;
    jumpSound();
  }
  player.vy += GRAVITY;
  player.x = clamp(player.x + player.vx, 30, WORLD_W - 120);
  player.y += player.vy;
  player.grounded = false;
  for (const platform of level.platforms) {
    const falling = player.vy >= 0;
    const crossed = prevY + player.h <= platform.y && player.y + player.h >= platform.y;
    const horizontal = player.x + player.w > platform.x && player.x < platform.x + platform.w;
    if (falling && crossed && horizontal) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.grounded = true;
    }
  }
  if (player.y + player.h >= GROUND) {
    player.y = GROUND - player.h;
    player.vy = 0;
    player.grounded = true;
  }
  if (!prevGrounded && player.grounded) spawnDust(player.x + player.w / 2, GROUND - 5, player.facing);
  if (Math.abs(player.x - prevX) > 0.5 && player.grounded && Math.abs(player.vx) > 3.8 && Math.random() < 0.08) {
    spawnDust(player.x + player.w / 2, GROUND - 5, player.facing);
  }

  for (const enemy of enemies) updateEnemy(enemy, dt);
  for (const pickup of powerups) {
    pickup.t += dt;
    if (!pickup.taken && overlap(player, pickupBox(pickup))) collect(pickup);
  }

  if (player.x > level.prepStart && player.defeated >= 5 && messageTimer <= 0) {
    message = "Зона подготовки: используй выпавшие усиления перед боссом";
    messageTimer = 2.2;
  }
  if (player.x > level.bossX - 120 && player.defeated >= 5) startBossFight();

  cameraX = clamp(player.x - 250, 0, WORLD_W - W);
}

function updateEnemy(enemy, dt) {
  if (enemy.dead) return;
  enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
  if (enemy.passive) return;
  const heroBelow = player.y + player.h > enemy.floorY + 20;
  if (enemy.floorY < GROUND && Math.abs(player.x - enemy.x) < 240 && heroBelow) {
    enemy.descend = true;
  }
  if (enemy.descend) {
    enemy.floorY = Math.min(GROUND, enemy.floorY + 125 * dt);
  }
  const hb = enemyHitbox(enemy);
  const playerBox = { x: player.x + 8, y: player.y + 8, w: player.w - 16, h: player.h - 12 };
  const near = Math.abs(player.x - enemy.x) < 220;
  if (near && player.x < enemy.x) {
    const platform = level.platforms.find((item) => Math.abs(item.y - enemy.floorY) < 2);
    const nextX = enemy.x - (0.55 + player.defeated * 0.05);
    if (enemy.descend || !platform || (nextX > platform.x + enemy.w / 2 && nextX < platform.x + platform.w - enemy.w / 2)) {
      enemy.x = nextX;
    }
  }
  if (overlap(playerBox, hb)) damagePlayer(enemy.damage);
}

function updateBoss(dt) {
  if (!bossFight) return;
  bossFight.time += dt;
  const hitLine = 185;
  const noteSpeed = 245;
  const lookAhead = (W + 30 - hitLine) / noteSpeed;
  while (bossFight.nextNote < melody.length && melody[bossFight.nextNote] * BOSS_TEMPO < bossFight.time + lookAhead) {
    const t = melody[bossFight.nextNote] * BOSS_TEMPO;
    bossFight.notes.push({
      beat: t,
      played: false,
      pitch: melodyPitches[bossFight.nextNote % melodyPitches.length],
      x: hitLine + (t - bossFight.time) * noteSpeed
    });
    bossFight.nextNote += 1;
  }
  for (const note of bossFight.notes) {
    note.x -= noteSpeed * dt;
    if (!note.played && note.x <= hitLine) {
      note.played = true;
      beep(note.pitch, 0.055, "square", 0.025);
    }
  }
  const missed = bossFight.notes.filter((note) => note.x < 145);
  if (missed.length) missBossNote();
  bossFight.notes = bossFight.notes.filter((note) => note.x >= 145);
  bossFight.missFlash = Math.max(0, bossFight.missFlash - dt);
  if (bossFight.nextNote >= melody.length && bossFight.notes.length === 0 && boss.hp > 0) {
    bossFight.time = 0;
    bossFight.nextNote = 0;
    bossFight.message = "Новый круг мелодии";
  }
}

function update(dt) {
  if (!started) return;
  if (state === "play") updatePlay(dt);
  if (state === "boss") updateBoss(dt);
  if (state !== "dead" && state !== "win") {
    player.invuln = Math.max(0, player.invuln - dt);
    player.attack = Math.max(0, player.attack - dt);
    player.shieldTime = Math.max(0, player.shieldTime - dt);
    player.focusTime = Math.max(0, player.focusTime - dt);
  }
  particles = particles.filter((p) => {
    p.life -= dt;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12;
    return p.life > 0;
  });
  messageTimer = Math.max(0, messageTimer - dt);
  updateHud();
}

function drawPixelText(text, x, y, size = 16, align = "left", color = "#f5ecd8") {
  ctx.save();
  ctx.font = `${size}px monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillStyle = "#000";
  ctx.fillText(text, x + 3, y + 3);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawWorld() {
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, W, H);
  const wallTop = 72;
  const tile = 52;
  ctx.fillStyle = "#d1a51f";
  ctx.fillRect(-cameraX * 0.2, wallTop, WORLD_W, 360);
  ctx.fillStyle = "#e4bd37";
  ctx.fillRect(-cameraX * 0.2, wallTop, WORLD_W, 46);
  ctx.strokeStyle = "#392f12";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = -cameraX * 0.2 % tile; x < W; x += tile) {
    ctx.moveTo(x, wallTop);
    ctx.lineTo(x, GROUND);
  }
  for (let y = wallTop; y < GROUND; y += tile) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
  ctx.fillStyle = "#070706";
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = "rgba(214,186,98,0.2)";
  for (let x = -cameraX % 86; x < W; x += 86) ctx.fillRect(x, GROUND + 18, 52, 5);

  for (const platform of level.platforms) {
    const x = screenX(platform.x);
    if (x + platform.w < -80 || x > W + 80) continue;
    ctx.fillStyle = "#d9c76b";
    ctx.fillRect(x, platform.y, platform.w, platform.h);
    ctx.fillStyle = "#6e5f34";
    ctx.fillRect(x + 12, platform.y + platform.h, platform.w - 24, 6);
    ctx.fillStyle = "rgba(0,0,0,0.24)";
    ctx.fillRect(x + 8, platform.y + platform.h + 6, platform.w - 16, 4);
  }

  ctx.fillStyle = "rgba(0,0,0,0.45)";
  const silhouettes = [430, 560, 1500, 2050, 2620, 3700, 4050];
  for (const sx of silhouettes) {
    const x = screenX(sx);
    if (x < -120 || x > W + 120) continue;
    ctx.fillRect(x, 280, 42, 160);
    ctx.fillRect(x - 30, 332, 100, 10);
    ctx.fillRect(x + 14, 210, 28, 70);
  }
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(screenX(level.prepStart), wallTop, level.prepEnd - level.prepStart, GROUND - wallTop);
}

function animState() {
  if (state === "dead") return "death";
  if (state === "win") return "victory";
  if (player.attack > 0) return "attack";
  if (player.invuln > 0) return "hit";
  if (Math.abs(player.vx) > 0.9 && player.grounded && state === "play") return "run";
  return "idle";
}

function animFrame(name) {
  const anim = ANIMS[name];
  if (name === "attack") return Math.floor(clamp(1 - player.attack / 0.34, 0, 0.999) * anim.frames);
  return Math.floor(performance.now() / 1000 * anim.fps) % anim.frames;
}

function drawHero(x, y, w, h, facing = 1) {
  const name = animState();
  const anim = ANIMS[name];
  const frame = animFrame(name);
  ctx.save();
  if (player.invuln > 0 && Math.floor(performance.now() / 70) % 2 === 0) ctx.globalAlpha = 0.45;
  if (player.shieldTime > 0) {
    ctx.strokeStyle = "rgba(66,192,185,0.75)";
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 18, y + 18, w - 38, h - 30);
  }
  if (facing < 0) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(heroSheet, frame * FRAME_W, anim.row * FRAME_H, FRAME_W, FRAME_H, 0, 0, w, h);
  } else {
    ctx.drawImage(heroSheet, frame * FRAME_W, anim.row * FRAME_H, FRAME_W, FRAME_H, x, y, w, h);
  }
  ctx.restore();
}

function drawPlayer() {
  const w = 150;
  const h = 100;
  drawHero(screenX(player.x) - 38, player.y - 22, w, h, player.facing);
}

function drawEnemy(enemy) {
  if (enemy.dead) return;
  const x = screenX(enemy.x) - enemy.w / 2;
  const wobble = Math.sin(performance.now() / 190 + enemy.phase) * 2;
  const y = enemy.floorY - enemy.h + wobble;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(x + enemy.w * 0.14, enemy.floorY + 5, enemy.w * 0.7, 8);
  if (enemy.twin) {
    drawMinimalBall(screenX(enemy.x) - 18, y + enemy.h / 2, enemy.w * 0.45, enemy, false, -1);
    drawMinimalBall(screenX(enemy.x) + 18, y + enemy.h / 2, enemy.w * 0.45, enemy, false, 1);
  } else {
    drawMinimalBall(screenX(enemy.x), y + enemy.h / 2, enemy.w, enemy, enemy.back, 0);
  }
  drawPixelText(enemy.name, screenX(enemy.x), y - 24, 12, "center", "#f5ecd8");
}

function drawMinimalBall(x, y, size, enemy, back = false, eyeBias = 0) {
  const r = size / 2;
  const pulse = Math.sin(performance.now() / 220 + enemy.phase) * 0.04;
  const rx = r * (1 + pulse);
  const ry = r * (1 - pulse);
  ctx.save();
  if (enemy.hitFlash > 0) ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#050506";
  ctx.beginPath();
  ctx.ellipse(x, y, rx + 3, ry + 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = enemy.color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.arc(x - r * 0.28, y - r * 0.34, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = enemy.stripe;
  if (back) {
    ctx.fillRect(x - r * 0.72, y - 5, r * 1.44, 10);
  } else if (enemy.number === "5") {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.72);
    ctx.fillRect(-r * 0.78, -5, r * 1.56, 10);
    ctx.restore();
  } else {
    ctx.fillRect(x - r * 0.72, y - 5, r * 1.44, 10);
  }
  ctx.fillStyle = "#f5ecd8";
  ctx.beginPath();
  ctx.arc(x + r * (0.1 + eyeBias * 0.05), y - r * 0.16, r * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.font = `${Math.max(12, r * 0.48)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(enemy.number, x + r * (0.1 + eyeBias * 0.05), y - r * 0.14);
  if (!back) {
    ctx.fillStyle = "#111";
    const mouthW = r * (0.58 + Math.abs(pulse) * 2.2);
    ctx.fillRect(x - mouthW / 2, y + r * 0.18, mouthW, 5);
  }
  ctx.restore();
}

function drawPickups() {
  const colors = { heal: "#dd3d33", shield: "#42c0b9", focus: "#f8e47a" };
  for (const p of powerups) {
    if (p.taken) continue;
    const x = screenX(p.x);
    const y = p.y + Math.sin(p.t * 5) * 3;
    ctx.fillStyle = "#000";
    ctx.fillRect(x - 12, y - 12, 24, 24);
    ctx.fillStyle = colors[p.type];
    ctx.fillRect(x - 9, y - 9, 18, 18);
    ctx.fillStyle = "#fff7e1";
    if (p.type === "heal") {
      ctx.fillRect(x - 2, y - 7, 4, 14);
      ctx.fillRect(x - 7, y - 2, 14, 4);
    } else if (p.type === "shield") {
      ctx.fillRect(x - 5, y - 5, 10, 10);
    } else {
      ctx.fillRect(x - 1, y - 7, 3, 14);
    }
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = clamp(p.life * 3, 0, 1);
    ctx.fillStyle = p.color;
    ctx.fillRect(screenX(p.x), p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function drawBossArena() {
  drawWorld();
  drawHero(180, GROUND - 122, 172, 114, 1);
  drawMinimalBall(716, GROUND - 58, 118, boss, false);
  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.fillRect(90, 316, 780, 70);
  ctx.fillStyle = "#f5ecd8";
  ctx.fillRect(185, 304, 5, 92);
  const window = player.focusTime > 0 ? 70 : 44;
  ctx.fillStyle = player.focusTime > 0 ? "rgba(66,192,185,0.25)" : "rgba(245,236,216,0.12)";
  ctx.fillRect(185 - window / 2, 314, window, 74);
  for (const note of bossFight.notes) {
    ctx.fillStyle = "#000";
    ctx.fillRect(note.x - 13, 338, 26, 26);
    ctx.fillStyle = "#e6c85a";
    ctx.fillRect(note.x - 9, 342, 18, 18);
  }
  if (bossFight.missFlash > 0) {
    ctx.fillStyle = `rgba(221,61,51,${bossFight.missFlash})`;
    ctx.fillRect(0, 0, W, H);
  }
  drawPixelText("БОСС: мелодия Crazy 88", W / 2, 86, 22, "center");
  drawPixelText(`комбо ${bossFight.combo}   ${bossFight.message}`, W / 2, 122, 16, "center", "#f8e47a");
}

function drawBars() {
  const rightValue = state === "boss" ? boss.hp / boss.maxHp : player.defeated / 5;
  ctx.fillStyle = "rgba(0,0,0,0.62)";
  ctx.fillRect(30, 32, 250, 14);
  ctx.fillRect(W - 280, 32, 250, 14);
  ctx.fillStyle = "#dd3d33";
  ctx.fillRect(30, 32, 250 * (player.hp / 100), 14);
  ctx.fillStyle = "#e6c85a";
  ctx.fillRect(W - 280, 32, 250 * rightValue, 14);
  drawPixelText(`H ${player.power.heal}  S ${player.power.shield}  F ${player.power.focus}`, W / 2, 29, 13, "center", "#c6bfa9");
}

function drawOverlay() {
  if (messageTimer > 0) drawPixelText(message, W / 2, 82, 18, "center");
  if (state === "dead" || state === "win") {
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(0, 0, W, H);
    drawPixelText(state === "win" ? "ПОБЕДА" : "ТЫ ПРОИГРАЛ", W / 2, 210, 42, "center", state === "win" ? "#f8e47a" : "#dd3d33");
    drawPixelText("Нажми атаку или усиление, чтобы начать сначала", W / 2, 274, 17, "center", "#f5ecd8");
  }
}

function draw() {
  if (state === "boss" && bossFight) drawBossArena();
  else {
    drawWorld();
    drawPickups();
    for (const enemy of enemies) drawEnemy(enemy);
    drawParticles();
    drawPlayer();
  }
  drawBars();
  drawOverlay();
  drawPixelText("← → движение   ↥ прыжок   ● язык   ✦ усиление", W / 2, H - 34, 14, "center", "#c6bfa9");
}

function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000 || 0);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function setKey(key, value) {
  keys[key] = value;
}

window.addEventListener("keydown", (event) => {
  if (event.code === "ArrowLeft" || event.code === "KeyA") setKey("left", true);
  if (event.code === "ArrowRight" || event.code === "KeyD") setKey("right", true);
  if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") setKey("jump", true);
  if (event.code === "KeyJ" || event.code === "KeyK" || event.code === "Enter") attack();
  if (event.code === "KeyE" || event.code === "ShiftLeft" || event.code === "ShiftRight") usePower();
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft" || event.code === "KeyA") setKey("left", false);
  if (event.code === "ArrowRight" || event.code === "KeyD") setKey("right", false);
  if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") setKey("jump", false);
});

document.querySelectorAll(".touch-controls button").forEach((button) => {
  const key = button.dataset.key;
  const press = (event) => {
    event.preventDefault();
    button.classList.add("is-down");
    if (key === "attack") attack();
    else if (key === "power") usePower();
    else setKey(key, true);
  };
  const release = (event) => {
    event.preventDefault();
    button.classList.remove("is-down");
    if (key !== "attack" && key !== "power") setKey(key, false);
  };
  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
});

startButton.addEventListener("click", () => {
  started = true;
  ensureAudio();
  intro.classList.add("is-hidden");
  resetGame();
});

resetGame();
requestAnimationFrame(loop);
