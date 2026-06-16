const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;
const WORLD_W = 5000;
const GROUND = 470;
const CEILING = 22;
const SAVE_KEY = "eight-ball-prototype-v2";
const CONTROL_LAYOUT_KEY = "eight-ball-control-layout-v3";
const PLAYER_SHOT_SPEED = 780;
const PLAYER_SHOT_RANGE = 900;
const ENEMY_SHOT_SPEED = 340;
const ENEMY_SHOT_RANGE = 1500;
const MOBILE_WORLD_Y = -92;
const DASH_ENEMY_RULES = {
  detectionRange: 900,
  triggerRange: 330,
  walkSpeed: 230,
  windup: 360,
  dashDuration: 900,
  cooldown: 1550,
  meleeRange: 58,
  meleeCooldown: 760,
  meleeDamage: 12,
};
const SHOOTER_BURST_RULES = {
  triggerRange: 560,
  windup: 300,
  shots: 5,
  shotGap: 170,
  cooldown: 1850,
};
const BOSS_TRIGGER_X = 4920;
const BOSS_NOTE_TRAVEL = 1400;
const BOSS_HIT_WINDOW = 170;

const ui = {
  start: document.getElementById("startScreen"),
  hud: document.getElementById("hud"),
  hpBar: document.getElementById("healthBar"),
  hpText: document.getElementById("healthText"),
  ammo: document.getElementById("ammoText"),
  checkpoint: document.getElementById("checkpointText"),
  pause: document.getElementById("pauseDialog"),
  defeat: document.getElementById("defeatDialog"),
  victory: document.getElementById("victoryDialog"),
};

const mobileLandscapeQuery = window.matchMedia?.("(hover: none) and (pointer: coarse) and (orientation: landscape)");

const keys = new Set();
const pressed = new Set();
const activeTouchCodes = new Set();
let controlsEditing = false;
let wasRunningBeforeControlEdit = false;
let draggedControl = null;
const defaultControlLayout = {
  left: { x: 12, y: 84, size: 82 },
  right: { x: 24, y: 84, size: 82 },
  attack: { x: 75, y: 79, size: 82 },
  jump: { x: 84, y: 68, size: 82 },
  crouch: { x: 92, y: 60, size: 50 },
  hat: { x: 91, y: 73, size: 50 },
  slam: { x: 90, y: 86, size: 50 },
  spit: { x: 83, y: 84, size: 50 },
};
const platforms = [
  { x: 0, y: GROUND, w: 1740, h: 70 },
  { x: 2570, y: GROUND, w: WORLD_W - 2570, h: 70 },
  { x: 760, y: 382, w: 210, h: 18 },
  { x: 1250, y: 285, w: 190, h: 18 },
  { x: 1740, y: 405, w: 110, h: 18 },
  { x: 1950, y: 405, w: 110, h: 18 },
  { x: 2160, y: 405, w: 110, h: 18 },
  { x: 2370, y: 405, w: 110, h: 18 },
  { x: 2730, y: 180, w: 180, h: 18 },
  { x: 3650, y: 430, w: 185, h: 18 },
];

const obstacles = [
  { x: 3580, y: 55, w: 42, h: GROUND - 55 },
];

const lowCeilings = [
  { x: 4420, y: CEILING, w: 330, h: 390 },
];

const enemyPlan = [
  { x: 700, y: GROUND - 52, kind: "rookie", hp: 2, passive: true, dropsHealth: true, behavior: "guard", arenaMin: 560, arenaMax: 900 },
  { x: 1030, y: GROUND - 52, kind: "sprinter", hp: 2, behavior: "dash", arenaMin: 0, arenaMax: 1740 },
  { x: 1318, y: 285 - 52, kind: "rookie", hp: 2, passive: true, dropsHealth: true, behavior: "guard", arenaMin: 1250, arenaMax: 1440 },
  { x: 2795, y: 180 - 52, kind: "high", hp: 2, ranged: true, behavior: "crouchShooter", activationX: 1680, deactivationX: 2920, arenaMin: 2730, arenaMax: 2910 },
  { x: 2960, y: GROUND - 52, kind: "shield", hp: 5, armored: true, behavior: "heavy", activationX: 2700, deactivationX: 3300, arenaMin: 2780, arenaMax: 3240 },
  { x: 3695, y: 430 - 52, kind: "high", hp: 2, ranged: true, dropsHealth: true, behavior: "turret", gatekeeper: true, arenaMin: 3650, arenaMax: 3835 },
  { x: 4100, y: GROUND - 52, kind: "sprinter", hp: 3, behavior: "dash", arenaMin: 3560, arenaMax: 4420 },
];

const instructions = [
  [180, "ДВИЖЕНИЕ", "A / D и W / ↑"],
  [530, "ЯЗЫК", "быстрый удар: J"],
  [1130, "ДВОЙНОЙ ПРЫЖОК", "нажми W / ↑ ещё раз в воздухе"],
  [1660, "СТРЕЛЯЙ", "дальний выстрел: L"],
  [2670, "ТЯЖЁЛЫЙ ВРАГ", "сломай защиту: в прыжке ↓ + J"],
  [3460, "МЕТНИ ШЛЯПУ", "возвратная атака: K"],
  [4350, "ПРИСЯДЬ", "держи S / ↓ и проползи под трубой"],
  [4800, "ЧЕКПОИНТ", "подготовка к боссу"],
];

const state = {
  running: false,
  lastTime: 0,
  cameraX: 0,
  message: "",
  messageUntil: 0,
  particles: [],
  attacks: [],
  projectiles: [],
  enemyProjectiles: [],
  enemyAreas: [],
  pickups: [],
  enemies: [],
  hat: null,
  doorOpen: false,
  doorOpenAt: 0,
  respawnUntil: 0,
  mode: "level",
  boss: null,
  runCheckpoint: { checkpoint: "start", x: 120 },
  save: readSave(),
};

const player = {
  x: 120,
  y: GROUND - 66,
  w: 64,
  h: 66,
  vx: 0,
  vy: 0,
  facing: 1,
  grounded: false,
  hp: 100,
  ammo: 3,
  invulnerableUntil: 0,
  lockedUntil: 0,
  slam: false,
  crouching: false,
  standingH: 66,
  crouchingH: 46,
  jumpsUsed: 0,
  lastDownAt: -1000,
  dropThroughUntil: 0,
};

let audioContext = null;

function ensureAudio() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioContext = new AudioContextClass();
  }
  if (audioContext?.state === "suspended") audioContext.resume();
}

function tone(frequency, duration, options = {}) {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const start = audioContext.currentTime + (options.delay || 0);
  oscillator.type = options.type || "square";
  oscillator.frequency.setValueAtTime(frequency, start);
  if (options.endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, start + duration);
  }
  gain.gain.setValueAtTime(options.volume || 0.035, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

function noise(duration, volume = 0.035) {
  if (!audioContext) return;
  const length = Math.max(1, Math.floor(audioContext.sampleRate * duration));
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = buffer;
  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
  source.connect(gain);
  gain.connect(audioContext.destination);
  source.start();
}

function playSound(name) {
  ensureAudio();
  if (name === "jump") tone(210, 0.11, { endFrequency: 440, volume: 0.04 });
  if (name === "doubleJump") {
    tone(300, 0.1, { endFrequency: 650, volume: 0.04 });
    tone(520, 0.08, { delay: 0.07, volume: 0.025 });
  }
  if (name === "tongue") tone(170, 0.09, { endFrequency: 85, type: "sawtooth", volume: 0.035 });
  if (name === "spit") tone(680, 0.12, { endFrequency: 240, volume: 0.035 });
  if (name === "hat") {
    tone(320, 0.18, { endFrequency: 760, volume: 0.025 });
    tone(760, 0.16, { delay: 0.12, endFrequency: 360, volume: 0.02 });
  }
  if (name === "slam") {
    tone(110, 0.2, { endFrequency: 42, type: "sawtooth", volume: 0.05 });
    noise(0.13, 0.045);
  }
  if (name === "enemyHit") tone(125, 0.07, { endFrequency: 80, volume: 0.025 });
  if (name === "enemyDown") {
    tone(220, 0.12, { endFrequency: 90, volume: 0.04 });
    noise(0.08, 0.025);
  }
  if (name === "hurt") {
    tone(95, 0.18, { endFrequency: 48, type: "sawtooth", volume: 0.05 });
    noise(0.08, 0.02);
  }
  if (name === "pickup") {
    tone(520, 0.08, { volume: 0.035 });
    tone(780, 0.12, { delay: 0.07, volume: 0.035 });
  }
  if (name === "checkpoint") {
    tone(330, 0.1, { volume: 0.03 });
    tone(495, 0.1, { delay: 0.1, volume: 0.03 });
    tone(660, 0.16, { delay: 0.2, volume: 0.035 });
  }
  if (name === "enemyShot") tone(260, 0.13, { endFrequency: 120, type: "sawtooth", volume: 0.028 });
}

function readSave() {
  try {
    return {
      checkpoint: "start",
      x: 120,
      ...JSON.parse(localStorage.getItem(SAVE_KEY) || "{}"),
    };
  } catch {
    return { checkpoint: "start", x: 120 };
  }
}

function writeSave(save) {
  state.save = save;
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function clearSave() {
  state.save = { checkpoint: "start", x: 120 };
  localStorage.removeItem(SAVE_KEY);
}

function controlId(button) {
  if (button.dataset.action === "slam") return "slam";
  if (button.dataset.code === "ArrowLeft") return "left";
  if (button.dataset.code === "ArrowRight") return "right";
  if (button.dataset.code === "ArrowUp") return "jump";
  if (button.dataset.code === "ArrowDown") return "crouch";
  if (button.dataset.code === "KeyJ") return "attack";
  if (button.dataset.code === "KeyL") return "spit";
  if (button.dataset.code === "KeyK") return "hat";
  return "";
}

function readControlLayout() {
  try {
    return {
      ...defaultControlLayout,
      ...JSON.parse(localStorage.getItem(CONTROL_LAYOUT_KEY) || "{}"),
    };
  } catch {
    return { ...defaultControlLayout };
  }
}

function writeControlLayout(layout) {
  localStorage.setItem(CONTROL_LAYOUT_KEY, JSON.stringify(layout));
}

function applyControlLayout(layout = readControlLayout()) {
  document.querySelectorAll(".touch-button").forEach((button) => {
    const id = controlId(button);
    const position = layout[id];
    if (!position) return;
    button.style.setProperty("--control-x", String(position.x));
    button.style.setProperty("--control-y", String(position.y));
    button.style.setProperty("--control-size", String(position.size));
  });
}

function controlLayoutFromDom() {
  const layout = {};
  document.querySelectorAll(".touch-button").forEach((button) => {
    const id = controlId(button);
    if (!id) return;
    layout[id] = {
      x: Number(button.style.getPropertyValue("--control-x")) || defaultControlLayout[id].x,
      y: Number(button.style.getPropertyValue("--control-y")) || defaultControlLayout[id].y,
      size: defaultControlLayout[id].size,
    };
  });
  return layout;
}

function setControlPosition(button, clientX, clientY) {
  const size = Number(button.style.getPropertyValue("--control-size")) || 54;
  const minX = (size / 2 / window.innerWidth) * 100;
  const maxX = 100 - minX;
  const minY = (size / 2 / window.innerHeight) * 100;
  const maxY = 100 - minY;
  const x = clamp((clientX / window.innerWidth) * 100, minX, maxX);
  const y = clamp((clientY / window.innerHeight) * 100, minY, maxY);
  button.style.setProperty("--control-x", x.toFixed(2));
  button.style.setProperty("--control-y", y.toFixed(2));
}

function startControlEdit() {
  wasRunningBeforeControlEdit = state.running;
  state.running = false;
  clearInputState();
  state.lastTime = performance.now();
  controlsEditing = true;
  document.body.classList.add("is-control-editing");
  document.getElementById("controlEditor").hidden = false;
  applyControlLayout();
}

function finishControlEdit() {
  controlsEditing = false;
  draggedControl = null;
  document.body.classList.remove("is-control-editing");
  document.getElementById("controlEditor").hidden = true;
  writeControlLayout(controlLayoutFromDom());
  clearInputState();
  stabilizeActors();
  state.running = wasRunningBeforeControlEdit;
  state.lastTime = performance.now();
  state.respawnUntil = performance.now() + 120;
}

function resetControlLayout() {
  localStorage.removeItem(CONTROL_LAYOUT_KEY);
  applyControlLayout(defaultControlLayout);
}

function resetEnemyCombatState(enemy, now) {
  enemy.nextAttack = now;
  enemy.pendingShotAt = 0;
  enemy.pendingMeleeAt = 0;
  enemy.pendingAreaAt = 0;
  enemy.burstShotsLeft = 0;
  enemy.burstNextShotAt = 0;
  enemy.dashUntil = 0;
  enemy.warningUntil = 0;
}

function supportedPlatformAt(x, width, preferredY = Infinity) {
  const centerX = x + width / 2;
  const candidates = platforms.filter(
    (platform) => centerX >= platform.x && centerX <= platform.x + platform.w
  );
  if (Number.isFinite(preferredY)) {
    const exact = candidates.find((platform) => Math.abs(platform.y - preferredY) <= 4);
    if (exact) return exact;
  }
  return candidates
    .filter((platform) => platform.y >= preferredY - 4)
    .sort((a, b) => a.y - b.y)[0] || candidates.sort((a, b) => a.y - b.y)[0];
}

function supportPlatform(body, tolerance = 4) {
  const bottom = body.y + body.h;
  return platforms.find(
    (platform) =>
      body.x + body.w > platform.x &&
      body.x < platform.x + platform.w &&
      bottom >= platform.y - tolerance &&
      bottom <= platform.y + tolerance
  );
}

function placeOnPlatform(body, preferredY = GROUND) {
  const platform = supportedPlatformAt(body.x, body.w, preferredY);
  body.y = (platform?.y || GROUND) - body.h;
  body.vy = 0;
  body.grounded = true;
}

function stabilizeActors() {
  placeOnPlatform(player, GROUND);
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    placeOnPlatform(enemy, enemy.spawnBottom);
  }
}

function createEnemy(plan, index) {
  const enemy = {
    ...plan,
    spawnX: plan.x,
    spawnBottom: plan.y + 52,
    homeX: plan.x,
    x: plan.x,
    w: 54,
    h: 52,
    maxHp: plan.hp,
    vx: 0,
    vy: 0,
    grounded: true,
    alive: true,
    nextAttack: 0,
    pendingShotAt: 0,
    pendingMeleeAt: 0,
    pendingAreaAt: 0,
    burstShotsLeft: 0,
    burstNextShotAt: 0,
    dashUntil: 0,
    warningUntil: 0,
    hitUntil: 0,
    hatHitUntil: 0,
    stompUntil: 0,
    phase: index * 1.3,
  };
  placeOnPlatform(enemy, enemy.spawnBottom);
  enemy.homeX = enemy.x;
  return enemy;
}

function clearInputState() {
  keys.clear();
  pressed.clear();
  activeTouchCodes.clear();
  document.querySelectorAll(".touch-button.is-pressed").forEach((button) => {
    button.classList.remove("is-pressed");
  });
}

function resetWorld(useCheckpoint = true) {
  clearInputState();
  const now = performance.now();
  const save = useCheckpoint
    ? state.runCheckpoint
    : { checkpoint: "start", x: 120 };
  if (!useCheckpoint) {
    state.runCheckpoint = save;
    clearSave();
  }
  state.save = save;
  player.h = player.standingH;
  player.x = save.checkpoint === "boss" ? save.x : 120;
  player.vx = 0;
  player.hp = 100;
  player.ammo = 3;
  player.facing = 1;
  player.slam = false;
  player.crouching = false;
  player.jumpsUsed = 0;
  player.dropThroughUntil = 0;
  player.lastDownAt = -1000;
  player.invulnerableUntil = 0;
  player.lockedUntil = 0;
  placeOnPlatform(player, GROUND);
  state.respawnUntil = now + 120;
  state.save = save;
  state.cameraX = Math.max(0, player.x - W * 0.35);
  state.enemies = enemyPlan.map(createEnemy);
  state.attacks = [];
  state.projectiles = [];
  state.enemyProjectiles = [];
  state.enemyAreas = [];
  state.pickups = [];
  state.particles = [];
  state.hat = null;
  state.doorOpen = false;
  state.doorOpenAt = 0;
  state.mode = "level";
  state.boss = null;
  state.lastTime = now;
  updateHud();
  if (useCheckpoint && save.checkpoint === "boss") {
    startBossBattle(now);
  }
}

function startGame() {
  ensureAudio();
  ui.start.classList.add("is-hidden");
  ui.hud.hidden = false;
  state.running = true;
}

function updateHud() {
  ui.hpBar.style.width = `${player.hp}%`;
  ui.hpText.textContent = String(player.hp);
  ui.ammo.textContent = `Плевки: ${player.ammo}`;
  ui.checkpoint.textContent =
    state.save.checkpoint === "boss" ? "Чекпоинт перед боссом" : "Тренировочный зал";
}

function pressInput(code, repeat = false) {
  if (!keys.has(code)) pressed.add(code);
  keys.add(code);

  if (code === "Escape" && !repeat) {
    if (ui.pause.open) resumeGame();
    else if (state.running && !ui.defeat.open) pauseGame();
    return;
  }

  if ((code === "KeyS" || code === "ArrowDown") && state.running) {
    if (repeat) return;
    const now = performance.now();
    if (now - player.lastDownAt <= 280 && player.grounded && player.y + player.h < GROUND - 2) {
      player.dropThroughUntil = now + 260;
      player.y += 8;
      player.grounded = false;
      player.vy = 120;
    }
    player.lastDownAt = now;
  }
  if (repeat) return;
  if (state.mode === "boss" && state.running) {
    if (code === "KeyJ") bossHit();
    return;
  }
  if (code === "KeyJ" && state.running) {
    if (!player.grounded && downHeld()) startSlam();
    else tongueAttack();
  }
  if (code === "KeyL" && state.running) spitAttack();
  if (code === "KeyK" && state.running) throwHat();
}

function releaseInput(code) {
  keys.delete(code);
}

function keyDown(event) {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.code)) {
    event.preventDefault();
  }
  pressInput(event.code, event.repeat);
}

function keyUp(event) {
  releaseInput(event.code);
}

function downHeld() {
  return keys.has("KeyS") || keys.has("ArrowDown");
}

function attackReady() {
  return performance.now() >= player.lockedUntil && player.hp > 0;
}

function tongueAttack() {
  if (!attackReady()) return;
  playSound("tongue");
  const now = performance.now();
  player.lockedUntil = now + 190;
  state.attacks.push({
    kind: "tongue",
    direction: player.facing,
    age: 0,
    duration: 190,
    hit: new Set(),
  });
}

function spitAttack() {
  if (!attackReady() || player.ammo <= 0) return;
  playSound("spit");
  player.ammo -= 1;
  player.lockedUntil = performance.now() + 190;
  const originX = player.x + player.w / 2 + player.facing * 36;
  const originY = player.y + (player.crouching ? 27 : 38);
  const target = findSpitTarget(originX, originY, player.facing);
  let velocityX = player.facing * PLAYER_SHOT_SPEED;
  let velocityY = 0;
  if (target) {
    const targetX = target.x + target.w / 2;
    const targetY = target.y + target.h / 2;
    const distance = Math.hypot(targetX - originX, targetY - originY) || 1;
    velocityX = ((targetX - originX) / distance) * PLAYER_SHOT_SPEED;
    velocityY = ((targetY - originY) / distance) * PLAYER_SHOT_SPEED;
  }
  state.projectiles.push({
    x: originX,
    y: originY,
    vx: velocityX,
    vy: velocityY,
    r: 10,
    distance: 0,
    maxDistance: PLAYER_SHOT_RANGE,
  });
  updateHud();
}

function findSpitTarget(originX, originY, direction) {
  let best = null;
  let bestScore = Infinity;
  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.passive) continue;
    const targetX = enemy.x + enemy.w / 2;
    const targetY = enemy.y + enemy.h / 2;
    const dx = targetX - originX;
    const dy = targetY - originY;
    if (Math.sign(dx) !== direction || Math.abs(dx) > 680 || Math.abs(dy) > 240) continue;
    if (obstacles.some((obstacle) => lineIntersectsRect(originX, originY, targetX, targetY, obstacle))) continue;
    const score = Math.abs(dx) + Math.abs(dy) * 2.4;
    if (score < bestScore) {
      best = enemy;
      bestScore = score;
    }
  }
  return best;
}

function startSlam() {
  if (player.grounded || player.slam) return;
  player.slam = true;
  player.vx *= 0.3;
  player.vy = 790;
}

function mobileSlamAttack() {
  if (!state.running || player.grounded || player.slam) return;
  startSlam();
}

function finishSlam() {
  const now = performance.now();
  player.slam = false;
  player.lockedUntil = now + 260;
  playSound("slam");
  state.attacks.push({
    kind: "slam",
    x: player.x + player.w / 2,
    y: player.y + player.h,
    age: 0,
    duration: 230,
    hit: new Set(),
  });
  spawnDust(player.x + player.w / 2, GROUND - 4, 14, 1.7);
}

function throwHat() {
  if (!attackReady() || state.hat) return;
  playSound("hat");
  const originX = player.x + player.w / 2 + player.facing * 28;
  const originY = player.y + 12;
  state.hat = {
    x: originX,
    y: originY,
    vx: player.facing * 500,
    vy: -60,
    direction: player.facing,
    returning: false,
    age: 0,
  };
}

function update(dt, now) {
  if (!state.running) return;
  if (state.mode === "boss") {
    updateBoss(dt, now);
    updateParticles(dt);
    return;
  }
  if (now < state.respawnUntil) {
    stabilizeActors();
  }
  updatePlayer(dt, now);
  updateEnemies(dt, now);
  updateAttacks(dt);
  updateProjectiles(dt, now);
  updatePickups(dt);
  updateHat(dt);
  updateEnemyAreas(dt, now);
  updateParticles(dt);
  updateCheckpoint(now);
  if (state.runCheckpoint.checkpoint === "boss" && player.x >= BOSS_TRIGGER_X) {
    startBossBattle(now);
  }
  state.cameraX += (clamp(player.x - W * 0.36, 0, WORLD_W - W) - state.cameraX) * Math.min(1, dt * 7);
}

function updatePlayer(dt, now) {
  if (!player.slam) {
    const left = keys.has("KeyA") || keys.has("ArrowLeft");
    const right = keys.has("KeyD") || keys.has("ArrowRight");
    const direction = Number(right) - Number(left);
    setCrouching(player.grounded && downHeld());
    if (direction !== 0) {
      player.facing = direction;
      player.vx += direction * (player.crouching ? 650 : 1250) * dt;
      player.vx = clamp(player.vx, player.crouching ? -115 : -330, player.crouching ? 115 : 330);
    } else {
      player.vx = approach(player.vx, 0, 1450 * dt);
    }

    const jumpPressed = pressed.has("KeyW") || pressed.has("ArrowUp");
    const blockedByLowCeiling = player.crouching && !canStandHere(player.x, player.y);
    if (jumpPressed && player.jumpsUsed < 2 && !blockedByLowCeiling) {
      setCrouching(false);
      playSound(player.jumpsUsed === 0 ? "jump" : "doubleJump");
      player.vy = player.jumpsUsed === 0 ? -570 : -520;
      player.grounded = false;
      player.jumpsUsed += 1;
      spawnDust(player.x + player.w / 2, player.y + player.h, 6, 1);
    }
  }

  player.vy += 1450 * dt;
  player.vy = Math.min(player.vy, 820);
  moveBody(player, dt);
  if (player.grounded) player.jumpsUsed = 0;

  if (player.slam && player.grounded) finishSlam();
  if (player.y > H + 100) damagePlayer(100, now);
}

function canStandHere(x, y) {
  const standingY = y + player.h - player.standingH;
  const standingBounds = {
    x,
    y: standingY,
    w: player.w,
    h: player.standingH,
  };
  return !lowCeilings.some((ceiling) => rectsOverlap(standingBounds, ceiling));
}

function setCrouching(shouldCrouch) {
  if (shouldCrouch === player.crouching) return;
  if (shouldCrouch) {
    player.y += player.standingH - player.crouchingH;
    player.h = player.crouchingH;
  } else {
    if (!canStandHere(player.x, player.y)) return;
    const standingY = player.y - (player.standingH - player.crouchingH);
    player.y = standingY;
    player.h = player.standingH;
  }
  player.crouching = shouldCrouch;
}

function moveBody(body, dt) {
  const previousX = body.x;
  body.x += body.vx * dt;
  body.x = clamp(body.x, 0, WORLD_W - body.w);
  if (body !== player && Number.isFinite(body.arenaMin) && Number.isFinite(body.arenaMax)) {
    body.x = clamp(body.x, body.arenaMin, body.arenaMax - body.w);
  }
  if (body === player && !player.crouching) {
    for (const ceiling of lowCeilings) {
      if (!rectsOverlap(body, ceiling)) continue;
      if (previousX + body.w <= ceiling.x) {
        body.x = ceiling.x - body.w;
      } else if (previousX >= ceiling.x + ceiling.w) {
        body.x = ceiling.x + ceiling.w;
      } else {
        body.x = previousX;
      }
      body.vx = 0;
    }
  }
  for (const obstacle of obstacles) {
    if (state.doorOpen) continue;
    if (!rectsOverlap(body, obstacle)) continue;
    if (previousX + body.w <= obstacle.x) {
      body.x = obstacle.x - body.w;
    } else if (previousX >= obstacle.x + obstacle.w) {
      body.x = obstacle.x + obstacle.w;
    } else if (body.x + body.w / 2 < obstacle.x + obstacle.w / 2) {
      body.x = obstacle.x - body.w;
    } else {
      body.x = obstacle.x + obstacle.w;
    }
    body.vx = 0;
  }

  const standingPlatform = body.grounded ? supportPlatform(body, 8) : null;
  if (body !== player && standingPlatform && body.vy >= 0) {
    body.y = standingPlatform.y - body.h;
    body.vy = 0;
    body.grounded = true;
    return;
  }

  const previousBottom = body.y + body.h;
  body.y += body.vy * dt;
  if (body === player && body.y < CEILING) {
    body.y = CEILING;
    body.vy = Math.max(0, body.vy);
  }
  body.grounded = false;

  if (body.vy >= 0) {
    for (const platform of platforms) {
      if (body === player && performance.now() < player.dropThroughUntil && platform.y < GROUND) continue;
      const bottom = body.y + body.h;
      const withinX = body.x + body.w > platform.x && body.x < platform.x + platform.w;
      if (withinX && previousBottom <= platform.y && bottom >= platform.y) {
        body.y = platform.y - body.h;
        body.vy = 0;
        body.grounded = true;
        break;
      }
    }
  }
}

function fireEnemyShot(enemy, now) {
  const originX = enemy.x + enemy.w / 2;
  const originY = enemy.y + enemy.h / 2;
  const targetX = player.x + player.w / 2;
  const targetY = enemy.behavior === "crouchShooter"
    ? 350
    : player.y + player.h / 2;
  const shotDistance = Math.hypot(targetX - originX, targetY - originY) || 1;
  state.enemyProjectiles.push({
    x: originX,
    y: originY,
    vx: ((targetX - originX) / shotDistance) * ENEMY_SHOT_SPEED,
    vy: ((targetY - originY) / shotDistance) * ENEMY_SHOT_SPEED,
    r: 7,
    distance: 0,
    maxDistance: ENEMY_SHOT_RANGE,
  });
  enemy.warningUntil = now + 90;
  playSound("enemyShot");
}

function updateEnemyBurst(enemy, now) {
  if (enemy.burstShotsLeft <= 0 || now < enemy.burstNextShotAt) return;
  fireEnemyShot(enemy, now);
  enemy.burstShotsLeft -= 1;
  enemy.burstNextShotAt = now + SHOOTER_BURST_RULES.shotGap;
}

function updateEnemies(dt, now) {
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    const distance = player.x - enemy.x;
    const verticalDistance = Math.abs(
      player.y + player.h / 2 - (enemy.y + enemy.h / 2)
    );
    const sameLane = verticalDistance < 48;
    const detectionRange = enemy.behavior === "dash" ? DASH_ENEMY_RULES.detectionRange : 580;
    const withinSection =
      enemy.behavior === "dash" ||
      ((!enemy.activationX || player.x >= enemy.activationX) &&
        (!enemy.deactivationX || player.x <= enemy.deactivationX));
    const active =
      !enemy.passive &&
      Math.abs(distance) < detectionRange &&
      withinSection;

    if (enemy.pendingShotAt && now >= enemy.pendingShotAt) {
      enemy.pendingShotAt = 0;
      fireEnemyShot(enemy, now);
    }
    updateEnemyBurst(enemy, now);
    if (enemy.pendingMeleeAt && now >= enemy.pendingMeleeAt) {
      enemy.pendingMeleeAt = 0;
      const currentDistance = Math.abs(player.x - enemy.x);
      const currentVerticalDistance = Math.abs(
        player.y + player.h / 2 - (enemy.y + enemy.h / 2)
      );
      if (currentDistance <= 96 && currentVerticalDistance < 48) damagePlayer(22, now);
    }
    if (enemy.pendingAreaAt && now >= enemy.pendingAreaAt) {
      enemy.pendingAreaAt = 0;
      state.enemyAreas.push({
        x: enemy.x + enemy.w / 2,
        y: GROUND - 4,
        radius: 12,
        maxRadius: 155,
        age: 0,
        duration: 360,
        hit: false,
      });
      playSound("slam");
    }

    if (active && enemy.ranged) {
      enemy.vx = approach(enemy.vx, 0, 900 * dt);
      if (
        Math.abs(distance) < SHOOTER_BURST_RULES.triggerRange &&
        now >= enemy.nextAttack &&
        enemy.burstShotsLeft <= 0
      ) {
        enemy.warningUntil = now + SHOOTER_BURST_RULES.windup;
        enemy.burstShotsLeft = SHOOTER_BURST_RULES.shots;
        enemy.burstNextShotAt = now + SHOOTER_BURST_RULES.windup;
        enemy.nextAttack =
          enemy.burstNextShotAt +
          SHOOTER_BURST_RULES.shotGap * SHOOTER_BURST_RULES.shots +
          SHOOTER_BURST_RULES.cooldown;
      }
    } else if (active && enemy.behavior === "heavy") {
      if (sameLane && Math.abs(distance) > 125) {
        enemy.vx = Math.sign(distance) * 55;
      } else {
        enemy.vx = 0;
        if (sameLane && Math.abs(distance) <= 150 && now >= enemy.nextAttack && !enemy.pendingAreaAt) {
          enemy.warningUntil = now + 760;
          enemy.pendingAreaAt = now + 760;
          enemy.nextAttack = now + 2600;
        }
      }
    } else if (active) {
      if (
        enemy.behavior === "dash" &&
        sameLane &&
        Math.abs(distance) < DASH_ENEMY_RULES.triggerRange &&
        now >= enemy.nextAttack
      ) {
        enemy.warningUntil = now + DASH_ENEMY_RULES.windup;
        enemy.dashUntil = enemy.warningUntil + DASH_ENEMY_RULES.dashDuration;
        enemy.nextAttack = enemy.dashUntil + DASH_ENEMY_RULES.cooldown;
      }
      if (enemy.behavior === "dash" && now < enemy.warningUntil) {
        enemy.vx = 0;
      } else if (enemy.behavior === "dash" && now < enemy.dashUntil) {
        enemy.vx = Math.sign(distance) * 430;
      } else {
        const speed = enemy.behavior === "dash" ? DASH_ENEMY_RULES.walkSpeed : 88;
        enemy.vx = Math.abs(distance) > 58 ? Math.sign(distance) * speed : 0;
      }
      if (sameLane && Math.abs(distance) <= DASH_ENEMY_RULES.meleeRange && now >= enemy.nextAttack) {
        enemy.nextAttack = now + (enemy.behavior === "dash" ? DASH_ENEMY_RULES.meleeCooldown : 1120);
        damagePlayer(enemy.behavior === "dash" ? DASH_ENEMY_RULES.meleeDamage : 12, now);
      }
    } else {
      enemy.vx = approach(enemy.vx, 0, 700 * dt);
    }

    enemy.vy += 1450 * dt;
    moveBody(enemy, dt);

    if (rectsOverlap(player, enemy) && now >= player.invulnerableUntil) {
      if (player.vy > 150 && player.y + player.h < enemy.y + 24) {
        const pushDirection =
          player.x + player.w / 2 < enemy.x + enemy.w / 2 ? -1 : 1;
        player.y = enemy.y - player.h - 2;
        player.vy = -360;
        player.vx = pushDirection * 170;
        if (now >= enemy.stompUntil) {
          enemy.stompUntil = now + 480;
          damageEnemy(enemy, 1, "jump", -pushDirection, now);
        }
      } else {
        damagePlayer(10, now);
      }
    }
  }
}

function updateAttacks(dt) {
  const now = performance.now();
  for (const attack of state.attacks) {
    attack.age += dt * 1000;
    if (attack.kind === "tongue") {
      const mouthX = player.x + player.w / 2 + attack.direction * 7;
      const mouthY = player.y + (player.crouching ? 27 : 48);
      const reach = 100 * Math.min(1, attack.age / 65, (attack.duration - attack.age) / 55);
      const box = {
        x: attack.direction > 0 ? mouthX : mouthX - reach,
        y: mouthY - 12,
        w: reach,
        h: 28,
      };
      hitEnemies(box, attack, 1, "tongue", attack.direction, now);
    } else {
      const radius = 105 * Math.min(1, attack.age / 90);
      const box = { x: attack.x - radius, y: attack.y - 46, w: radius * 2, h: 92 };
      hitEnemies(box, attack, 2, "slam", 0, now);
    }
  }
  state.attacks = state.attacks.filter((attack) => attack.age < attack.duration);
}

function hitEnemies(box, attack, damage, kind, direction, now) {
  for (const enemy of state.enemies) {
    if (!enemy.alive || attack.hit.has(enemy) || !rectsOverlap(box, enemy)) continue;
    attack.hit.add(enemy);
    damageEnemy(enemy, damage, kind, direction || Math.sign(enemy.x - player.x), now);
  }
}

function updateProjectiles(dt, now) {
  for (const projectile of state.projectiles) {
    const dx = projectile.vx * dt;
    const dy = projectile.vy * dt;
    projectile.x += dx;
    projectile.y += dy;
    projectile.distance += Math.hypot(dx, dy);
    if (!state.doorOpen && obstacles.some((obstacle) => circleRectOverlap(projectile, obstacle))) {
      projectile.distance = projectile.maxDistance;
      spawnDust(projectile.x, projectile.y, 5, 0.6);
      continue;
    }
    for (const enemy of state.enemies) {
      if (!enemy.alive || projectile.distance >= projectile.maxDistance) continue;
      if (circleRectOverlap(projectile, enemy)) {
        damageEnemy(enemy, 1, "spit", Math.sign(projectile.vx), now);
        projectile.distance = projectile.maxDistance;
      }
    }
  }

  for (const projectile of state.enemyProjectiles) {
    const dx = projectile.vx * dt;
    const dy = projectile.vy * dt;
    projectile.x += dx;
    projectile.y += dy;
    projectile.distance += Math.hypot(dx, dy);
    if (!state.doorOpen && obstacles.some((obstacle) => circleRectOverlap(projectile, obstacle))) {
      projectile.distance = projectile.maxDistance;
      continue;
    }
    if (projectile.distance < projectile.maxDistance && circleRectOverlap(projectile, player)) {
      damagePlayer(14, now);
      projectile.distance = projectile.maxDistance;
    }
  }

  state.projectiles = state.projectiles.filter(
    (shot) =>
      shot.distance < shot.maxDistance &&
      shot.x > 0 &&
      shot.x < WORLD_W &&
      shot.y > 0 &&
      shot.y < H
  );
  state.enemyProjectiles = state.enemyProjectiles.filter(
    (shot) =>
      shot.distance < shot.maxDistance &&
      shot.x > 0 &&
      shot.x < WORLD_W &&
      shot.y > 0 &&
      shot.y < H
  );
}

function updateEnemyAreas(dt, now) {
  for (const area of state.enemyAreas) {
    area.age += dt * 1000;
    area.radius = area.maxRadius * Math.min(1, area.age / 150);
    if (
      !area.hit &&
      area.age >= 120 &&
      Math.abs(player.x + player.w / 2 - area.x) <= area.radius &&
      player.y + player.h >= GROUND - 80
    ) {
      area.hit = true;
      damagePlayer(24, now);
    }
  }
  state.enemyAreas = state.enemyAreas.filter((area) => area.age < area.duration);
}

function updatePickups(dt) {
  for (const pickup of state.pickups) {
    pickup.vy += 850 * dt;
    const previousBottom = pickup.y + pickup.h;
    pickup.y += pickup.vy * dt;
    for (const platform of platforms) {
      const bottom = pickup.y + pickup.h;
      if (
        pickup.x + pickup.w > platform.x &&
        pickup.x < platform.x + platform.w &&
        previousBottom <= platform.y &&
        bottom >= platform.y
      ) {
        pickup.y = platform.y - pickup.h;
        pickup.vy = 0;
        break;
      }
    }
    pickup.age += dt * 1000;
    if (!pickup.collected && player.hp < 100 && rectsOverlap(player, pickup)) {
      pickup.collected = true;
      player.hp = Math.min(100, player.hp + 25);
      playSound("pickup");
      updateHud();
      spawnDust(pickup.x + pickup.w / 2, pickup.y + pickup.h / 2, 8, 0.8);
    }
  }
  state.pickups = state.pickups.filter((pickup) => !pickup.collected && pickup.age < 12000);
}

function updateHat(dt) {
  if (!state.hat) return;
  const hat = state.hat;
  hat.age += dt * 1000;
  if (hat.age > 380) hat.returning = true;

  if (hat.returning) {
    const targetX = player.x + player.w / 2;
    const targetY = player.y + 12;
    const length = Math.hypot(targetX - hat.x, targetY - hat.y) || 1;
    hat.vx = ((targetX - hat.x) / length) * 630;
    hat.vy = ((targetY - hat.y) / length) * 630;
  }

  hat.x += hat.vx * dt;
  hat.y += hat.vy * dt;
  const now = performance.now();
  for (const enemy of state.enemies) {
    if (!enemy.alive || now < enemy.hatHitUntil) continue;
    if (rectsOverlap({ x: hat.x - 25, y: hat.y - 10, w: 50, h: 20 }, enemy)) {
      enemy.hatHitUntil = now + 350;
      damageEnemy(enemy, 1, "hat", Math.sign(hat.vx), now);
    }
  }

  if (hat.returning && Math.hypot(hat.x - (player.x + player.w / 2), hat.y - player.y) < 36) {
    state.hat = null;
  }
}

function damageEnemy(enemy, amount, attackKind, direction, now) {
  if (enemy.behavior === "heavy" && attackKind !== "slam") {
    enemy.hitUntil = now + 130;
    enemy.vx = direction * 35;
    playSound("enemyHit");
    return;
  }
  if (enemy.armored && attackKind !== "slam" && attackKind !== "hat") {
    enemy.hitUntil = now + 110;
    enemy.vx = direction * 60;
    return;
  }
  enemy.passive = false;
  enemy.hp -= amount;
  playSound("enemyHit");
  enemy.hitUntil = now + 100;
  enemy.vx = direction * 210;
  enemy.vy = -125;
  if (enemy.hp <= 0) {
    enemy.alive = false;
    playSound("enemyDown");
    if (enemy.gatekeeper) openDoor();
    spawnDust(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 12, 1.4);
    if (enemy.dropsHealth) {
      state.pickups.push({
        kind: "health",
        x: enemy.x + enemy.w / 2 - 11,
        y: enemy.y,
        w: 22,
        h: 22,
        vy: -220,
        age: 0,
        collected: false,
      });
    }
    if (Math.random() < 0.55) player.ammo = Math.min(3, player.ammo + 1);
    updateHud();
  }
}

function openDoor() {
  if (state.doorOpen) return;
  state.doorOpen = true;
  state.doorOpenAt = performance.now();
  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.behavior !== "dash") continue;
    resetEnemyCombatState(enemy, state.doorOpenAt);
    enemy.passive = false;
  }
  state.message = "ЦЕЛЬ УНИЧТОЖЕНА · ДВЕРЬ ОТКРЫТА";
  state.messageUntil = state.doorOpenAt + 1700;
  playSound("checkpoint");
  spawnDust(obstacles[0].x + obstacles[0].w / 2, GROUND - 20, 18, 1.5);
}

function damagePlayer(amount, now) {
  if (now < player.invulnerableUntil || player.hp <= 0) return;
  player.hp = Math.max(0, player.hp - amount);
  playSound("hurt");
  player.invulnerableUntil = now + 720;
  player.vx = -player.facing * 220;
  player.vy = -230;
  updateHud();
  if (player.hp <= 0) {
    state.running = false;
    ui.defeat.showModal();
  }
}

function updateCheckpoint(now) {
  if (state.runCheckpoint.checkpoint === "boss" || player.x < 4800) return;
  state.runCheckpoint = { checkpoint: "boss", x: 4800 };
  writeSave({ checkpoint: "boss", x: 4800 });
  player.hp = Math.max(player.hp, 70);
  player.ammo = 3;
  state.message = "ЧЕКПОИНТ СОХРАНЁН · ЗДЕСЬ НАЧНЁТСЯ БОСС";
  playSound("checkpoint");
  state.messageUntil = now + 1800;
  updateHud();
}

function createBossState(now) {
  return {
    hp: 120,
    maxHp: 120,
    startedAt: now,
    nextBeatAt: now + 1200,
    beatIndex: 0,
    notes: [],
    combo: 0,
    lastGrade: "",
    gradeUntil: 0,
    hitFlashUntil: 0,
    attackUntil: 0,
    defeated: false,
  };
}

function startBossBattle(now = performance.now()) {
  state.mode = "boss";
  state.boss = createBossState(now);
  state.attacks = [];
  state.projectiles = [];
  state.enemyProjectiles = [];
  state.enemyAreas = [];
  state.pickups = [];
  state.hat = null;
  state.cameraX = 0;
  clearInputState();
  player.facing = 1;
  player.vx = 0;
  player.vy = 0;
  player.slam = false;
  setCrouching(false);
  player.hp = Math.max(player.hp, 70);
  state.message = "БОСС · ПОПАДАЙ В РИТМ НА J";
  state.messageUntil = now + 1600;
  state.running = true;
  state.lastTime = now;
  updateHud();
}

function updateBoss(dt, now) {
  const boss = state.boss;
  if (!boss || boss.defeated) return;
  while (now + BOSS_NOTE_TRAVEL >= boss.nextBeatAt) {
    const patternStep = boss.beatIndex % 8;
    if (patternStep < 5) {
      boss.notes.push({
        hitAt: boss.nextBeatAt,
        hit: false,
        missed: false,
      });
    }
    boss.nextBeatAt += patternStep === 4 ? 820 : 360;
    boss.beatIndex += 1;
  }

  for (const note of boss.notes) {
    if (!note.hit && !note.missed && now - note.hitAt > BOSS_HIT_WINDOW) {
      note.missed = true;
      boss.combo = 0;
      boss.lastGrade = "MISS";
      boss.gradeUntil = now + 520;
      boss.attackUntil = now + 220;
      damageBossPlayer(8, now);
    }
  }
  boss.notes = boss.notes.filter((note) => now - note.hitAt < 420 && !note.hit);
}

function bossHit(now = performance.now()) {
  const boss = state.boss;
  if (!boss || boss.defeated) return;
  let best = null;
  let bestDelta = Infinity;
  for (const note of boss.notes) {
    if (note.hit || note.missed) continue;
    const delta = Math.abs(note.hitAt - now);
    if (delta < bestDelta) {
      best = note;
      bestDelta = delta;
    }
  }
  if (!best || bestDelta > BOSS_HIT_WINDOW) {
    boss.combo = 0;
    boss.lastGrade = "РАНО";
    boss.gradeUntil = now + 420;
    damageBossPlayer(3, now);
    return;
  }
  best.hit = true;
  boss.combo += 1;
  const perfect = bestDelta <= 70;
  const damage = perfect ? 6 + Math.min(5, Math.floor(boss.combo / 4)) : 4;
  boss.hp = Math.max(0, boss.hp - damage);
  boss.hitFlashUntil = now + 120;
  boss.lastGrade = perfect ? "PERFECT" : "HIT";
  boss.gradeUntil = now + 520;
  playSound("tongue");
  if (boss.hp <= 0) winBoss(now);
}

function damageBossPlayer(amount, now) {
  player.hp = Math.max(0, player.hp - amount);
  player.invulnerableUntil = now + 180;
  playSound("hurt");
  updateHud();
  if (player.hp <= 0) {
    state.running = false;
    ui.defeat.showModal();
  }
}

function winBoss(now) {
  const boss = state.boss;
  boss.defeated = true;
  boss.lastGrade = "БOСС ПОВЕРЖЕН";
  boss.gradeUntil = now + 2400;
  state.message = "ПОБЕДА · ПЕРВЫЙ ПРОТОТИП ПРОЙДЕН";
  state.messageUntil = now + 2400;
  state.running = false;
  playSound("checkpoint");
  ui.victory.showModal();
}

function spawnDust(x, y, count, power) {
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x,
      y,
      vx: random(-75, 75) * power,
      vy: random(-90, -20) * power,
      life: random(230, 420),
      maxLife: 420,
      size: random(3, 7),
      color: i % 3 === 0 ? "#f0d06c" : "#c9bf9e",
    });
  }
}

function updateParticles(dt) {
  for (const particle of state.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 220 * dt;
    particle.life -= dt * 1000;
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);
}

function draw(now) {
  ctx.clearRect(0, 0, W, H);
  if (state.mode === "boss") {
    drawBoss(now);
    return;
  }
  ctx.save();
  const worldY = mobileLandscapeQuery?.matches ? MOBILE_WORLD_Y : 0;
  ctx.translate(-Math.round(state.cameraX), worldY);
  drawBackground();
  drawPlatforms();
  drawObstacles();
  drawLowCeilings();
  drawInstructions();
  drawParticles();
  drawPickups();
  drawProjectiles();
  drawEnemyAreas();
  drawEnemies(now);
  drawPlayer(now);
  drawAttacks();
  drawHat(now);
  ctx.restore();

  if (state.message && now < state.messageUntil) {
    ctx.fillStyle = "rgba(10,10,12,.9)";
    ctx.fillRect(W / 2 - 260, 92, 520, 44);
    ctx.strokeStyle = "#d9ad42";
    ctx.strokeRect(W / 2 - 260, 92, 520, 44);
    ctx.fillStyle = "#fff1b7";
    ctx.font = "bold 17px monospace";
    ctx.textAlign = "center";
    ctx.fillText(state.message, W / 2, 120);
  }
}

function drawBoss(now) {
  const boss = state.boss || createBossState(now);
  ctx.fillStyle = "#070709";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#d2a927";
  ctx.fillRect(0, 170, W, 210);
  ctx.strokeStyle = "rgba(89,68,14,.75)";
  ctx.lineWidth = 2;
  for (let x = 0; x < W; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 170);
    ctx.lineTo(x, 380);
    ctx.stroke();
  }
  for (let y = 170; y <= 380; y += 52) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  ctx.fillStyle = "#111113";
  ctx.fillRect(0, 380, W, 86);
  ctx.fillStyle = "#d9ad42";
  ctx.fillRect(0, 380, W, 4);

  const bossCx = W - 200;
  const bossCy = 306 + Math.sin(now / 180) * 4;
  ctx.fillStyle = "#101012";
  ctx.beginPath();
  ctx.arc(bossCx, bossCy, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = now < boss.hitFlashUntil ? "#ffffff" : "#f1e6c5";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = "#f1e6c5";
  ctx.beginPath();
  ctx.arc(bossCx - 18, bossCy - 18, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#08090a";
  ctx.font = "bold 24px monospace";
  ctx.textAlign = "center";
  ctx.fillText("O", bossCx - 18, bossCy - 10);
  ctx.fillStyle = "#090909";
  ctx.fillRect(bossCx - 24, bossCy + 24, 48, 7);
  if (now < boss.attackUntil) {
    ctx.strokeStyle = "#e75c49";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(bossCx, bossCy, 78, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawPlayerAvatar(185, 326, now);

  ctx.fillStyle = "rgba(10,10,12,.85)";
  ctx.fillRect(90, 64, W - 180, 36);
  ctx.strokeStyle = "#625b49";
  ctx.strokeRect(90, 64, W - 180, 36);
  ctx.fillStyle = "#d74742";
  ctx.fillRect(94, 68, (W - 188) * (boss.hp / boss.maxHp), 28);
  ctx.fillStyle = "#f4ecd5";
  ctx.font = "bold 17px monospace";
  ctx.textAlign = "center";
  ctx.fillText("БОСС: САД ЗИМНЕЙ МАМБЫ", W / 2, 89);

  const lineX = 250;
  const laneY = 450;
  ctx.strokeStyle = "#f0d06c";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(lineX, laneY - 42);
  ctx.lineTo(lineX, laneY + 42);
  ctx.stroke();
  ctx.fillStyle = "#f4ecd5";
  ctx.font = "bold 15px monospace";
  ctx.fillText("ЖМИ J В ЛИНИЮ", lineX, laneY - 58);

  ctx.strokeStyle = "#625b49";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lineX, laneY);
  ctx.lineTo(W - 95, laneY);
  ctx.stroke();

  for (const note of boss.notes) {
    if (note.hit) continue;
    const x = lineX + (note.hitAt - now) * 0.34;
    if (x < lineX - 60 || x > W + 40) continue;
    ctx.fillStyle = note.missed ? "#3b2222" : "#d74742";
    ctx.beginPath();
    ctx.arc(x, laneY, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f0d06c";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  if (boss.gradeUntil > now) {
    ctx.fillStyle = boss.lastGrade === "MISS" || boss.lastGrade === "РАНО" ? "#e75c49" : "#f0d06c";
    ctx.font = "bold 30px monospace";
    ctx.fillText(boss.lastGrade, W / 2, 140);
  }
  ctx.fillStyle = "#f4ecd5";
  ctx.font = "bold 16px monospace";
  ctx.fillText(`КОМБО: ${boss.combo}`, W / 2, 502);

  if (state.message && now < state.messageUntil) {
    ctx.fillStyle = "rgba(10,10,12,.9)";
    ctx.fillRect(W / 2 - 260, 108, 520, 44);
    ctx.strokeStyle = "#d9ad42";
    ctx.strokeRect(W / 2 - 260, 108, 520, 44);
    ctx.fillStyle = "#fff1b7";
    ctx.font = "bold 17px monospace";
    ctx.fillText(state.message, W / 2, 136);
  }
}

function drawPlayerAvatar(centerX, centerY, now) {
  ctx.save();
  const bob = Math.sin(now / 160) * 3;
  ctx.translate(centerX, centerY + bob);
  ctx.fillStyle = "#08090a";
  ctx.beginPath();
  ctx.arc(0, 0, 31, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#343434";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#f1e6c5";
  ctx.beginPath();
  ctx.arc(14, -8, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#08090a";
  ctx.font = "bold 15px monospace";
  ctx.textAlign = "center";
  ctx.fillText("8", 14, -3);
  ctx.fillStyle = "#050506";
  ctx.fillRect(3, 7, 20, 11);
  ctx.fillStyle = "#d83c3e";
  ctx.fillRect(8, 13, 14, 7);
  ctx.fillStyle = "#171719";
  ctx.fillRect(-31, -30, 62, 8);
  ctx.fillRect(-20, -39, 39, 12);
  ctx.strokeStyle = "#cbbd92";
  ctx.lineWidth = 2;
  ctx.strokeRect(-31, -30, 62, 8);
  ctx.restore();
}

function drawBackground() {
  ctx.fillStyle = "#09090b";
  ctx.fillRect(state.cameraX, 0, W, H);
  ctx.fillStyle = "#d2a927";
  ctx.fillRect(0, 210, WORLD_W, 260);
  ctx.strokeStyle = "rgba(89,68,14,.75)";
  ctx.lineWidth = 2;
  for (let x = 0; x < WORLD_W; x += 96) {
    ctx.beginPath();
    ctx.moveTo(x, 210);
    ctx.lineTo(x, GROUND);
    ctx.stroke();
  }
  for (let y = 210; y <= GROUND; y += 65) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD_W, y);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(12,12,14,.44)";
  for (let x = 340; x < WORLD_W; x += 420) {
    ctx.fillRect(x, 315, 28, 155);
    ctx.fillRect(x - 28, 350, 84, 18);
  }
}

function drawPlatforms() {
  for (const platform of platforms) {
    ctx.fillStyle = "#141416";
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    ctx.fillStyle = "#c4b37e";
    ctx.fillRect(platform.x, platform.y, platform.w, 3);
  }
  ctx.fillStyle = "#d9ad42";
  ctx.fillRect(4850, 390, 8, 80);
  ctx.fillRect(4850, 390, 70, 8);
}

function drawObstacles() {
  for (const obstacle of obstacles) {
    const openProgress = state.doorOpen
      ? Math.min(1, (performance.now() - state.doorOpenAt) / 450)
      : 0;
    const visibleHeight = obstacle.h * (1 - openProgress);
    if (visibleHeight <= 1) continue;
    ctx.fillStyle = "#28231b";
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, visibleHeight);
    ctx.fillStyle = "#5d4b28";
    ctx.fillRect(obstacle.x + 5, obstacle.y, 5, visibleHeight);
    ctx.strokeStyle = "#c4b37e";
    ctx.lineWidth = 3;
    ctx.strokeRect(obstacle.x, obstacle.y, obstacle.w, visibleHeight);
  }
}

function drawLowCeilings() {
  for (const ceiling of lowCeilings) {
    ctx.fillStyle = "#202125";
    ctx.fillRect(ceiling.x, ceiling.y, ceiling.w, ceiling.h);
    ctx.fillStyle = "#5d6068";
    ctx.fillRect(ceiling.x, ceiling.y, ceiling.w, 5);
    ctx.fillStyle = "#111216";
    ctx.fillRect(ceiling.x, ceiling.y + ceiling.h - 5, ceiling.w, 5);
    ctx.strokeStyle = "#c4b37e";
    ctx.lineWidth = 3;
    ctx.strokeRect(ceiling.x, ceiling.y, ceiling.w, ceiling.h);
    for (let x = ceiling.x + 32; x < ceiling.x + ceiling.w; x += 52) {
      ctx.fillStyle = "#85816f";
      ctx.fillRect(x, ceiling.y + 6, 5, ceiling.h - 12);
    }
  }
}

function drawInstructions() {
  ctx.textAlign = "center";
  for (const [x, title, subtitle] of instructions) {
    ctx.font = "bold 18px monospace";
    const titleWidth = ctx.measureText(title).width;
    ctx.font = "12px monospace";
    const subtitleWidth = ctx.measureText(subtitle).width;
    const width = Math.max(titleWidth, subtitleWidth) + 28;
    ctx.fillStyle = "rgba(255,252,239,.94)";
    ctx.fillRect(x - width / 2, 218, width, 64);
    ctx.strokeStyle = "#17120a";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - width / 2, 218, width, 64);
    ctx.fillStyle = "#17120a";
    ctx.font = "bold 18px monospace";
    ctx.fillText(title, x, 243);
    ctx.fillStyle = "#4b3a12";
    ctx.font = "12px monospace";
    ctx.fillText(subtitle, x, 266);
  }
}

function drawPlayer(now) {
  const blink = now < player.invulnerableUntil && Math.floor(now / 70) % 2 === 0;
  if (blink) return;
  const x = player.x;
  const y = player.y;
  const centerX = x + player.w / 2;
  const direction = player.facing;
  const bodyCenterY = y + player.h - 28;

  ctx.save();
  if (player.slam) ctx.translate(0, Math.sin(now / 25) * 2);
  ctx.fillStyle = "#08090a";
  ctx.beginPath();
  if (player.crouching) ctx.ellipse(centerX, bodyCenterY + 5, 31, 20, 0, 0, Math.PI * 2);
  else ctx.arc(centerX, bodyCenterY, 29, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = player.slam ? "#f0d06c" : "#343434";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#f1e6c5";
  ctx.beginPath();
  ctx.arc(centerX + direction * 14, bodyCenterY - 8, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#08090a";
  ctx.font = "bold 15px monospace";
  ctx.textAlign = "center";
  ctx.fillText("8", centerX + direction * 14, bodyCenterY - 3);

  ctx.fillStyle = "#050506";
  ctx.fillRect(centerX + direction * 2 - (direction < 0 ? 20 : 0), bodyCenterY + 7, 20, 11);
  ctx.fillStyle = "#d83c3e";
  ctx.fillRect(centerX + direction * 7 - (direction < 0 ? 14 : 0), bodyCenterY + 13, 14, 7);

  if (!state.hat) {
    ctx.fillStyle = "#171719";
    ctx.fillRect(centerX - 31, bodyCenterY - 30, 62, 8);
    ctx.fillRect(centerX - 20, bodyCenterY - 39, 39, 12);
    ctx.strokeStyle = "#cbbd92";
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - 31, bodyCenterY - 30, 62, 8);
  }
  ctx.restore();
}

function drawEnemies(now) {
  const colors = {
    rookie: "#ddd3b6",
    sprinter: "#e65b43",
    high: "#77b9bf",
    shield: "#d9ad42",
  };
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    const wobble = Math.sin(now / 220 + enemy.phase) * 2;
    const warning = now < enemy.warningUntil;
    const color = now < enemy.hitUntil || (warning && Math.floor(now / 55) % 2 === 0)
      ? "#ffffff"
      : colors[enemy.kind];
    const cx = enemy.x + enemy.w / 2;
    const cy = enemy.y + 28 + wobble;
    ctx.fillStyle = "#101012";
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx + (player.x < enemy.x ? -8 : 8), cy - 7, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#090909";
    ctx.fillRect(cx - 8, cy + 8, 18, 4);
    if (enemy.kind === "shield") {
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.strokeRect(enemy.x - 4, enemy.y + 8, 12, 38);
    }
    if (warning) {
      ctx.strokeStyle = "#f4ecd5";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 31 + Math.sin(now / 35) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(10,10,12,.8)";
    ctx.fillRect(enemy.x, enemy.y - 9, enemy.w, 4);
    ctx.fillStyle = color;
    ctx.fillRect(enemy.x, enemy.y - 9, enemy.w * (enemy.hp / enemy.maxHp), 4);
  }
}

function drawAttacks() {
  for (const attack of state.attacks) {
    if (attack.kind === "tongue") {
      const mouthX = player.x + player.w / 2 + attack.direction * 7;
      const mouthY = player.y + (player.crouching ? 27 : 48);
      const reach = 100 * Math.max(0, Math.min(1, attack.age / 65, (attack.duration - attack.age) / 55));
      ctx.fillStyle = "#dc3d43";
      const x = attack.direction > 0 ? mouthX : mouthX - reach;
      ctx.fillRect(x, mouthY - 6, reach, 12);
      ctx.fillStyle = "#ef6d69";
      ctx.fillRect(x, mouthY - 4, reach, 3);
    } else {
      const radius = 105 * Math.min(1, attack.age / 90);
      ctx.strokeStyle = `rgba(240,208,108,${1 - attack.age / attack.duration})`;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.ellipse(attack.x, attack.y, radius, 18, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawPickups() {
  for (const pickup of state.pickups) {
    const pulse = 1 + Math.sin(pickup.age / 120) * 0.08;
    const cx = pickup.x + pickup.w / 2;
    const cy = pickup.y + pickup.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = "#d74742";
    ctx.fillRect(-9, -4, 18, 10);
    ctx.fillRect(-5, -8, 10, 18);
    ctx.fillStyle = "#ffe1c2";
    ctx.fillRect(-2, -6, 4, 14);
    ctx.fillRect(-7, -1, 14, 4);
    ctx.restore();
  }
}

function drawProjectiles() {
  for (const shot of state.projectiles) {
    ctx.fillStyle = "#bce05b";
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, shot.r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const shot of state.enemyProjectiles) {
    ctx.fillStyle = "#e75c49";
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, shot.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEnemyAreas() {
  for (const area of state.enemyAreas) {
    const alpha = Math.max(0, 1 - area.age / area.duration);
    ctx.fillStyle = `rgba(218,63,48,${alpha * 0.2})`;
    ctx.strokeStyle = `rgba(255,219,126,${alpha})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(area.x, area.y, area.radius, 22, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawHat(now) {
  if (!state.hat) return;
  const hat = state.hat;
  ctx.save();
  ctx.translate(hat.x, hat.y);
  ctx.rotate((now / 70) * hat.direction);
  ctx.fillStyle = "#171719";
  ctx.fillRect(-25, -4, 50, 8);
  ctx.fillRect(-15, -13, 30, 12);
  ctx.strokeStyle = "#cbbd92";
  ctx.lineWidth = 2;
  ctx.strokeRect(-25, -4, 50, 8);
  ctx.restore();
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
  ctx.globalAlpha = 1;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleRectOverlap(circle, rect) {
  const x = clamp(circle.x, rect.x, rect.x + rect.w);
  const y = clamp(circle.y, rect.y, rect.y + rect.h);
  return (circle.x - x) ** 2 + (circle.y - y) ** 2 <= circle.r ** 2;
}

function lineIntersectsRect(x1, y1, x2, y2, rect) {
  const steps = 12;
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) return true;
  }
  return false;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function approach(value, target, amount) {
  if (value < target) return Math.min(target, value + amount);
  return Math.max(target, value - amount);
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

function frame(time) {
  const dt = Math.min(0.033, (time - state.lastTime) / 1000 || 0);
  state.lastTime = time;
  update(dt, time);
  draw(time);
  pressed.clear();
  requestAnimationFrame(frame);
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
  else await document.exitFullscreen?.();
}

function pauseGame() {
  if (!state.running || ui.defeat.open) return;
  state.running = false;
  clearInputState();
  ui.pause.showModal();
}

function resumeGame() {
  if (ui.pause.open) ui.pause.close();
  ensureAudio();
  state.running = true;
  state.lastTime = performance.now();
}

document.getElementById("startButton").addEventListener("click", startGame);
document.getElementById("fullscreenButton").addEventListener("click", toggleFullscreen);
document.getElementById("gameFullscreenButton").addEventListener("click", toggleFullscreen);
document.getElementById("pauseButton").addEventListener("click", pauseGame);
document.getElementById("controlsSettingsButton").addEventListener("click", startControlEdit);
document.getElementById("controlsDoneButton").addEventListener("click", finishControlEdit);
document.getElementById("controlsResetButton").addEventListener("click", resetControlLayout);
document.getElementById("resumeButton").addEventListener("click", resumeGame);
document.getElementById("pauseRestartButton").addEventListener("click", () => {
  ui.pause.close();
  resetWorld(false);
  state.running = true;
  state.lastTime = performance.now();
});
document.getElementById("retryButton").addEventListener("click", () => {
  ui.defeat.close();
  resetWorld(true);
  state.running = true;
  state.lastTime = performance.now();
});
document.getElementById("restartButton").addEventListener("click", () => {
  ui.defeat.close();
  resetWorld(false);
  state.running = true;
  state.lastTime = performance.now();
});
document.getElementById("victoryRestartButton").addEventListener("click", () => {
  ui.victory.close();
  resetWorld(false);
  state.running = true;
  state.lastTime = performance.now();
});

function bindTouchActivation(id, handler) {
  const element = document.getElementById(id);
  element.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "touch") return;
    event.preventDefault();
    handler();
  }, { passive: false });
}

bindTouchActivation("startButton", startGame);
bindTouchActivation("fullscreenButton", toggleFullscreen);
bindTouchActivation("gameFullscreenButton", toggleFullscreen);
bindTouchActivation("pauseButton", pauseGame);
bindTouchActivation("controlsSettingsButton", startControlEdit);
bindTouchActivation("controlsDoneButton", finishControlEdit);
bindTouchActivation("controlsResetButton", resetControlLayout);
bindTouchActivation("resumeButton", resumeGame);
bindTouchActivation("pauseRestartButton", () => {
  if (ui.pause.open) ui.pause.close();
  resetWorld(false);
  state.running = true;
  state.lastTime = performance.now();
});
bindTouchActivation("retryButton", () => {
  if (ui.defeat.open) ui.defeat.close();
  resetWorld(true);
  state.running = true;
  state.lastTime = performance.now();
});
bindTouchActivation("restartButton", () => {
  if (ui.defeat.open) ui.defeat.close();
  resetWorld(false);
  state.running = true;
  state.lastTime = performance.now();
});
bindTouchActivation("victoryRestartButton", () => {
  if (ui.victory.open) ui.victory.close();
  resetWorld(false);
  state.running = true;
  state.lastTime = performance.now();
});

document.querySelectorAll(".touch-button").forEach((button) => {
  const code = button.dataset.code;
  const action = button.dataset.action;
  const release = () => {
    if (code) {
      activeTouchCodes.delete(code);
      releaseInput(code);
    }
    button.classList.remove("is-pressed");
  };

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (controlsEditing) {
      draggedControl = button;
      button.setPointerCapture?.(event.pointerId);
      setControlPosition(button, event.clientX, event.clientY);
      button.classList.add("is-pressed");
      return;
    }
    ensureAudio();
    button.setPointerCapture?.(event.pointerId);
    if (action === "slam") mobileSlamAttack();
    if (code) {
      activeTouchCodes.add(code);
      pressInput(code);
    }
    button.classList.add("is-pressed");
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
  button.addEventListener("contextmenu", (event) => event.preventDefault());
});

window.addEventListener("pointermove", (event) => {
  if (!controlsEditing || !draggedControl) return;
  event.preventDefault();
  setControlPosition(draggedControl, event.clientX, event.clientY);
}, { passive: false });

window.addEventListener("pointerup", () => {
  if (!draggedControl) return;
  draggedControl.classList.remove("is-pressed");
  draggedControl = null;
});

document.querySelectorAll("button, canvas, #game-root, .hud").forEach((element) => {
  element.setAttribute("draggable", "false");
  element.setAttribute("unselectable", "on");
  element.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") event.preventDefault();
  }, { passive: false });
  element.addEventListener("touchstart", (event) => {
    event.preventDefault();
  }, { passive: false });
});

["contextmenu", "selectstart", "dragstart"].forEach((eventName) => {
  window.addEventListener(eventName, (event) => event.preventDefault(), { passive: false });
});

document.addEventListener("touchstart", (event) => {
  event.preventDefault();
}, { passive: false });

document.addEventListener("touchmove", (event) => {
  event.preventDefault();
}, { passive: false });

window.addEventListener("blur", clearInputState);
window.addEventListener("keydown", keyDown);
window.addEventListener("keyup", keyUp);

applyControlLayout();
resetWorld(false);
requestAnimationFrame(frame);
