/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { CellType, Point, LevelData } from '../types';
import { GAME_CONSTANTS } from '../constants';


/**
 * Generates a level by first constructing a Hamiltonian path on a subset of the grid.
 */
export const generateLevel = (levelIndex: number): LevelData => {
  const baseSize = GAME_CONSTANTS.BASE_GRID_SIZE;
  const legacyCeilingLevel = GAME_CONSTANTS.CLOCK_CHANCE_REDUCTION_LEVEL;
  const legacyGrowth = Math.floor((Math.min(levelIndex, legacyCeilingLevel) - 1) / 3);
  const legacySize = Math.min(GAME_CONSTANTS.MAX_GRID_SIZE, baseSize + legacyGrowth);
  const postLevelStep = Math.max(0, levelIndex - legacyCeilingLevel);
  const postLevelGrowth =
    postLevelStep > 0
      ? Math.ceil(postLevelStep / GAME_CONSTANTS.POST_LEVEL_GRID_GROWTH_INTERVAL)
      : 0;
  const width = legacySize + postLevelGrowth;
  const height = legacySize + postLevelGrowth;

  const legacyDensityAtThreshold = Math.min(
    GAME_CONSTANTS.TARGET_DENSITY_MAX,
    GAME_CONSTANTS.TARGET_DENSITY_BASE + (legacyCeilingLevel * GAME_CONSTANTS.TARGET_DENSITY_INCREMENT),
  );
  const targetDensity =
    levelIndex <= legacyCeilingLevel
      ? Math.min(
          GAME_CONSTANTS.TARGET_DENSITY_MAX,
          GAME_CONSTANTS.TARGET_DENSITY_BASE + (levelIndex * GAME_CONSTANTS.TARGET_DENSITY_INCREMENT),
        )
      : Math.min(
          GAME_CONSTANTS.POST_LEVEL_TARGET_DENSITY_MAX,
          legacyDensityAtThreshold + (postLevelStep * GAME_CONSTANTS.POST_LEVEL_TARGET_DENSITY_INCREMENT),
        );
  const targetLength = Math.max(2, Math.floor(width * height * targetDensity));

  const createSerpentinePath = (gridWidth: number, gridHeight: number): Point[] => {
    const route: Point[] = [];
    for (let y = 0; y < gridHeight; y++) {
      if (y % 2 === 0) {
        for (let x = 0; x < gridWidth; x++) route.push({ x, y });
      } else {
        for (let x = gridWidth - 1; x >= 0; x--) route.push({ x, y });
      }
    }
    return route;
  };

  const isSamePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
  const isEdgeCell = (p: Point, gridWidth: number, gridHeight: number) =>
    p.x === 0 || p.y === 0 || p.x === gridWidth - 1 || p.y === gridHeight - 1;

  const rotateAndMirrorPath = (route: Point[], gridWidth: number, gridHeight: number): Point[] => {
    const canTranspose = gridWidth === gridHeight;
    const transpose = canTranspose && Math.random() < 0.5;
    const mirrorX = Math.random() < 0.5;
    const mirrorY = Math.random() < 0.5;

    const transformed = route.map(point => {
      let x = point.x;
      let y = point.y;
      if (transpose) {
        const nextX = y;
        const nextY = x;
        x = nextX;
        y = nextY;
      }
      if (mirrorX) x = gridWidth - 1 - x;
      if (mirrorY) y = gridHeight - 1 - y;
      return { x, y };
    });

    return Math.random() < 0.5 ? transformed.reverse() : transformed;
  };

  const randomizeHamiltonianPath = (route: Point[], gridWidth: number, gridHeight: number): Point[] => {
    let path = rotateAndMirrorPath(route, gridWidth, gridHeight);
    const shuffleSteps = Math.max(path.length * 8, 120);

    const neighborsOf = (p: Point): Point[] =>
      [
        { x: p.x + 1, y: p.y },
        { x: p.x - 1, y: p.y },
        { x: p.x, y: p.y + 1 },
        { x: p.x, y: p.y - 1 },
      ].filter(n => n.x >= 0 && n.x < gridWidth && n.y >= 0 && n.y < gridHeight);

    for (let step = 0; step < shuffleSteps; step++) {
      if (path.length < 4) break;

      const useHead = Math.random() < 0.5;
      const endpoint = useHead ? path[0] : path[path.length - 1];
      const fixedNeighbor = useHead ? path[1] : path[path.length - 2];

      const candidates = neighborsOf(endpoint).filter(n => !isSamePoint(n, fixedNeighbor));
      if (candidates.length === 0) continue;

      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      const pivotIndex = path.findIndex(point => isSamePoint(point, chosen));
      if (pivotIndex <= 0 || pivotIndex >= path.length - 1) continue;

      if (useHead) {
        if (pivotIndex === 1) continue;
        path = [...path.slice(1, pivotIndex).reverse(), path[0], ...path.slice(pivotIndex)];
      } else {
        if (pivotIndex === path.length - 2) continue;
        path = [
          ...path.slice(0, pivotIndex + 1),
          path[path.length - 1],
          ...path.slice(pivotIndex + 1, path.length - 1).reverse(),
        ];
      }
    }

    return path;
  };

  const selectSegment = (route: Point[], segmentLength: number, gridWidth: number, gridHeight: number): Point[] => {
    if (segmentLength >= route.length) return route;

    const maxStart = route.length - segmentLength;
    const starts = Array.from({ length: maxStart + 1 }, (_, i) => i);

    const interiorEndpointStarts = starts.filter(start => {
      const head = route[start];
      const tail = route[start + segmentLength - 1];
      return !isEdgeCell(head, gridWidth, gridHeight) && !isEdgeCell(tail, gridWidth, gridHeight);
    });

    const candidateStarts = interiorEndpointStarts.length > 0 ? interiorEndpointStarts : starts;
    const chosenStart = candidateStarts[Math.floor(Math.random() * candidateStarts.length)];
    return route.slice(chosenStart, chosenStart + segmentLength);
  };

  const finalizeLevelFromPath = (path: Point[]): LevelData => {
    const grid: CellType[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => CellType.BOX),
    );

    path.forEach((p, idx) => {
      if (idx === 0) {
        grid[p.y][p.x] = CellType.START;
      } else if (idx === path.length - 1) {
        grid[p.y][p.x] = CellType.SAUCER;
      } else {
        grid[p.y][p.x] = CellType.EMPTY;
      }
    });

    let collectiblesPlaced = 0;
    const pathIndices = Array.from({ length: path.length - 2 }, (_, i) => i + 1);
    for (let i = pathIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pathIndices[i], pathIndices[j]] = [pathIndices[j], pathIndices[i]];
    }

    const clockChance =
      levelIndex > GAME_CONSTANTS.CLOCK_CHANCE_REDUCTION_LEVEL
        ? GAME_CONSTANTS.CLOCK_COLLECTIBLE_CHANCE / 2
        : GAME_CONSTANTS.CLOCK_COLLECTIBLE_CHANCE;

    for (const idx of pathIndices) {
      if (collectiblesPlaced >= GAME_CONSTANTS.MAX_COLLECTIBLES_PER_LEVEL) break;

      if (Math.random() < GAME_CONSTANTS.COLLECTIBLE_SPAWN_CHANCE) {
        const p = path[idx];
        grid[p.y][p.x] = Math.random() < clockChance ? CellType.TREAT : CellType.YARN;
        collectiblesPlaced++;
      }
    }

    if (GAME_CONSTANTS.WALLS_KILL_YOU)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (grid[y][x] === CellType.BOX) {
            grid[y][x] = CellType.WATER;
          }
        }
      }

    return {
      id: levelIndex,
      width,
      height,
      grid,
      startPoint: path[0],
      targetCount: path.length,
      title: `Room ${levelIndex}`,
      flavor: levelIndex > 12 ? 'Uncharted routes keep unfolding.' : levelIndex > 10 ? 'A true test of flexibility!' : 'Just a cozy little stretch.',
      roomTheme: '#FFFFFF',
    };
  };

  if (levelIndex > legacyCeilingLevel) {
    const baseRoute = createSerpentinePath(width, height);
    const shuffledRoute = randomizeHamiltonianPath(baseRoute, width, height);
    const selectedPath = selectSegment(shuffledRoute, targetLength, width, height);
    return finalizeLevelFromPath(selectedPath);
  }

  let attempts = 0;
  while (attempts < 200) {
    attempts++;

    const startPoint = { 
      x: Math.floor(Math.random() * width), 
      y: Math.floor(Math.random() * height) 
    };

    const path: Point[] = [startPoint];
    const visited = new Set<string>([`${startPoint.x},${startPoint.y}`]);

    // Randomized DFS to find a Hamiltonian path of targetLength
    const findPath = (curr: Point): boolean => {
      if (path.length === targetLength) return true;

      const neighbors = [
        { x: curr.x + 1, y: curr.y },
        { x: curr.x - 1, y: curr.y },
        { x: curr.x, y: curr.y + 1 },
        { x: curr.x, y: curr.y - 1 }
      ].filter(n => 
        n.x >= 0 && n.x < width && n.y >= 0 && n.y < height && 
        !visited.has(`${n.x},${n.y}`)
      );

      // Shuffle neighbors for variety
      for (let i = neighbors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
      }

      for (const next of neighbors) {
        visited.add(`${next.x},${next.y}`);
        path.push(next);
        if (findPath(next)) return true;
        path.pop();
        visited.delete(`${next.x},${next.y}`);
      }

      return false;
    };

    if (findPath(startPoint)) return finalizeLevelFromPath(path);
  }

  const fallbackRoute = randomizeHamiltonianPath(createSerpentinePath(width, height), width, height);
  const fallbackPath = selectSegment(fallbackRoute, targetLength, width, height);
  return finalizeLevelFromPath(fallbackPath);
};
