function roundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawShadowedCard(ctx, x, y, w, h, r, fill, stroke, shadow) {
  ctx.save();
  ctx.fillStyle = shadow;
  roundedRectPath(ctx, x + 4, y + 7, w, h, r);
  ctx.fill();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  roundedRectPath(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawBackground(ctx, width, height, palette, phase) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, palette.bgTop);
  gradient.addColorStop(0.52, "rgba(255, 228, 245, 0.95)");
  gradient.addColorStop(1, palette.bgBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  const circles = [
    { x: width * 0.13, y: height * 0.19, r: 148, c: "rgba(255,255,255,0.28)", wobble: 11 },
    { x: width * 0.78, y: height * 0.17, r: 112, c: "rgba(148, 235, 255, 0.28)", wobble: 17 },
    { x: width * 0.58, y: height * 0.74, r: 172, c: "rgba(255, 214, 229, 0.27)", wobble: 13 },
    { x: width * 0.88, y: height * 0.83, r: 92, c: "rgba(154, 247, 219, 0.25)", wobble: 15 }
  ];

  circles.forEach((circle, index) => {
    const y = circle.y + Math.sin(phase * 0.6 + index) * circle.wobble;
    ctx.fillStyle = circle.c;
    ctx.beginPath();
    ctx.arc(circle.x, y, circle.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 6; i += 1) {
    const y = height * 0.17 + i * 120 + Math.sin(phase * 1.2 + i * 0.8) * 11;
    ctx.strokeStyle = i % 2 === 0 ? "rgba(255, 255, 255, 0.7)" : "rgba(255, 188, 213, 0.6)";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(-30, y);
    ctx.quadraticCurveTo(width * 0.3, y - 18, width * 0.56, y + 10);
    ctx.quadraticCurveTo(width * 0.85, y + 30, width + 30, y + 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSparkle(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.3, -size * 0.3);
  ctx.lineTo(size, 0);
  ctx.lineTo(size * 0.3, size * 0.3);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.3, size * 0.3);
  ctx.lineTo(-size, 0);
  ctx.lineTo(-size * 0.3, -size * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function rainbowColor(hue, alpha = 1, saturation = 88, lightness = 66) {
  const normalized = ((hue % 360) + 360) % 360;
  return `hsla(${normalized}, ${saturation}%, ${lightness}%, ${alpha})`;
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function easeOutBack(value) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
}

function computeLayout(canvas, state) {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || Math.floor(canvas.width / ratio);
  const height = canvas.clientHeight || Math.floor(canvas.height / ratio);

  const topInset = 120;
  const sidePadding = Math.max(20, width * 0.02);
  const bodyY = topInset;
  const bodyHeight = Math.max(220, height - bodyY - 22);
  const boardWidth = width * 0.53;

  const boardPanel = {
    x: sidePadding,
    y: bodyY,
    width: boardWidth - sidePadding,
    height: bodyHeight
  };

  const wheelPanel = {
    x: boardPanel.x + boardPanel.width + 18,
    y: bodyY,
    width: width - (boardPanel.x + boardPanel.width + sidePadding + 18),
    height: bodyHeight
  };

  const wheelRadius = Math.min(wheelPanel.width, wheelPanel.height) * 0.35;
  const wheelCenter = {
    x: wheelPanel.x + wheelPanel.width * 0.5,
    y: wheelPanel.y + wheelPanel.height * 0.5 - 20
  };

  const letterRadius = Math.max(30, wheelRadius * 0.17);
  const angleStep = (Math.PI * 2) / Math.max(1, state.wheel.letters.length);

  const wheelNodes = state.wheel.letters.map((letter, index) => {
    const angle = state.wheel.angleOffset + angleStep * index - Math.PI / 2;
    return {
      index,
      letter,
      x: wheelCenter.x + Math.cos(angle) * wheelRadius,
      y: wheelCenter.y + Math.sin(angle) * wheelRadius,
      r: letterRadius
    };
  });

  const shuffleButton = {
    x: wheelCenter.x,
    y: wheelCenter.y,
    r: Math.max(26, wheelRadius * 0.24)
  };

  const boardAreaPadding = 28;
  const boardInner = {
    x: boardPanel.x + boardAreaPadding,
    y: boardPanel.y + boardAreaPadding,
    width: boardPanel.width - boardAreaPadding * 2,
    height: boardPanel.height - boardAreaPadding * 2
  };

  return {
    width,
    height,
    boardPanel,
    boardInner,
    wheelPanel,
    wheelCenter,
    wheelRadius,
    wheelNodes,
    shuffleButton,
    letterHitRadius: letterRadius * 1.08
  };
}

function drawBoard(ctx, state, layout, palette, timeMs, boardCellCenters) {
  const board = state.board;
  if (!board) {
    return;
  }

  const cellSize = Math.min(
    layout.boardInner.width / Math.max(board.width + 1.4, 1),
    layout.boardInner.height / Math.max(board.height + 1.8, 1)
  );
  const gap = Math.max(6, Math.floor(cellSize * 0.12));

  const totalWidth = board.width * cellSize;
  const totalHeight = board.height * cellSize;
  const originX = layout.boardInner.x + (layout.boardInner.width - totalWidth) * 0.5;
  const originY = layout.boardInner.y + (layout.boardInner.height - totalHeight) * 0.34;

  board.wordCenters = {};
  const goalWord = state.currentGoalWord
    ? board.words.find((word) => !word.solved && word.text === state.currentGoalWord)
    : null;
  const goalWordId = goalWord ? goalWord.id : -1;
  const goalPulse = 0.55 + 0.45 * Math.sin(timeMs * 0.014);

  board.words.forEach((word) => {
    let sx = 0;
    let sy = 0;
    for (let i = 0; i < word.text.length; i += 1) {
      const cx = word.x + (word.dir === "h" ? i : 0);
      const cy = word.y + (word.dir === "v" ? i : 0);
      sx += cx;
      sy += cy;
    }
    board.wordCenters[word.id] = {
      x: originX + (sx / word.text.length) * cellSize + cellSize * 0.5,
      y: originY + (sy / word.text.length) * cellSize + cellSize * 0.5
    };
  });

  board.cells.forEach((cell) => {
    const key = `${cell.x},${cell.y}`;
    const x = originX + cell.x * cellSize;
    const y = originY + cell.y * cellSize;
    const solved = cell.owners.some((ownerId) => board.words[ownerId] && board.words[ownerId].solved);
    const hinted = state.hint.revealCellKey === key;
    const goalCell = goalWordId >= 0 && !solved && cell.owners.includes(goalWordId);
    const revealActive = solved && (cell.revealDelayMs || 0) <= 0 && (cell.revealMs || 0) > 0;
    const revealProgress = revealActive ? 1 - cell.revealMs / (cell.revealMaxMs || 1) : 1;
    const revealEase = revealActive ? easeOutCubic(Math.max(0, Math.min(1, revealProgress))) : 1;
    const revealKind = cell.revealKind || "solve";

    const pulse = hinted ? 1 + Math.sin(timeMs * 0.02) * 0.08 : 1;
    const popScale = revealActive ? 1.22 - revealEase * 0.22 : 1;
    const drawW = cellSize - gap;
    const drawH = cellSize - gap;
    const cx = x + drawW * 0.5;
    const cy = y + drawH * 0.5;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse * popScale, pulse * popScale);
    drawShadowedCard(
      ctx,
      -drawW * 0.5,
      -drawH * 0.5,
      drawW,
      drawH,
      10,
      solved ? "rgba(236, 255, 246, 0.96)" : goalCell ? "rgba(255, 248, 224, 0.98)" : palette.tile,
      palette.tileBorder,
      "rgba(17,20,29,0.18)"
    );

    if (revealActive) {
      ctx.strokeStyle =
        revealKind === "hint"
          ? "rgba(95, 193, 255, 0.78)"
          : rainbowColor(timeMs * 0.18 + cell.x * 22 + cell.y * 14, 0.75, 88, 66);
      ctx.lineWidth = 2.5 + (1 - revealEase) * 2.5;
      roundedRectPath(ctx, -drawW * 0.5 - 2, -drawH * 0.5 - 2, drawW + 4, drawH + 4, 12);
      ctx.stroke();
    }

    if (goalCell) {
      const goalHue = timeMs * 0.2 + cell.x * 30 + cell.y * 18;
      ctx.strokeStyle = rainbowColor(goalHue, 0.45 + goalPulse * 0.32, 88, 65);
      ctx.lineWidth = 2 + goalPulse * 2;
      roundedRectPath(ctx, -drawW * 0.5 - 3, -drawH * 0.5 - 3, drawW + 6, drawH + 6, 12);
      ctx.stroke();
    }

    if (solved || hinted) {
      ctx.fillStyle = solved ? palette.ink : palette.primaryDark;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${Math.max(18, drawH * 0.55)}px \"Baloo 2\", \"Trebuchet MS\", sans-serif`;
      ctx.fillText(cell.char.toUpperCase(), 0, 2);
    }

    ctx.restore();
    boardCellCenters[key] = { x: cx, y: cy };
  });
}

function drawTrace(ctx, state, palette, layout, timeMs) {
  if (!state.trace.points.length) {
    return;
  }

  const points = state.trace.points;
  const baseHue = timeMs * 0.2;

  const sparkleStart = Math.max(0, points.length - 12);
  for (let i = sparkleStart; i < points.length; i += 1) {
    const point = points[i];
    if (!point) {
      continue;
    }
    const step = i - sparkleStart;
    const hue = baseHue + step * 24;
    const orbit = timeMs * 0.02 + i * 0.85;
    const sparkleX = point.x + Math.cos(orbit) * 4.8;
    const sparkleY = point.y + Math.sin(orbit * 1.2) * 4.2;
    drawSparkle(ctx, sparkleX, sparkleY, 4.2, rainbowColor(hue, 0.85, 92, 70));
  }

  if (state.trace.candidateWord) {
    ctx.save();
    ctx.font = '700 36px "Baloo 2", "Trebuchet MS", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(39, 184, 255, 0.18)";
    const display = state.trace.candidateWord;
    ctx.fillText(display, layout.wheelCenter.x, layout.wheelPanel.y + layout.wheelPanel.height - 34);
    ctx.fillStyle = "#1f2a38";
    ctx.fillText(display, layout.wheelCenter.x, layout.wheelPanel.y + layout.wheelPanel.height - 38);
    ctx.restore();
  }
}

function drawWheel(ctx, state, layout, palette, timeMs) {
  const wheelGlow = state.wheel.glow;
  const successPulse = state.effects.successPulse || 0;

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.32)";
  ctx.beginPath();
  ctx.arc(layout.wheelCenter.x, layout.wheelCenter.y, layout.wheelRadius + 20 + wheelGlow * 10, 0, Math.PI * 2);
  ctx.fill();

  const wheelGradient = ctx.createRadialGradient(
    layout.wheelCenter.x,
    layout.wheelCenter.y,
    layout.wheelRadius * 0.2,
    layout.wheelCenter.x,
    layout.wheelCenter.y,
    layout.wheelRadius * 1.05
  );
  wheelGradient.addColorStop(0, "rgba(255, 250, 238, 0.98)");
  wheelGradient.addColorStop(0.55, "rgba(209, 244, 255, 0.98)");
  wheelGradient.addColorStop(1, "rgba(255, 215, 232, 0.98)");

  ctx.fillStyle = wheelGradient;
  ctx.strokeStyle = palette.tileBorder;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(layout.wheelCenter.x, layout.wheelCenter.y, layout.wheelRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (successPulse > 0.01) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.45, successPulse * 0.36);
    ctx.strokeStyle = "rgba(255, 224, 110, 0.96)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(layout.wheelCenter.x, layout.wheelCenter.y, layout.wheelRadius + 10 + successPulse * 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  const selectedSet = new Set(state.trace.indices);

  layout.wheelNodes.forEach((node) => {
    const selected = selectedSet.has(node.index);
    const nodeHue = timeMs * 0.22 + node.index * 42;
    const fill = selected
      ? (() => {
          const gradient = ctx.createLinearGradient(node.x - node.r, node.y - node.r, node.x + node.r, node.y + node.r);
          gradient.addColorStop(0, rainbowColor(nodeHue, 0.96, 90, 68));
          gradient.addColorStop(0.5, rainbowColor(nodeHue + 122, 0.96, 90, 74));
          gradient.addColorStop(1, rainbowColor(nodeHue + 244, 0.96, 88, 66));
          return gradient;
        })()
      : "#fff";
    drawShadowedCard(
      ctx,
      node.x - node.r,
      node.y - node.r,
      node.r * 2,
      node.r * 2,
      node.r * 0.45,
      fill,
      palette.tileBorder,
      "rgba(17,20,29,0.2)"
    );
    if (selected) {
      ctx.save();
      ctx.globalAlpha = 0.2 + (Math.sin(timeMs * 0.02 + node.index * 0.8) + 1) * 0.14;
      ctx.fillStyle = "#ffffff";
      roundedRectPath(
        ctx,
        node.x - node.r + 1.8,
        node.y - node.r + 1.8,
        node.r * 2 - 3.6,
        node.r * 2 - 3.6,
        node.r * 0.42
      );
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = selected ? "#1c2534" : palette.ink;
    ctx.font = `700 ${Math.max(20, node.r * 0.9)}px \"Baloo 2\", \"Trebuchet MS\", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.letter, node.x, node.y + 1);
  });

  const pulseScale = 1 + state.wheel.centerPulse * 0.12;
  ctx.save();
  ctx.translate(layout.shuffleButton.x, layout.shuffleButton.y);
  ctx.scale(pulseScale, pulseScale);
  drawShadowedCard(
    ctx,
    -layout.shuffleButton.r,
    -layout.shuffleButton.r,
    layout.shuffleButton.r * 2,
    layout.shuffleButton.r * 2,
    layout.shuffleButton.r * 0.5,
    "#ffffff",
    palette.tileBorder,
    "rgba(17,20,29,0.25)"
  );
  ctx.fillStyle = palette.tileBorder;
  ctx.font = `700 ${Math.max(20, layout.shuffleButton.r * 0.85)}px \"Baloo 2\", \"Trebuchet MS\", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("⟳", 0, 2);
  ctx.restore();
  ctx.restore();
}

function drawEffects(ctx, state, layout, timeMs) {
  state.effects.ripples.forEach((ripple) => {
    const lifeRatio = ripple.life / ripple.maxLife;
    const progress = 1 - lifeRatio;
    const radius = ripple.startRadius + (ripple.endRadius - ripple.startRadius) * progress;
    ctx.save();
    ctx.globalAlpha = Math.pow(lifeRatio, 1.15);
    ctx.strokeStyle = ripple.color;
    ctx.lineWidth = Math.max(1.5, ripple.width - progress * 2);
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  state.effects.trail.forEach((point) => {
    const alpha = point.life / point.maxLife;
    const hue = (point.hue || 0) + timeMs * 0.08 + alpha * 80;
    const sparkleSize = (point.size || 4) * (0.85 + alpha * 0.45);
    const color = rainbowColor(hue, Math.max(0.12, alpha * 0.95), 90, 70);
    drawSparkle(ctx, point.x, point.y, sparkleSize, color);
    drawSparkle(
      ctx,
      point.x + Math.cos((point.rot || 0) * 1.3) * 2.2,
      point.y + Math.sin((point.rot || 0) * 1.1) * 2.2,
      sparkleSize * 0.62,
      rainbowColor(hue + 64, Math.max(0.08, alpha * 0.72), 94, 76)
    );
  });

  state.effects.particles.forEach((particle) => {
    const alpha = particle.life / particle.maxLife;
    ctx.fillStyle = particle.color.startsWith("rgba") ? particle.color : `${particle.color}`;
    ctx.globalAlpha = Math.max(0.08, alpha);
    if (particle.kind === "confetti") {
      const w = particle.size * (0.75 + alpha * 0.55);
      const h = w * 0.62;
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rot || 0);
      roundedRectPath(ctx, -w * 0.5, -h * 0.5, w, h, Math.max(1, h * 0.2));
      ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });

  state.effects.flyups.forEach((flyup) => {
    const alpha = flyup.life / flyup.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(flyup.x, flyup.y);
    ctx.scale(flyup.scale, flyup.scale);
    ctx.shadowColor = "rgba(255,255,255,0.35)";
    ctx.shadowBlur = 6;
    ctx.font = '700 32px "Baloo 2", "Trebuchet MS", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = flyup.color;
    ctx.fillText(flyup.text, 0, 0);
    ctx.restore();
  });

  state.effects.celebrations.forEach((celebration, index) => {
    const lifeRatio = celebration.life / celebration.maxLife;
    const progress = Math.max(0, Math.min(1, 1 - lifeRatio));
    const inEase = easeOutBack(Math.min(1, progress * 3.2));
    const outEase = lifeRatio < 0.26 ? lifeRatio / 0.26 : 1;
    const scale = celebration.scale * (0.82 + inEase * 0.3) * outEase;
    const x = layout.width * 0.5;
    const y = layout.boardPanel.y + 56 + index * 52;
    const w = Math.min(450, layout.width * 0.34);
    const h = 58;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = Math.min(1, lifeRatio * 1.15);
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    roundedRectPath(ctx, -w * 0.5, -h * 0.5, w, h, 24);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = celebration.color;
    ctx.stroke();

    ctx.fillStyle = celebration.color;
    ctx.font = '800 33px "Baloo 2", "Trebuchet MS", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(celebration.text, 0, 1);

    drawSparkle(ctx, -w * 0.42, 0, 8, celebration.accent);
    drawSparkle(ctx, w * 0.42, 0, 8, celebration.accent);
    ctx.restore();
  });
}

function drawAccelerationLanes(ctx, state, layout) {
  if (state.effects.laneBoost <= 0.01) {
    return;
  }

  const strength = state.effects.laneBoost;
  ctx.save();
  ctx.globalAlpha = Math.min(0.4, strength * 0.22);
  const laneCount = 7;
  for (let i = 0; i < laneCount; i += 1) {
    const offset = ((state.effects.lanePhase * 150 + i * 44) % (layout.wheelPanel.width + 220)) - 110;
    const y = layout.wheelPanel.y + 38 + i * ((layout.wheelPanel.height - 75) / laneCount);
    ctx.strokeStyle = i % 2 === 0 ? "rgba(39, 184, 255, 0.84)" : "rgba(255, 138, 184, 0.76)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(layout.wheelPanel.x + offset, y);
    ctx.lineTo(layout.wheelPanel.x + offset + 96 + strength * 60, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function createRenderer(canvas, theme) {
  const ctx = canvas.getContext("2d");
  let layout = null;
  let phase = 0;
  const boardCellCenters = {};
  let lastState = null;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(900, window.innerWidth);
    const height = Math.max(580, window.innerHeight);
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    layout = null;
  }

  function render(state, nowMs = performance.now()) {
    layout = computeLayout(canvas, state);
    lastState = state;

    phase += 0.01;
    const palette = theme.palette;

    drawBackground(ctx, layout.width, layout.height, palette, phase);

    drawShadowedCard(
      ctx,
      layout.boardPanel.x,
      layout.boardPanel.y,
      layout.boardPanel.width,
      layout.boardPanel.height,
      28,
      "rgba(255, 251, 243, 0.8)",
      "rgba(255, 255, 255, 0.95)",
      "rgba(17,20,29,0.14)"
    );

    drawShadowedCard(
      ctx,
      layout.wheelPanel.x,
      layout.wheelPanel.y,
      layout.wheelPanel.width,
      layout.wheelPanel.height,
      28,
      "rgba(245, 252, 255, 0.7)",
      "rgba(255, 255, 255, 0.95)",
      "rgba(17,20,29,0.12)"
    );

    drawAccelerationLanes(ctx, state, layout);
    drawBoard(ctx, state, layout, palette, nowMs, boardCellCenters);
    drawWheel(ctx, state, layout, palette, nowMs);
    drawTrace(ctx, state, palette, layout, nowMs);
    drawEffects(ctx, state, layout, nowMs);

    ctx.save();
    ctx.fillStyle = "rgba(37, 43, 56, 0.62)";
    ctx.font = '700 24px "Baloo 2", "Trebuchet MS", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("Swipe to spell words", layout.wheelCenter.x, layout.wheelPanel.y + layout.wheelPanel.height - 14);
    ctx.restore();
  }

  return {
    resize,
    render,
    getLayout() {
      if (!layout) {
        layout = computeLayout(canvas, lastState || { wheel: { letters: [] } });
      }
      return layout;
    },
    getCellCenter(cellKey) {
      return boardCellCenters[cellKey] || null;
    },
    getWordCenter(wordId, state) {
      if (!state.board || !state.board.wordCenters) {
        return null;
      }
      return state.board.wordCenters[wordId] || null;
    }
  };
}
