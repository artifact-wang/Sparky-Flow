import { randomInt } from "../generation/seededRng.js";

const MAX_TRAIL_POINTS = 220;
const MAX_PARTICLES = 420;
const MAX_RIPPLES = 28;
const MAX_FLYUPS = 22;

function trimOverflow(collection, maxCount) {
  while (collection.length > maxCount) {
    collection.shift();
  }
}

export function pushTrailPoint(state, x, y, options = {}) {
  const {
    burstMin = 1,
    burstMax = 2,
    speedMin = 22,
    speedMax = 84,
    sizeMin = 3,
    sizeMax = 6,
    lifeMin = 2800,
    lifeMax = 3300,
    maxLife = 3400,
    lift = -12,
    spinRange = 8,
    trailCap = MAX_TRAIL_POINTS,
    hueMin = 0,
    hueMax = 359,
    saturation = 90,
    lightness = 70,
    alphaBoost = 1
  } = options;

  const minBurst = Math.max(1, Math.floor(burstMin));
  const maxBurst = Math.max(minBurst, Math.floor(burstMax));
  const burstCount = minBurst + Math.floor(Math.random() * (maxBurst - minBurst + 1));

  for (let i = 0; i < burstCount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = speedMin + Math.random() * Math.max(0, speedMax - speedMin);
    const size = sizeMin + Math.random() * Math.max(0, sizeMax - sizeMin);
    const life = lifeMin + Math.random() * Math.max(0, lifeMax - lifeMin);
    const hue = hueMin + Math.random() * Math.max(0, hueMax - hueMin);
    state.effects.trail.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + lift,
      size,
      hue: Math.floor(hue),
      saturation,
      lightness,
      alphaBoost,
      spin: (Math.random() - 0.5) * spinRange,
      rot: Math.random() * Math.PI * 2,
      life,
      maxLife: Math.max(maxLife, life)
    });
  }

  trimOverflow(state.effects.trail, Math.max(48, Math.floor(trailCap)));
}

export function spawnParticleBurst(state, x, y, color, amount = 20) {
  for (let i = 0; i < amount; i += 1) {
    const speed = 55 + Math.random() * 160;
    const angle = Math.random() * Math.PI * 2;
    state.effects.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 25,
      drag: 0.93 + Math.random() * 0.04,
      life: 480 + Math.random() * 420,
      maxLife: 900,
      size: 3 + Math.random() * 6,
      color
    });
  }
  trimOverflow(state.effects.particles, MAX_PARTICLES);
}

export function spawnGrandCelebration(state, center, bounds, intensity = 1) {
  const colors = ["#ff5da9", "#ffce5f", "#5cc9ff", "#7ee58f", "#ffffff", "#ff8f6b"];
  const count = Math.round(26 + intensity * 16);

  for (let i = 0; i < count; i += 1) {
    const fromTop = Math.random() < 0.6;
    const x = fromTop
      ? bounds.x + Math.random() * bounds.width
      : center.x + (Math.random() - 0.5) * 90;
    const y = fromTop
      ? bounds.y - 12 - Math.random() * 36
      : center.y + (Math.random() - 0.5) * 70;
    const angle = fromTop ? Math.PI * (0.32 + Math.random() * 0.36) : Math.random() * Math.PI * 2;
    const speed = fromTop ? 120 + Math.random() * 180 : 100 + Math.random() * 140;

    state.effects.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 15,
      drag: 0.94 + Math.random() * 0.03,
      life: 780 + Math.random() * 520,
      maxLife: 1200,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      kind: "confetti",
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 10
    });
  }
  trimOverflow(state.effects.particles, MAX_PARTICLES);
}

export function spawnRipple(
  state,
  { x, y, color = "rgba(255, 136, 193, 0.7)", startRadius = 8, endRadius = 130, width = 5, life = 580 }
) {
  state.effects.ripples.push({
    x,
    y,
    color,
    startRadius,
    endRadius,
    width,
    life,
    maxLife: life
  });
  trimOverflow(state.effects.ripples, MAX_RIPPLES);
}

export function spawnWordFlyup(state, text, x, y, color = "#ff4fa3") {
  state.effects.flyups.push({
    text,
    x,
    y,
    vy: -36,
    life: 780,
    maxLife: 780,
    scale: 1,
    color
  });
  trimOverflow(state.effects.flyups, MAX_FLYUPS);
}

export function spawnSuccessBanner(
  state,
  {
    text = "Great!",
    kind = "word",
    color = "#ff4fa3",
    accent = "#ffdd73",
    life = 940,
    scale = 1
  } = {}
) {
  if (state.effects.celebrations.length >= 3) {
    state.effects.celebrations.shift();
  }
  state.effects.celebrations.push({
    text,
    kind,
    color,
    accent,
    life,
    maxLife: life,
    scale
  });
  state.effects.successPulse = Math.min(1.2, state.effects.successPulse + 0.52 * scale);
}

export function triggerAccelerationLane(state, boost = 1) {
  state.effects.laneBoost = Math.min(1.8, state.effects.laneBoost + boost * 0.42);
}

export function updateEffects(state, dtMs) {
  const dt = dtMs / 1000;

  state.effects.trail = state.effects.trail
    .map((point) => ({
      ...point,
      x: point.x + (point.vx || 0) * dt,
      y: point.y + (point.vy || 0) * dt,
      vx: (point.vx || 0) * 0.95,
      vy: ((point.vy || 0) + 14 * dt) * 0.95,
      rot: (point.rot || 0) + (point.spin || 0) * dt,
      spin: (point.spin || 0) * 0.985,
      life: point.life - dtMs
    }))
    .filter((point) => point.life > 0);

  state.effects.ripples = state.effects.ripples
    .map((ripple) => ({ ...ripple, life: ripple.life - dtMs }))
    .filter((ripple) => ripple.life > 0);

  state.effects.particles = state.effects.particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.vx * dt,
      y: particle.y + particle.vy * dt,
      vx: particle.vx * particle.drag,
      vy: (particle.vy + 140 * dt) * particle.drag,
      rot: (particle.rot || 0) + (particle.spin || 0) * dt,
      spin: (particle.spin || 0) * 0.985,
      life: particle.life - dtMs
    }))
    .filter((particle) => particle.life > 0);

  state.effects.flyups = state.effects.flyups
    .map((flyup) => ({
      ...flyup,
      y: flyup.y + flyup.vy * dt,
      vy: flyup.vy * 0.97 - 8 * dt,
      life: flyup.life - dtMs,
      scale: 1 + (1 - flyup.life / flyup.maxLife) * 0.22
    }))
    .filter((flyup) => flyup.life > 0);

  state.effects.celebrations = state.effects.celebrations
    .map((celebration) => ({
      ...celebration,
      life: celebration.life - dtMs
    }))
    .filter((celebration) => celebration.life > 0);

  state.effects.laneBoost = Math.max(0, state.effects.laneBoost - dt * 0.52);
  state.effects.lanePhase += dt * (2.8 + state.effects.laneBoost * 5.2);
  state.effects.successPulse = Math.max(0, state.effects.successPulse - dt * 1.5);

  if (state.wheel.roundClearSpin) {
    const roundClearSpinVelocity = 11.2;
    state.wheel.spinVelocity = roundClearSpinVelocity;
    state.wheel.angleOffset += state.wheel.spinVelocity * dt;
    state.wheel.glow = Math.min(2.2, state.wheel.glow + dt * 1.8);
    state.wheel.centerPulse = 0.34 + Math.sin(state.effects.lanePhase * 2.4) * 0.2;
  } else {
    state.wheel.spinVelocity *= 0.965;
    state.wheel.angleOffset += state.wheel.spinVelocity * dt;
    state.wheel.glow = Math.max(0, state.wheel.glow - dt * 1.1);
    state.wheel.centerPulse = Math.max(0, state.wheel.centerPulse - dt * 2.2);
  }

  if (state.hint.revealMs > 0) {
    state.hint.revealMs = Math.max(0, state.hint.revealMs - dtMs);
    if (state.hint.revealMs === 0) {
      state.hint.revealCellKey = null;
    }
  }

  if (state.hint.cooldownMs > 0) {
    state.hint.cooldownMs = Math.max(0, state.hint.cooldownMs - dtMs);
  }

  if (state.board && Array.isArray(state.board.cells)) {
    state.board.cells.forEach((cell) => {
      if (cell.revealDelayMs > 0) {
        cell.revealDelayMs = Math.max(0, cell.revealDelayMs - dtMs);
      } else if (cell.revealMs > 0) {
        cell.revealMs = Math.max(0, cell.revealMs - dtMs);
      }
    });
  }
}

export function shakeWheel(state, amount = 1) {
  state.wheel.spinVelocity += 2.6 * amount;
  state.wheel.glow = Math.min(1.8, state.wheel.glow + 0.45 * amount);
  state.wheel.centerPulse = 1;
}

export function emitAmbientSparkles(state, bounds, rng) {
  if (!bounds || rng() > 0.1) {
    return;
  }
  const x = bounds.x + rng() * bounds.width;
  const y = bounds.y + rng() * bounds.height;
  const color = rng() > 0.5 ? "#ffffff" : "#ffd2ef";
  const amount = randomInt(rng, 1, 2);
  spawnParticleBurst(state, x, y, color, amount);
}
