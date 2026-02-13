import { Piece } from "../hooks/usePuzzleLogic";
import { PieceShape, MovementType, PuzzleBackground } from "../types";
import { getFinaleState, getDiagonalWaveY, OUTRO_DURATION } from "./finaleManager";
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
  narrativeText?: string;
  channelLogo?: HTMLImageElement;
  completedPuzzleSnapshots?: HTMLImageElement[]; // 🔥 برای اسلایدشو
}

// ─── 🔥 PHASE A FIX: CACHED SORTING ───────────────────────────────────
let cachedSortedPieces: Piece[] = [];
let lastPiecesReference: Piece[] | null = null;

const getSortedPieces = (pieces: Piece[]): Piece[] => {
  // Only re-sort if pieces array reference changed (new chapter)
  if (pieces !== lastPiecesReference) {
    cachedSortedPieces = [...pieces].sort((a, b) => a.zOrder - b.zOrder);
    lastPiecesReference = pieces;
  }
  return cachedSortedPieces;
};

// ─── 🔥 PERFORMANCE: RENDER POOL FOR SMOOTHER ANIMATIONS ──────────────
const renderBatchSize = 50; // Render 50 pieces per frame max
let renderQueue: Piece[] = [];
let queueProcessed = 0;

// ─── TEXT WRAPPING CACHE ──────────────────────────────────────────────
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

// ─── KINETIC TRANSFORM ────────────────────────────────────────────────
const calculateKineticTransform = (
  p: Piece,
  t: number,
  movement: MovementType,
  vWidth: number,
  vHeight: number,
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

// ─── MAIN RENDER FUNCTION ─────────────────────────────────────────────
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
  completedPuzzleSnapshots,
}: RenderOptions): number => {
  const vWidth = 1080;
  const vHeight = 2280;
  const totalPieces = pieces.length;
  if (totalPieces === 0) return 0;

  const elapsedAfterFinish = Math.max(0, elapsed - totalDuration);
  const fState = getFinaleState(elapsedAfterFinish);

  // ─── 🔥 SLIDESHOW PHASE ────────────────────────────────────────────
  if (fState.slideshowActive && completedPuzzleSnapshots && completedPuzzleSnapshots.length > 0) {
    const slideImage = completedPuzzleSnapshots[fState.currentSlide];
    if (slideImage) {
      // Clear background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, vWidth, vHeight);

      // Fade in/out transitions
      const fadeIn = Math.min(fState.slideProgress * 4, 1); // Faster fade in
      const fadeOut = fState.slideProgress > 0.75 ? 1 - (fState.slideProgress - 0.75) / 0.25 : 1;
      const opacity = fadeIn * fadeOut;

      ctx.save();
      ctx.globalAlpha = opacity;

      // Ken Burns effect (slow zoom and pan)
      const scale = 1.0 + Math.sin(fState.slideProgress * Math.PI) * 0.08;
      const panX = Math.sin(fState.slideProgress * Math.PI * 2) * 20;
      const panY = Math.cos(fState.slideProgress * Math.PI * 2) * 20;

      ctx.translate(vWidth / 2 + panX, vHeight / 2 + panY);
      ctx.scale(scale, scale);
      ctx.translate(-vWidth / 2, -vHeight / 2);

      // Draw slide
      ctx.drawImage(slideImage, 0, 0, vWidth, vHeight);

      // Slide progress indicator
      ctx.globalAlpha = opacity * 0.7;
      ctx.fillStyle = "#007acc";
      ctx.font = "bold 90px Inter";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Animated slide number with glow
      ctx.shadowColor = "#007acc";
      ctx.shadowBlur = 30;
      ctx.fillText(
        `${fState.currentSlide + 1} / ${completedPuzzleSnapshots.length}`,
        vWidth / 2,
        vHeight - 180,
      );

      ctx.restore();
      return 100; // slideshow active
    }
  }

  // ─── 🔥 OUTRO CARD PHASE ───────────────────────────────────────────
  if (fState.outroActive) {
    renderOutroCard({
      ctx,
      vWidth,
      vHeight,
      elapsedAfterFinish: fState.outroProgress * OUTRO_DURATION,
      channelLogo,
    });
    return 100; // outro active
  }

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

  // ─── 🔥 PHASE A FIX: USE CACHED SORTED PIECES ─────────────────────
  const sorted = getSortedPieces(pieces);
  const completedPieces: Piece[] = [];
  const movingPieces: Piece[] = [];

  // ─── 🔥 PHASE A FIX: STRICT PIECE LIFECYCLE ───────────────────────
  for (const p of sorted) {
    // Check if this piece is in physics mode (final chapter only)
    if (physicsPieces?.has(p.id)) {
      movingPieces.push(p);
      continue;
    }

    // Calculate movement progress
    const delay = (p.assemblyOrder / totalPieces) * (totalDuration - 2700);
    const tRaw = Math.max(0, Math.min((elapsed - delay) / 2700, 1));
    (p as any).tRaw = tRaw;

    // 🔥 STRICT BOUNDARY: tRaw must be exactly 1.0 to be "completed"
    // This prevents glitches where pieces flicker between states
    if (tRaw >= 0.9999) {
      completedPieces.push(p);
    } else if (tRaw > 0) {
      movingPieces.push(p);
    }
  }

  // ─── 2. RENDER COMPLETED PIECES (با موج در فاز نهایی) ──────────────
  for (const p of completedPieces) {
    // 🌊 موج فقط در فاز wave active نمایش داده می‌شود
    const waveY = fState.waveActive ? getDiagonalWaveY(p, elapsedAfterFinish, vWidth, vHeight) : 0;
    const drawX = p.tx - (p.cachedCanvas!.width - p.pw) / 2;
    const drawY = p.ty - (p.cachedCanvas!.height - p.ph) / 2 + waveY;

    // 🔥 محو شدن تدریجی هنگام فروریختن
    if (fState.waveActive && waveY > 100) {
      const fadeOut = Math.max(0, 1 - waveY / vHeight);
      ctx.globalAlpha = fadeOut;
    }

    ctx.drawImage(p.cachedCanvas!, drawX, drawY);
    ctx.globalAlpha = 1.0; // Reset alpha
  }

  // ─── 3. RENDER MOVING PIECES (🔥 OPTIMIZED WITH BATCHING) ─────────
  // 🔥 Batch rendering to avoid frame drops on large piece counts
  const piecesToRender =
    movingPieces.length > renderBatchSize ? movingPieces.slice(0, renderBatchSize) : movingPieces;

  for (const p of piecesToRender) {
    const physicsData = physicsPieces?.get(p.id);

    if (physicsData) {
      // Physics mode (final chapter)
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
    // 🔥 OPTIMIZATION: Reduce trail calculations for smoother performance
    if (tRaw >= 0.1 && tRaw <= 0.85 && p.id % 3 === 0) {
      // Only every 3rd piece gets trails
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
      ctx.shadowBlur = 15; // 🔥 Slightly reduced for performance
    }

    ctx.drawImage(p.cachedCanvas!, -p.cachedCanvas!.width / 2, -p.cachedCanvas!.height / 2);
    ctx.restore();
  }

  ctx.restore();

  // ─── 4. NARRATIVE TEXT OVERLAY ────────────────────────────────────
  if (!physicsPieces && narrativeText) {
    const progressPercent = (Math.min(elapsed, totalDuration) / totalDuration) * 100;

    let displayText = "";

    // ✅ Split narrative into 3 parts BY SENTENCES (not words)
    // This ensures each text box contains complete sentences with full meaning
    const sentences = narrativeText.split(/([.!؟?]+)/g).filter((s) => s.trim());

    // Reconstruct full sentences (sentence + punctuation)
    const fullSentences: string[] = [];
    for (let i = 0; i < sentences.length; i += 2) {
      if (i + 1 < sentences.length) {
        fullSentences.push(sentences[i] + sentences[i + 1]);
      } else {
        fullSentences.push(sentences[i]);
      }
    }

    // Distribute sentences evenly across 3 parts
    const sentenceCount = fullSentences.length;
    const third = Math.ceil(sentenceCount / 3);
    const part1 = fullSentences.slice(0, third).join(" ").trim();
    const part2 = fullSentences
      .slice(third, third * 2)
      .join(" ")
      .trim();
    const part3 = fullSentences
      .slice(third * 2)
      .join(" ")
      .trim();

    if (progressPercent >= 15 && progressPercent < 35) {
      displayText = part1;
    } else if (progressPercent >= 40 && progressPercent < 60) {
      displayText = part2;
    } else if (progressPercent >= 65 && progressPercent < 85) {
      displayText = part3;
    }

    if (displayText) {
      ctx.save();
      const boxW = vWidth * 0.92;
      const boxX = (vWidth - boxW) / 2;
      const boxY = vHeight * 0.74;

      ctx.font = "bold 32px Inter, sans-serif";
      const lines = wrapText(ctx, displayText, boxW - 140);
      const lineHeight = 54;
      const boxH = 140 + lines.length * lineHeight; // 🔥 Removed label, reduced height

      const floatY = Math.sin(elapsed / 600) * 8;
      ctx.translate(0, floatY);

      // Glass Box Style
      const grad = ctx.createLinearGradient(0, boxY, 0, boxY + boxH);
      grad.addColorStop(0, "rgba(15, 20, 45, 0.95)");
      grad.addColorStop(1, "rgba(5, 5, 20, 0.98)");
      ctx.fillStyle = grad;
      ctx.roundRect(boxX, boxY, boxW, boxH, 50);
      ctx.fill();

      ctx.strokeStyle = "rgba(100, 180, 255, 0.4)";
      ctx.lineWidth = 4;
      ctx.stroke();

      // 🔥 REMOVED LABEL - cleaner look for YouTube

      // Content Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px Inter, sans-serif";
      lines.forEach((line, i) => {
        ctx.fillText(line, boxX + 70, boxY + 85 + i * lineHeight); // Adjusted Y offset
      });

      ctx.restore();
    }
  }

  return (completedPieces.length / totalPieces) * 100;
};
