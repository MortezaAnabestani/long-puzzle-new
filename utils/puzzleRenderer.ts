import { Piece } from "../hooks/usePuzzleLogic";
import { PieceShape, MovementType, PuzzleBackground } from "../types";
import { getFinaleState, getDiagonalWaveY } from "./finaleManager";
import { envEngine } from "./environmentRenderer";
import { renderOutroCard } from "./outroRenderer";
import { updateTrailHistory, renderTrailEffect } from "./trailEffects";

export interface RenderOptions {
  ctx: CanvasRenderingContext2D;
  img: HTMLImageElement;
  pieces: Piece[];
  elapsed: number;
  totalDuration: number;
  shape: PieceShape;
  movement: MovementType;
  background: PuzzleBackground;
  particles: any[];
  physicsPieces?: Map<number, { x: number; y: number; angle: number }>;
  narrativeText?: string; // 🔥 PHASE 1: متن فصل فعلی
  channelLogo?: HTMLImageElement;
}

// ─── 🔥 PHASE 1: CACHED TEXT WRAPPING ─────────────────────────────────
const textWrapCache = new Map<string, string[]>();

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const cacheKey = `${text}-${maxWidth}`;
  if (textWrapCache.has(cacheKey)) {
    return textWrapCache.get(cacheKey)!;
  }

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + " " + word;
    const width = ctx.measureText(testLine).width;

    if (width < maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);

  textWrapCache.set(cacheKey, lines);
  return lines;
};

// ─── 🔥 PHASE 1: OPTIMIZED KINETIC TRANSFORM (inline για performance) ─
const calculateKineticTransform = (
  p: Piece,
  t: number,
  movement: MovementType,
  vWidth: number,
  vHeight: number
) => {
  const baseX = p.cx + (p.tx + p.pw / 2 - p.cx) * t;
  const baseY = p.cy + (p.ty + p.ph / 2 - p.cy) * t;
  let x = baseX;
  let y = baseY;
  let rot = p.rotation * (1 - t);
  let scale = 1.0;

  switch (movement) {
    case MovementType.FLIGHT:
      const arcHeight = Math.sin(t * Math.PI) * 550;
      y -= arcHeight;
      rot += Math.cos(t * Math.PI) * 0.6;
      scale = 1 + Math.sin(t * Math.PI) * 0.45;
      break;
    case MovementType.VORTEX:
      const angle = (1 - t) * Math.PI * 6;
      const radius = (1 - t) * 850;
      x += Math.cos(angle) * radius;
      y += Math.sin(angle) * radius;
      rot += angle;
      scale = 0.4 + t * 0.6;
      break;
    case MovementType.WAVE:
      const swellY = Math.sin(t * Math.PI * 2.5) * 110;
      const swellX = Math.cos(t * Math.PI * 2.5) * 60;
      x += swellX;
      y += swellY;
      rot += Math.sin(t * Math.PI * 1.5) * 0.35;
      scale = 1 + Math.sin(t * Math.PI) * 0.15;
      break;
    case MovementType.PLAYFUL:
      const bounce = Math.abs(Math.sin(t * Math.PI * 4)) * (1 - t) * 380;
      y -= bounce;
      const squash = 1 + Math.sin(t * Math.PI * 8) * 0.12 * (1 - t);
      scale = squash;
      break;
    case MovementType.ELASTIC:
      const snapT =
        t < 0.82 ? Math.pow(t / 0.82, 4) : 1 + Math.sin((t - 0.82) * Math.PI * 5) * 0.15 * (1 - t);
      scale = snapT;
      break;
    default:
      const easeSilk = t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
      x = p.cx + (p.tx + p.pw / 2 - p.cx) * easeSilk;
      y = p.cy + (p.ty + p.ph / 2 - p.cy) * easeSilk;
      scale = 1 + Math.sin(t * Math.PI) * 0.15;
  }
  return { x, y, rot, scale };
};

// ─── 🔥 PHASE 1: CACHED SORTED PIECES ─────────────────────────────────
let lastSortedPieces: Piece[] = [];
let lastSortKey = "";

const getSortedPieces = (pieces: Piece[]): Piece[] => {
  const currentKey = pieces.map((p) => `${p.id}-${p.zOrder}`).join(",");
  if (currentKey === lastSortKey && lastSortedPieces.length === pieces.length) {
    return lastSortedPieces;
  }
  lastSortedPieces = [...pieces].sort((a, b) => a.zOrder - b.zOrder);
  lastSortKey = currentKey;
  return lastSortedPieces;
};

// ─── 🔥 PHASE 1: MAIN RENDER FUNCTION (OPTIMIZED) ─────────────────────
export const renderPuzzleFrame = ({
  ctx,
  img,
  pieces,
  elapsed,
  totalDuration,
  shape,
  movement,
  background,
  physicsPieces,
  narrativeText = "",
  channelLogo,
}: RenderOptions): number => {
  const vWidth = 1080;
  const vHeight = 2280;
  const totalPieces = pieces.length;
  if (totalPieces === 0) return 0;

  const elapsedAfterFinish = Math.max(0, elapsed - totalDuration);
  const fState = getFinaleState(elapsedAfterFinish);

  // ─── 1. ENVIRONMENT ───────────────────────────────────────────────
  if (!physicsPieces) {
    envEngine.render(ctx, img, elapsed, vWidth, vHeight);
  } else {
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, vWidth, vHeight);
  }

  ctx.save();
  if (fState.isFinale) {
    ctx.translate(vWidth / 2, vHeight / 2);
    ctx.scale(fState.zoomScale, fState.zoomScale);
    ctx.translate(-vWidth / 2, -vHeight / 2);
  }

  // Ghost preview
  ctx.globalAlpha = 0.015;
  ctx.drawImage(img, 0, 0, vWidth, vHeight);
  ctx.globalAlpha = 1.0;

  // ─── 🔥 PHASE 1: USE CACHED SORTED PIECES ─────────────────────────
  const sorted = getSortedPieces(pieces);
  const completedPieces: Piece[] = [];
  const movingPieces: Piece[] = [];

  // Pre-calculate tRaw for all pieces (avoid recalculation)
  for (const p of sorted) {
    const delay = (p.assemblyOrder / totalPieces) * (totalDuration - 2700);
    const tRaw = Math.max(0, Math.min((elapsed - delay) / 2700, 1));
    (p as any).tRaw = tRaw;

    if (physicsPieces?.has(p.id)) {
      movingPieces.push(p);
    } else if (tRaw >= 1) {
      completedPieces.push(p);
    } else if (tRaw > 0) {
      movingPieces.push(p);
    }
  }

  // ─── 2. RENDER COMPLETED PIECES (BATCH) ───────────────────────────
  for (const p of completedPieces) {
    const waveY = fState.waveActive ? getDiagonalWaveY(p, elapsedAfterFinish, vWidth, vHeight) : 0;
    const drawX = p.tx - (p.cachedCanvas!.width - p.pw) / 2;
    const drawY = p.ty - (p.cachedCanvas!.height - p.ph) / 2 + waveY;
    ctx.drawImage(p.cachedCanvas!, drawX, drawY);
  }

  // ─── 3. RENDER MOVING PIECES (OPTIMIZED) ──────────────────────────
  for (const p of movingPieces) {
    const physicsData = physicsPieces?.get(p.id);

    if (physicsData) {
      // Physics mode (fast path)
      ctx.save();
      ctx.translate(physicsData.x, physicsData.y);
      ctx.rotate(physicsData.angle);
      ctx.drawImage(p.cachedCanvas!, -p.cachedCanvas!.width / 2, -p.cachedCanvas!.height / 2);
      ctx.restore();
      continue;
    }

    const tRaw = (p as any).tRaw;
    const pos = calculateKineticTransform(p, tRaw, movement, vWidth, vHeight);

    // Trail rendering (only during peak movement)
    if (tRaw >= 0.1 && tRaw <= 0.85) {
      updateTrailHistory(p, pos.x, pos.y, pos.rot, pos.scale, elapsed, movement, tRaw);
      renderTrailEffect(ctx, p, movement);
    }

    // Render main piece
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(pos.rot);
    ctx.scale(pos.scale, pos.scale);

    if (!fState.isFinale) {
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 20;
    }

    ctx.drawImage(p.cachedCanvas!, -p.cachedCanvas!.width / 2, -p.cachedCanvas!.height / 2);
    ctx.restore();
  }

  ctx.restore();

  // ─── 4. 🔥 PHASE 1: NARRATIVE TEXT OVERLAY (OPTIMIZED) ─────────────
  if (!physicsPieces && narrativeText) {
    const progressPercent = (Math.min(elapsed, totalDuration) / totalDuration) * 100;

    // Show narrative text progressively during assembly
    // متن در 3 مرحله نمایش داده می‌شود:
    // 1. 15-35%: بخش اول
    // 2. 40-60%: بخش دوم
    // 3. 65-85%: بخش سوم

    let displayText = "";
    let label = "CHAPTER NARRATIVE";
    let labelColor = "rgba(100, 180, 255, 1)";
    let borderColor = "rgba(100, 180, 255, 0.4)";

    // Split narrative into 3 parts
    const words = narrativeText.split(" ");
    const third = Math.ceil(words.length / 3);
    const part1 = words.slice(0, third).join(" ");
    const part2 = words.slice(third, third * 2).join(" ");
    const part3 = words.slice(third * 2).join(" ");

    if (progressPercent >= 15 && progressPercent < 35) {
      displayText = part1;
      label = "BEGINNING";
      labelColor = "rgba(120, 200, 255, 1)";
      borderColor = "rgba(120, 200, 255, 0.4)";
    } else if (progressPercent >= 40 && progressPercent < 60) {
      displayText = part2;
      label = "UNFOLDING";
      labelColor = "rgba(150, 100, 255, 1)";
      borderColor = "rgba(150, 100, 255, 0.4)";
    } else if (progressPercent >= 65 && progressPercent < 85) {
      displayText = part3;
      label = "REVELATION";
      labelColor = "rgba(255, 150, 100, 1)";
      borderColor = "rgba(255, 150, 100, 0.4)";
    }

    if (displayText) {
      ctx.save();
      const boxW = vWidth * 0.92;
      const boxX = (vWidth - boxW) / 2;
      const boxY = vHeight * 0.74;

      ctx.font = "bold 32px Inter, sans-serif";
      const lines = wrapText(ctx, displayText, boxW - 140);
      const lineHeight = 54;
      const boxH = 180 + lines.length * lineHeight;

      const floatY = Math.sin(elapsed / 600) * 8;
      ctx.translate(0, floatY);

      // Glass Box Style
      const grad = ctx.createLinearGradient(0, boxY, 0, boxY + boxH);
      grad.addColorStop(0, "rgba(15, 20, 45, 0.95)");
      grad.addColorStop(1, "rgba(5, 5, 20, 0.98)");
      ctx.fillStyle = grad;
      ctx.roundRect(boxX, boxY, boxW, boxH, 50);
      ctx.fill();

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Label
      ctx.fillStyle = labelColor;
      ctx.font = "black 24px Inter, sans-serif";
      ctx.fillText(label, boxX + 70, boxY + 75);

      // Divider Line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(boxX + 65, boxY + 105);
      ctx.lineTo(boxX + boxW - 65, boxY + 105);
      ctx.stroke();

      // Content Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px Inter, sans-serif";
      lines.forEach((line, i) => {
        ctx.fillText(line, boxX + 70, boxY + 175 + i * lineHeight);
      });

      ctx.restore();
    }
  }

  // ─── 5. OUTRO CARD (PHYSICS MODE) ─────────────────────────────────
  if (physicsPieces) {
    renderOutroCard({ ctx, vWidth, vHeight, elapsedAfterFinish, channelLogo });
  }

  return (completedPieces.length / totalPieces) * 100;
};
