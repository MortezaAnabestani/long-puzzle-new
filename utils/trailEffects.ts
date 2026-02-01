/**
 * Trail Effects System for Puzzle Pieces
 *
 * This module creates smooth, natural-looking motion trail effects for puzzle pieces
 * as they move across the canvas. Each movement type has a unique visual style:
 *
 * - STANDARD: Subtle blue-white ghosting effect for elegant transitions
 * - FLIGHT: Sky-blue trails with motion blur, simulating flight through air
 * - WAVE: Turquoise trails with wave distortion for fluid ocean-like movement
 * - PLAYFUL: Pink-tinted trails with bounce effects for cheerful animations
 * - VORTEX: Purple spiral trails for dramatic spinning effects
 * - ELASTIC: Golden trails with stretch effects for snappy, elastic movement
 *
 * All effects are designed to be delicate, eye-pleasing, and highly natural.
 */

import { Piece } from '../hooks/usePuzzleLogic';
import { MovementType } from '../types';

interface TrailPoint {
  x: number;
  y: number;
  rot: number;
  alpha: number;
  scale: number;
  timestamp: number;
}

interface PieceTrail {
  points: TrailPoint[];
  lastUpdateTime: number;
}

// Trail history storage for each piece
const trailHistory = new Map<number, PieceTrail>();

// Configuration for each movement type
const TRAIL_CONFIG = {
  [MovementType.STANDARD]: {
    enabled: true,
    maxPoints: 2,
    spacing: 100, // ms between trail points - increased for better performance
    fadeSpeed: 0.3,
    blurAmount: 4,
    colorTint: 'rgba(200, 200, 255, 0.06)', // Subtle blue-white tint
    scaleReduction: 0.04
  },
  [MovementType.FLIGHT]: {
    enabled: true,
    maxPoints: 3,
    spacing: 80,
    fadeSpeed: 0.25,
    blurAmount: 6,
    colorTint: 'rgba(135, 206, 250, 0.12)', // Sky blue tint - softer
    scaleReduction: 0.04,
    motionBlur: true
  },
  [MovementType.WAVE]: {
    enabled: true,
    maxPoints: 3,
    spacing: 85,
    fadeSpeed: 0.28,
    blurAmount: 5,
    colorTint: 'rgba(64, 224, 208, 0.1)', // Turquoise tint - softer
    scaleReduction: 0.03,
    waveDistortion: true
  },
  [MovementType.PLAYFUL]: {
    enabled: true,
    maxPoints: 2,
    spacing: 90,
    fadeSpeed: 0.3,
    blurAmount: 4,
    colorTint: 'rgba(255, 182, 193, 0.08)', // Light pink tint - softer
    scaleReduction: 0.04,
    bounce: true
  },
  [MovementType.VORTEX]: {
    enabled: true,
    maxPoints: 3,
    spacing: 75,
    fadeSpeed: 0.25,
    blurAmount: 7,
    colorTint: 'rgba(138, 43, 226, 0.1)', // Purple tint - softer
    scaleReduction: 0.05,
    spiral: true
  },
  [MovementType.ELASTIC]: {
    enabled: true,
    maxPoints: 2,
    spacing: 100,
    fadeSpeed: 0.35,
    blurAmount: 4,
    colorTint: 'rgba(255, 215, 0, 0.06)', // Gold tint - softer
    scaleReduction: 0.04,
    stretch: true
  }
};

/**
 * Update trail history for a piece
 * Optimized: Only track trails for pieces with significant movement
 */
export const updateTrailHistory = (
  piece: Piece,
  x: number,
  y: number,
  rot: number,
  scale: number,
  currentTime: number,
  movement: MovementType,
  tProgress: number
) => {
  const config = TRAIL_CONFIG[movement];
  if (!config?.enabled) return;

  // Performance optimization: Only create trails during active movement (10%-85%)
  // Skip when pieces are just starting or nearly done
  if (tProgress < 0.1 || tProgress > 0.85) return;

  let trail = trailHistory.get(piece.id);

  if (!trail) {
    trail = { points: [], lastUpdateTime: 0 };
    trailHistory.set(piece.id, trail);
  }

  // Only add new point if enough time has passed
  if (currentTime - trail.lastUpdateTime >= config.spacing) {
    trail.points.push({
      x,
      y,
      rot,
      alpha: 1.0,
      scale,
      timestamp: currentTime
    });

    // Keep only the most recent points
    if (trail.points.length > config.maxPoints) {
      trail.points.shift();
    }

    trail.lastUpdateTime = currentTime;
  }

  // Quick fade update - simpler calculation
  const maxAge = config.maxPoints * config.spacing;
  trail.points.forEach((point) => {
    const age = currentTime - point.timestamp;
    point.alpha = Math.max(0, 1 - (age / maxAge));
  });
};

/**
 * Render trail effects for a piece
 * Optimized: Minimal draw calls and calculations
 */
export const renderTrailEffect = (
  ctx: CanvasRenderingContext2D,
  piece: Piece,
  movement: MovementType
) => {
  const config = TRAIL_CONFIG[movement];
  if (!config?.enabled) return;

  const trail = trailHistory.get(piece.id);
  if (!trail || trail.points.length === 0) return;

  // Skip if canvas not ready
  if (!piece.cachedCanvas) return;

  ctx.save();

  // Render trail points from oldest to newest
  const len = trail.points.length;
  for (let i = 0; i < len; i++) {
    const point = trail.points[i];

    // Skip invisible trails
    if (point.alpha <= 0.05) continue;

    const relativeAlpha = i / len;
    const finalAlpha = point.alpha * relativeAlpha * 0.4;

    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(point.rot);

    // Simple scale calculation
    const trailScale = point.scale * (0.9 - config.scaleReduction * (len - i));
    ctx.scale(trailScale, trailScale);

    // Minimal rendering state
    ctx.globalAlpha = finalAlpha;
    ctx.shadowBlur = config.blurAmount;
    ctx.shadowColor = config.colorTint;

    // Single draw call
    ctx.drawImage(
      piece.cachedCanvas,
      -piece.cachedCanvas.width / 2,
      -piece.cachedCanvas.height / 2
    );

    ctx.restore();
  }

  ctx.restore();
};

/**
 * Clear trail history for a piece (when it's completed)
 */
export const clearTrailForPiece = (pieceId: number) => {
  trailHistory.delete(pieceId);
};

/**
 * Clear all trail history
 */
export const clearAllTrails = () => {
  trailHistory.clear();
};
