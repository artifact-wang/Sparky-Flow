/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { LevelData, Point, CellType } from '../types';
import { GAME_CONSTANTS } from '../constants';
import Cell from './Cell';

interface GridProps {
  level: LevelData;
  path: Point[];
  timeBonuses?: { id: number; x: number; y: number; text: string; color: string }[];
  collectedMap: Set<string>;
  isTreatActive: boolean;
  isYarnActive: boolean;
  levelStartTime: number;
  onCellMouseDown: (p: Point) => void;
  onCellMouseEnter: (p: Point) => void;
}

const Grid: React.FC<GridProps> = ({
  level,
  path,
  timeBonuses = [],
  collectedMap,
  isTreatActive,
  isYarnActive,
  levelStartTime,
  onCellMouseDown,
  onCellMouseEnter,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { tileSize, gap } = useMemo(() => {
    const maxDim = Math.max(level.width, level.height);
    const horizontalLimit = Math.max(260, windowSize.width - (windowSize.width < 720 ? 34 : 90));
    const reservedHeight = windowSize.width < 720 ? 430 : 390;
    const verticalLimit = Math.max(260, windowSize.height - reservedHeight);

    const containerSize = Math.min(horizontalLimit, verticalLimit);
    const gapRatio = maxDim > 10 ? 0.04 : 0.08;
    const minTileSize = 7;
    const maxTileSize = windowSize.width < 720 ? 74 : 88;
    let fittedTileSize = Math.max(minTileSize, Math.floor(containerSize / maxDim));
    let fittedGap = Math.max(1, Math.floor(fittedTileSize * gapRatio));

    while (
      fittedTileSize > minTileSize &&
      fittedTileSize * maxDim + fittedGap * (maxDim - 1) > containerSize
    ) {
      fittedTileSize -= 1;
      fittedGap = Math.max(1, Math.floor(fittedTileSize * gapRatio));
    }

    const tileSize = Math.min(fittedTileSize, maxTileSize);
    const gap = Math.max(1, Math.floor(tileSize * gapRatio));

    return {
      tileSize,
      gap,
    };
  }, [level.width, level.height, windowSize]);

  const getPathIndex = (x: number, y: number) => path.findIndex(p => p.x === x && p.y === y);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const cellElement = target?.closest('[data-cell-x]');
    if (!cellElement) return;
    const x = parseInt(cellElement.getAttribute('data-cell-x') || '0', 10);
    const y = parseInt(cellElement.getAttribute('data-cell-y') || '0', 10);
    onCellMouseEnter({ x, y });
  };

  const completionRatio = level.targetCount > 0 ? Math.min(1, path.length / level.targetCount) : 0;

  return (
    <div
      ref={gridRef}
      className="sparkli-grid"
      style={{
        gridTemplateColumns: `repeat(${level.width}, ${tileSize}px)`,
        gridTemplateRows: `repeat(${level.height}, ${tileSize}px)`,
        gap: `${gap}px`,
        touchAction: 'none',
      }}
      onTouchMove={handleTouchMove}
      onTouchStart={e => {
        if (e.cancelable) e.preventDefault();
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const cellElement = target?.closest('[data-cell-x]');
        if (!cellElement) return;
        const x = parseInt(cellElement.getAttribute('data-cell-x') || '0', 10);
        const y = parseInt(cellElement.getAttribute('data-cell-y') || '0', 10);
        onCellMouseDown({ x, y });
      }}
    >
      {timeBonuses.map(bonus => (
        <div
          key={bonus.id}
          className="sparkli-time-bonus"
          style={{
            left: `${bonus.x * (tileSize + gap) + tileSize / 2 - 34}px`,
            top: `${bonus.y * (tileSize + gap) + tileSize / 2 - 17}px`,
            width: '68px',
            height: '34px',
          }}
        >
          <span>{bonus.text}</span>
        </div>
      ))}

      {level.grid.map((row, y) =>
        row.map((cellType, x) => {
          const coordKey = `${x},${y}`;
          const pathIndex = getPathIndex(x, y);
          const isActive = cellType === CellType.TREAT ? isTreatActive : cellType === CellType.YARN ? isYarnActive : true;
          const isCollected = collectedMap.has(coordKey) || !isActive;

          let expiryMs = 0;
          if (cellType === CellType.TREAT) {
            expiryMs = GAME_CONSTANTS.TREAT_MIN_LIFETIME_MS + level.targetCount * GAME_CONSTANTS.TREAT_SCALE_FACTOR_MS;
          } else if (cellType === CellType.YARN) {
            expiryMs = GAME_CONSTANTS.YARN_MIN_LIFETIME_MS + level.targetCount * GAME_CONSTANTS.YARN_SCALE_FACTOR_MS;
          }

          const connections = { up: false, down: false, left: false, right: false };
          if (pathIndex !== -1) {
            const neighbors = [path[pathIndex - 1], path[pathIndex + 1]].filter(Boolean);
            neighbors.forEach(n => {
              if (n.x === x && n.y === y - 1) connections.up = true;
              if (n.x === x && n.y === y + 1) connections.down = true;
              if (n.x === x - 1 && n.y === y) connections.left = true;
              if (n.x === x + 1 && n.y === y) connections.right = true;
            });
          }

          let headDirection: 'up' | 'down' | 'left' | 'right' = 'right';
          if (pathIndex === path.length - 1 && path.length > 1) {
            const prev = path[path.length - 2];
            if (prev.x < x) headDirection = 'right';
            else if (prev.x > x) headDirection = 'left';
            else if (prev.y < y) headDirection = 'down';
            else if (prev.y > y) headDirection = 'up';
          }

          return (
            <div
              key={`${x}-${y}`}
              className="sparkli-cell-slot"
              style={{ width: tileSize, height: tileSize }}
              data-cell-x={x}
              data-cell-y={y}
            >
              <Cell
                type={cellType}
                isInPath={pathIndex !== -1}
                isHead={pathIndex === path.length - 1 && path.length > 0}
                isTail={pathIndex === 0 && path.length > 0}
                isCollected={isCollected}
                pathIndex={pathIndex}
                currentPathLength={path.length}
                completionRatio={completionRatio}
                connections={connections}
                headDirection={headDirection}
                levelStartTime={levelStartTime}
                expiryMs={expiryMs}
                onMouseDown={() => onCellMouseDown({ x, y })}
                onMouseEnter={() => onCellMouseEnter({ x, y })}
                x={x}
                y={y}
                gridWidth={level.width}
                gridHeight={level.height}
              />
            </div>
          );
        }),
      )}
    </div>
  );
};

export default Grid;
