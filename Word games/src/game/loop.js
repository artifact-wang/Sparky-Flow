const FIXED_STEP_MS = 1000 / 60;

export function createGameLoop(update, render) {
  let running = false;
  let rafId = 0;
  let lastTime = 0;
  let accumulator = 0;

  function frame(now) {
    if (!running) {
      return;
    }

    const delta = Math.min(50, now - lastTime);
    lastTime = now;
    accumulator += delta;

    while (accumulator >= FIXED_STEP_MS) {
      update(FIXED_STEP_MS);
      accumulator -= FIXED_STEP_MS;
    }

    render();
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running) {
      return;
    }
    running = true;
    lastTime = performance.now();
    accumulator = 0;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    if (!running) {
      return;
    }
    running = false;
    cancelAnimationFrame(rafId);
  }

  function advanceBy(ms) {
    const steps = Math.max(1, Math.round(ms / FIXED_STEP_MS));
    for (let i = 0; i < steps; i += 1) {
      update(FIXED_STEP_MS);
    }
    render();
  }

  return {
    start,
    stop,
    advanceBy
  };
}
