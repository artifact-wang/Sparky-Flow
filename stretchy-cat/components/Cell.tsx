/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
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
  completionRatio: number;
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

interface SparkParticle {
  id: string;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
  palette: number;
  rotate: number;
  travelX: number;
  travelY: number;
  isNode: boolean;
}

interface SparkOrigin {
  left: number;
  top: number;
  baseAngle: number | null;
}

const seededNoise = (seed: number) => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const ChronoBeaconIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="24" cy="24" r="20" fill="#7A78FF" />
    <circle cx="24" cy="24" r="15.6" fill="#F9E7F9" />
    <circle cx="24" cy="24" r="10.5" fill="#FFFFFF" />
    <path d="M24 17v7l5 3" stroke="#5F59CC" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.5 24a9.5 9.5 0 0 1 7.2-9.2" stroke="#FFC45D" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M19.3 9.8h9.4" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
    <circle cx="33.7" cy="15.2" r="2" fill="#FF8BB6" />
    <path d="M24 11.5v2.5M16.9 14.4l1.6 1.8M31.1 14.4l-1.6 1.8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ScoutBadgeIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M24 4 38 12v14L24 44 10 26V12L24 4Z" fill="#FFFFFF" />
    <path d="M24 7.8 34.4 13.7v10.5L24 38.9 13.6 24.2V13.7L24 7.8Z" fill="#7F86FF" />
    <path d="M24 13.6 30 17v7.6L24 32l-6-7.4V17l6-3.4Z" fill="#FFC46A" />
    <path d="M24 19v7M20.5 22.5h7" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M10.2 29.2h4.4M33.4 29.2h4.4M8.8 33h6.5M32.7 33h6.5" stroke="#F7D98E" strokeWidth="2.1" strokeLinecap="round" />
  </svg>
);

const GoalIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="24" cy="24" r="22" fill="#fff" fillOpacity="0.24" />
    <rect x="21.2" y="9" width="5.2" height="28" rx="2.6" fill="#FFFFFF" />
    <path d="M25.4 13.5h11.4l-3.9 5 3.9 4.9H25.4v-9.9Z" fill="#FFFFFF" />
    <circle cx="24" cy="38.4" r="2.8" fill="#FFD07B" />
  </svg>
);

const StartIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="24" cy="24" r="22" fill="#FFFFFF" fillOpacity="0.2" />
    <circle cx="24" cy="24" r="11" fill="#FFFFFF" />
    <circle cx="24" cy="24" r="5.6" fill="#7A7DFF" />
    <path d="M24 7.5v5.3M9.4 24h5.3M24 40.5v-5.3M38.6 24h-5.3" stroke="#FFFFFF" strokeWidth="2.7" strokeLinecap="round" />
  </svg>
);

const ObstacleIcon: React.FC<{ type: CellType }> = ({ type }) => {
  if (type === CellType.WATER) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="24" cy="24" r="18" fill="#6A5EA8" />
        <path d="M13 24c3.7-4.7 7.4-6.8 11-6.8 3.7 0 7.4 2.1 11 6.8-3.6 4.8-7.3 6.8-11 6.8-3.6 0-7.3-2-11-6.8Z" stroke="#D9ECFF" strokeWidth="2.6" />
        <circle cx="24" cy="24" r="4.4" fill="#FFFFFF" />
        <path d="M14.6 14.6 33.4 33.4" stroke="#FF93BF" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === CellType.PLANT) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="10" y="11" width="28" height="26" rx="7" fill="#6F6A91" />
        <path d="M16 14v20M24 14v20M32 14v20" stroke="#F8D88E" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="16" cy="24" r="2.2" fill="#FFFFFF" />
        <circle cx="24" cy="18" r="2.2" fill="#FFFFFF" />
        <circle cx="32" cy="24" r="2.2" fill="#FFFFFF" />
      </svg>
    );
  }

  if (type === CellType.COUCH) {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="8.5" y="13" width="31" height="22" rx="8" fill="#6480BF" />
        <rect x="12.8" y="16.8" width="22.4" height="14.5" rx="6" fill="#EAF4FF" />
        <circle cx="18.2" cy="24" r="3.2" fill="#7A84DE" />
        <circle cx="29.8" cy="24" r="3.2" fill="#7A84DE" />
        <path d="M15 35.5h18" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="9.5" y="9.5" width="29" height="29" rx="7" fill="#866EA0" />
      <path d="M12.8 20h22.5M12.8 28h22.5M20 12.8v22.5M28 12.8v22.5" stroke="#FDE2A5" strokeWidth="2.3" strokeLinecap="round" />
      <circle cx="16.2" cy="16.2" r="1.7" fill="#FFFFFF" />
      <circle cx="31.8" cy="31.8" r="1.7" fill="#FFFFFF" />
    </svg>
  );
};

const SparkliHeadIcon: React.FC<{ direction: 'up' | 'down' | 'left' | 'right' }> = ({ direction }) => {
  const rotation = { up: 0, right: 90, down: 180, left: 270 }[direction];
  const gamePhaseRotationOffset = -90;
  const gamePhaseScale = 1.25;

  return (
    <div
      className="sparkli-head"
      style={{ transform: `rotate(${rotation + gamePhaseRotationOffset}deg) scale(${gamePhaseScale})` }}
      aria-hidden="true"
    >
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
  completionRatio,
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

  const trailIntensity = Math.max(0, Math.min(1, completionRatio));
  const isActiveEmitter = isInPath;
  const sparkleCount = isActiveEmitter ? 6 + Math.round(trailIntensity * 2) : 0;

  const sparkOrigins = useMemo<SparkOrigin[]>(() => {
    if (!isActiveEmitter) return [];

    const origins: SparkOrigin[] = [
      { left: 50, top: 50, baseAngle: null },
    ];
    if (connections.up) {
      origins.push({ left: 50, top: 36, baseAngle: -Math.PI * 0.5 });
      origins.push({ left: 50, top: 18, baseAngle: -Math.PI * 0.5 });
    }
    if (connections.down) {
      origins.push({ left: 50, top: 64, baseAngle: Math.PI * 0.5 });
      origins.push({ left: 50, top: 82, baseAngle: Math.PI * 0.5 });
    }
    if (connections.left) {
      origins.push({ left: 36, top: 50, baseAngle: Math.PI });
      origins.push({ left: 18, top: 50, baseAngle: Math.PI });
    }
    if (connections.right) {
      origins.push({ left: 64, top: 50, baseAngle: 0 });
      origins.push({ left: 82, top: 50, baseAngle: 0 });
    }

    return origins;
  }, [connections.down, connections.left, connections.right, connections.up, isActiveEmitter]);

  const emissionParticles = useMemo<SparkParticle[]>(() => {
    if (!isActiveEmitter || sparkleCount === 0 || sparkOrigins.length === 0) return [];

    const seedBase = (x + 1) * 101 + (y + 1) * 211 + (pathIndex + 2) * 307;
    return Array.from({ length: sparkleCount }, (_, idx) => {
      const seed = seedBase + idx * 53;
      const n1 = seededNoise(seed + 13);
      const n2 = seededNoise(seed + 17);
      const n3 = seededNoise(seed + 19);
      const n4 = seededNoise(seed + 23);
      const n5 = seededNoise(seed + 29);
      const origin = sparkOrigins[Math.floor(n5 * sparkOrigins.length) % sparkOrigins.length];
      const angle = origin.baseAngle === null ? n3 * Math.PI * 2 : origin.baseAngle + (n3 - 0.5) * 0.95;
      const travelDistance = 8 + n2 * (7 + trailIntensity * 5);
      const isNode = origin.baseAngle === null;

      return {
        id: `${idx}-${Math.round(n1 * 1000)}`,
        left: origin.left + (n1 - 0.5) * (isNode ? 2.2 : 1.6),
        top: origin.top + (n2 - 0.5) * (isNode ? 2.2 : 1.6),
        size: (isNode ? 9.6 : 7.6) + n4 * (isNode ? 4.2 : 3 + trailIntensity * 2.1),
        delay: -(n5 * 1.2),
        duration: (isNode ? 1.18 : 0.98) + n1 * 0.54,
        opacity: (isNode ? 0.68 : 0.56) + n2 * (isNode ? 0.24 : 0.3),
        palette: Math.floor(n3 * 6),
        rotate: n4 * 180,
        travelX: Math.cos(angle) * travelDistance,
        travelY: Math.sin(angle) * travelDistance,
        isNode,
      };
    });
  }, [isActiveEmitter, sparkleCount, sparkOrigins, pathIndex, trailIntensity, x, y]);

  const pathLayerStyle = useMemo(
    () =>
      ({
        '--trail-energy': trailIntensity.toFixed(3),
        '--trail-guide': (0.28 + trailIntensity * 0.2).toFixed(3),
      }) as React.CSSProperties,
    [trailIntensity],
  );

  const tileStyle: React.CSSProperties = isInPath
    ? {
        backgroundImage: `radial-gradient(circle at ${bgPos}, #FFD59B 0%, #FF8EB8 45%, #9585F5 100%)`,
        boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.45), 0 6px 14px rgba(77, 45, 116, 0.24)',
      }
    : {
        background:
          type === CellType.WATER
            ? 'linear-gradient(160deg, #6E6CB0 0%, #7D95CF 100%)'
            : [CellType.BOX, CellType.COUCH, CellType.PLANT].includes(type)
              ? 'linear-gradient(160deg, #827599 0%, #706484 100%)'
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
            <ChronoBeaconIcon />
          </div>
        );
      case CellType.YARN:
        return (
          <div className={tokenClassName}>
            <ScoutBadgeIcon />
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

  const nodeScale = Math.max(0.74, Math.min(1.24, 0.74 + trailIntensity * 0.46 + Math.min(0.08, currentPathLength * 0.008)));

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
        <div className="sparkli-path-layer" style={pathLayerStyle} aria-hidden="true">
          <div className="sparkli-emission">
            {emissionParticles.map(particle => (
              <span
                key={particle.id}
                className={`sparkli-spark sparkli-spark-${particle.palette}${particle.isNode ? ' sparkli-spark-node' : ''}`}
                style={
                  {
                    left: `${particle.left}%`,
                    top: `${particle.top}%`,
                    width: `${particle.size}px`,
                    height: `${particle.size}px`,
                    opacity: particle.opacity,
                    animationDelay: `${particle.delay}s`,
                    animationDuration: `${particle.duration}s`,
                    '--spark-rotate': `${particle.rotate}deg`,
                    '--spark-tx': `${particle.travelX}px`,
                    '--spark-ty': `${particle.travelY}px`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
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
