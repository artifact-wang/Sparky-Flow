/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { CellType } from '../types';
import SparkliCharacter from './SparkliCharacter';

interface CellProps {
  type: CellType;
  isInPath: boolean;
  isHead: boolean;
  isTail: boolean;
  isCollected: boolean;
  pathIndex: number;
  currentPathLength: number;
  connections: { up: boolean; down: boolean; left: boolean; right: boolean };
  headDirection: 'up' | 'down' | 'left' | 'right';
  levelStartTime: number;
  expiryMs: number;
  onMouseDown: () => void;
  onMouseEnter: () => void;
  x: number;
  y: number;
  gridWidth: number;
  gridHeight: number;
}

const TreatIcon = () => (
  <svg viewBox="0 0 48 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M24.4 2.1c8.3-1.3 15.5 2.2 21 11.2.8 1.3.8 2.9 0 4.2-5 8.2-12.2 11.4-20.2 10.7-6.5-.6-12.7-3.8-18-8.2-1.5 1.6-2.9 3.3-4.1 5.1-.9 1.2-2.6 1.4-3.8.5-1.2-.9-1.4-2.6-.5-3.8 1.3-1.8 2.7-3.5 4.1-5L.6 13.4C-.5 12.4-.5 10.8.5 9.7c1-1.1 2.6-1.2 3.7-.2l4.3 3.8c5.3-4.6 10.8-9.7 15.9-11.2Z"
      fill="#FFFFFF"
    />
    <circle cx="30" cy="13" r="2.8" fill="#FF7D9E" />
  </svg>
);

const YarnIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="24" cy="24" r="20" fill="#FFFFFF" />
    <path d="M9 24c4-6 10-10 15-10 6 0 11 4 15 10" stroke="#FF7CA8" strokeWidth="3" strokeLinecap="round" />
    <path d="M11 31c4 3 8 5 13 5 5 0 9-2 13-5" stroke="#7D8BFF" strokeWidth="3" strokeLinecap="round" />
    <path d="M15 13c4 3 6 7 6 11 0 5-2 9-5 13" stroke="#FFC04D" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const GoalIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="24" cy="24" r="22" fill="#ffffff" fillOpacity="0.25" />
    <path d="M17 36V11h3.6v25H17Zm6.5-17.7h13l-4.3 5.3 4.3 5.2h-13v-10.5Z" fill="#FFFFFF" />
  </svg>
);

const StartIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="24" cy="24" r="22" fill="#FFFFFF" fillOpacity="0.2" />
    <circle cx="24" cy="28" r="8" fill="#FFFFFF" />
    <circle cx="14" cy="19" r="4" fill="#FFFFFF" />
    <circle cx="22" cy="15" r="4" fill="#FFFFFF" />
    <circle cx="30" cy="15" r="4" fill="#FFFFFF" />
    <circle cx="38" cy="19" r="4" fill="#FFFFFF" />
  </svg>
);

const ObstacleIcon: React.FC<{ type: CellType }> = ({ type }) => {
  if (type === CellType.WATER) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M8 20c3-3 6-3 9 0s6 3 9 0 6-3 9 0 6 3 9 0" stroke="#B6DBFF" strokeWidth="3" strokeLinecap="round" />
        <path d="M8 28c3-3 6-3 9 0s6 3 9 0 6-3 9 0 6 3 9 0" stroke="#D3EBFF" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === CellType.PLANT) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="16" y="28" width="16" height="10" rx="4" fill="#DEAD6A" />
        <path d="M24 16c0 8-5 11-9 11 0-7 4-11 9-11Z" fill="#8CDA8D" />
        <path d="M24 12c0 8 5 11 9 11 0-7-4-11-9-11Z" fill="#77C97B" />
      </svg>
    );
  }

  if (type === CellType.COUCH) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="8" y="20" width="32" height="14" rx="5" fill="#D2DBF8" />
        <rect x="12" y="16" width="10" height="8" rx="3" fill="#E5EBFF" />
        <rect x="26" y="16" width="10" height="8" rx="3" fill="#E5EBFF" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="10" y="10" width="28" height="28" rx="6" fill="#E9D0B0" />
      <path d="M12 20h24M12 28h24M20 12v24M28 12v24" stroke="#C79A62" strokeWidth="2" />
    </svg>
  );
};

const SparkliHeadIcon: React.FC<{ direction: 'up' | 'down' | 'left' | 'right' }> = ({ direction }) => {
  const rotation = { up: 0, right: 90, down: 180, left: 270 }[direction];

  return (
    <div className="sparkli-head" style={{ transform: `rotate(${rotation}deg)` }} aria-hidden="true">
      <SparkliCharacter variant="head" />
    </div>
  );
};

const Cell: React.FC<CellProps> = ({
  type,
  isInPath,
  isHead,
  isTail,
  isCollected,
  pathIndex,
  currentPathLength,
  connections,
  headDirection,
  levelStartTime,
  expiryMs,
  onMouseDown,
  onMouseEnter,
  x,
  y,
  gridWidth,
  gridHeight,
}) => {
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (isCollected || (type !== CellType.TREAT && type !== CellType.YARN) || levelStartTime === 0) {
      setIsWarning(false);
      return;
    }

    const updateWarning = () => {
      const elapsed = Date.now() - levelStartTime;
      const remaining = expiryMs - elapsed;
      setIsWarning(remaining <= 1000 && remaining > 0);
    };

    const interval = setInterval(updateWarning, 100);
    updateWarning();
    return () => clearInterval(interval);
  }, [isCollected, type, levelStartTime, expiryMs]);

  const bgPos = useMemo(() => {
    const posX = gridWidth > 1 ? (x / (gridWidth - 1)) * 100 : 0;
    const posY = gridHeight > 1 ? (y / (gridHeight - 1)) * 100 : 0;
    return `${posX}% ${posY}%`;
  }, [x, y, gridWidth, gridHeight]);

  const tileStyle: React.CSSProperties = isInPath
    ? {
        backgroundImage: `radial-gradient(circle at ${bgPos}, #FFD59B 0%, #FF8EB8 45%, #9585F5 100%)`,
        boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.45), 0 6px 14px rgba(77, 45, 116, 0.24)',
      }
    : {
        background:
          type === CellType.WATER
            ? 'linear-gradient(155deg, #73B7FF 0%, #9AD7FF 100%)'
            : [CellType.BOX, CellType.COUCH, CellType.PLANT].includes(type)
              ? 'linear-gradient(160deg, #90839f 0%, #80758f 100%)'
              : type === CellType.START
                ? 'linear-gradient(150deg, #7E95FF 0%, #A58BFF 100%)'
                : 'linear-gradient(150deg, #FFF5D7 0%, #FFE9C4 100%)',
        boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.52), 0 5px 12px rgba(58, 44, 79, 0.16)',
      };

  const renderObject = () => {
    if (isCollected) return null;

    const tokenClassName = `sparkli-cell-token ${isWarning ? 'is-warning' : ''}`;

    switch (type) {
      case CellType.TREAT:
        return (
          <div className={tokenClassName}>
            <TreatIcon />
          </div>
        );
      case CellType.YARN:
        return (
          <div className={tokenClassName}>
            <YarnIcon />
          </div>
        );
      case CellType.SAUCER:
        return (
          <div className="sparkli-cell-token sparkli-goal-token">
            <GoalIcon />
          </div>
        );
      case CellType.START:
        return !isInPath ? (
          <div className="sparkli-cell-token sparkli-start-token">
            <StartIcon />
          </div>
        ) : null;
      case CellType.WATER:
      case CellType.COUCH:
      case CellType.PLANT:
      case CellType.BOX:
        return (
          <div className="sparkli-obstacle-token">
            <ObstacleIcon type={type} />
          </div>
        );
      default:
        return null;
    }
  };

  const nodeScale = Math.max(0.78, Math.min(1, currentPathLength / 5));

  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      className="sparkli-cell"
      style={tileStyle}
      aria-label={`cell ${x},${y} ${type}`}
      data-cell-type={type}
      data-path-index={pathIndex}
    >
      {renderObject()}

      {isInPath && (
        <div className="sparkli-path-layer" aria-hidden="true">
          {!isHead && !isTail && <div className="sparkli-path-node" style={{ transform: `scale(${nodeScale})` }} />}
          {connections.up && <div className="sparkli-link sparkli-link-up" />}
          {connections.down && <div className="sparkli-link sparkli-link-down" />}
          {connections.left && <div className="sparkli-link sparkli-link-left" />}
          {connections.right && <div className="sparkli-link sparkli-link-right" />}
          {isHead && <SparkliHeadIcon direction={headDirection} />}
          {isTail && <div className="sparkli-tail-dot" />}
        </div>
      )}
    </button>
  );
};

export default Cell;
