function canvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function distanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function createInputController({
  canvas,
  getLayout,
  onInteraction,
  onTraceStart,
  onTraceAppend,
  onTraceMove,
  onTraceEnd,
  onShuffle
}) {
  let pointerId = null;
  let tracing = false;

  function getHitNode(point, layout) {
    if (!layout || !layout.wheelNodes) {
      return -1;
    }

    const hitRadius = layout.letterHitRadius;
    for (let i = 0; i < layout.wheelNodes.length; i += 1) {
      const node = layout.wheelNodes[i];
      const d2 = distanceSquared(point, node);
      if (d2 <= hitRadius * hitRadius) {
        return i;
      }
    }

    return -1;
  }

  function inShuffleButton(point, layout) {
    if (!layout || !layout.shuffleButton) {
      return false;
    }
    const d2 = distanceSquared(point, layout.shuffleButton);
    return d2 <= layout.shuffleButton.r * layout.shuffleButton.r;
  }

  function handleDown(event) {
    const point = canvasPoint(event, canvas);
    const layout = getLayout();

    onInteraction();

    if (inShuffleButton(point, layout)) {
      onShuffle();
      return;
    }

    const nodeIndex = getHitNode(point, layout);
    if (nodeIndex === -1) {
      return;
    }

    pointerId = event.pointerId;
    tracing = true;
    canvas.setPointerCapture(pointerId);
    onTraceStart(nodeIndex, point);
  }

  function handleMove(event) {
    const point = canvasPoint(event, canvas);

    if (!tracing || event.pointerId !== pointerId) {
      onTraceMove(point);
      return;
    }

    const layout = getLayout();
    const nodeIndex = getHitNode(point, layout);
    if (nodeIndex !== -1) {
      onTraceAppend(nodeIndex, point);
    }
    onTraceMove(point);
  }

  function handleUp(event) {
    if (!tracing || event.pointerId !== pointerId) {
      return;
    }

    const point = canvasPoint(event, canvas);
    tracing = false;
    pointerId = null;
    onTraceEnd(point);
  }

  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", handleDown);
  canvas.addEventListener("pointermove", handleMove);
  canvas.addEventListener("pointerup", handleUp);
  canvas.addEventListener("pointercancel", handleUp);
  canvas.addEventListener("pointerleave", handleUp);

  return {
    destroy() {
      canvas.removeEventListener("pointerdown", handleDown);
      canvas.removeEventListener("pointermove", handleMove);
      canvas.removeEventListener("pointerup", handleUp);
      canvas.removeEventListener("pointercancel", handleUp);
      canvas.removeEventListener("pointerleave", handleUp);
    }
  };
}
