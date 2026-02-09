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
  narrativeText?: string;
  channelLogo?: HTMLImageElement;
  completedPuzzleSnapshots?: HTMLImageElement[]; // 🔥 برای اسلایدشو
  canvasWidth?: number;
  canvasHeight?: number;
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
  canvasWidth,
  canvasHeight,
}: RenderOptions): number => {
  const vWidth = canvasWidth || 1080;
  const vHeight = canvasHeight || 2280;
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

      // Fade in/out
      const fadeIn = Math.min(fState.slideProgress * 3, 1);
      const fadeOut = fState.slideProgress > 0.7 ? 1 - (fState.slideProgress - 0.7) / 0.3 : 1;
      const opacity = fadeIn * fadeOut;

      ctx.save();
      ctx.globalAlpha = opacity;

      // Scale effect
      const scale = 0.95 + Math.sin(fState.slideProgress * Math.PI) * 0.05;
      ctx.translate(vWidth / 2, vHeight / 2);
      ctx.scale(scale, scale);
      ctx.translate(-vWidth / 2, -vHeight / 2);

      // Draw slide
      ctx.drawImage(slideImage, 0, 0, vWidth, vHeight);

      // Slide number indicator
      ctx.globalAlpha = opacity * 0.6;
      ctx.fillStyle = "#007acc";
      ctx.font = "bold 80px Inter";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `${fState.currentSlide + 1} / ${completedPuzzleSnapshots.length}`,
        vWidth / 2,
        vHeight - 150,
      );

      ctx.restore();
      return 100; // slideshow active
    }
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

  // ─── 2. RENDER COMPLETED PIECES ───────────────────────────────────
  for (const p of completedPieces) {
    const waveY = fState.waveActive ? getDiagonalWaveY(p, elapsedAfterFinish, vWidth, vHeight) : 0;
    const drawX = p.tx - (p.cachedCanvas!.width - p.pw) / 2;
    const drawY = p.ty - (p.cachedCanvas!.height - p.ph) / 2 + waveY;
    ctx.drawImage(p.cachedCanvas!, drawX, drawY);
  }

  // ─── 3. RENDER MOVING PIECES ──────────────────────────────────────
  for (const p of movingPieces) {
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

  // ─── 4. NARRATIVE TEXT OVERLAY ────────────────────────────────────
  if (!physicsPieces && narrativeText) {
    const progressPercent = (Math.min(elapsed, totalDuration) / totalDuration) * 100;

    let displayText = "";

    // Split narrative into 3 parts
    const words = narrativeText.split(" ");
    const third = Math.ceil(words.length / 3);
    const part1 = words.slice(0, third).join(" ");
    const part2 = words.slice(third, third * 2).join(" ");
    const part3 = words.slice(third * 2).join(" ");

    if (progressPercent >= 15 && progressPercent < 35) {
      displayText = part1;
    } else if (progressPercent >= 40 && progressPercent < 60) {
      displayText = part2;
    } else if (progressPercent >= 65 && progressPercent < 85) {
      displayText = part3;
    }

    if (displayText) {
      ctx.save();

      // ✅ تشخیص horizontal panel (for grid mode)
      const isHorizontal = vWidth > vHeight;
      const isGridPanel = vWidth <= 1300 && isHorizontal; // grid panels are 1280x720

      if (isGridPanel) {
        // تنظیمات برای grid panel horizontal (1280x720)
        const boxW = vWidth * 0.7; // کاهش عرض از 0.85 به 0.70
        const boxX = (vWidth - boxW) / 2;
        const boxY = vHeight * 0.68; // پایین‌تر: از 0.50 به 0.68

        const fontSize = Math.floor(vHeight * 0.042); // کمی کوچکتر
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;

        const padding = Math.floor(vHeight * 0.025);
        const lines = wrapText(ctx, displayText, boxW - padding * 2);
        const lineHeight = fontSize * 1.3;
        const boxH = padding * 2.5 + lines.length * lineHeight;

        // اطمینان از اینکه box داخل canvas است
        const safeBoxY = Math.min(boxY, vHeight - boxH - 15);

        const floatY = Math.sin(elapsed / 600) * 3;
        ctx.translate(0, floatY);

        // Glass Box Style - شیشه‌ای‌تر
        const grad = ctx.createLinearGradient(0, safeBoxY, 0, safeBoxY + boxH);
        grad.addColorStop(0, "rgba(15, 20, 45, 0.75)"); // کاهش opacity از 0.92
        grad.addColorStop(1, "rgba(5, 5, 20, 0.85)"); // کاهش opacity از 0.95
        ctx.fillStyle = grad;
        ctx.roundRect(boxX, safeBoxY, boxW, boxH, 15);
        ctx.fill();

        // Border شیشه‌ای
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)"; // border روشن‌تر
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Content Text
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        lines.forEach((line, i) => {
          const textY = safeBoxY + padding * 1.5 + i * lineHeight;
          ctx.fillText(line, boxX + padding, textY);
        });
      } else {
        // تنظیمات برای vertical/large panels (original)
        const boxW = vWidth * 0.92;
        const boxX = (vWidth - boxW) / 2;
        const boxY = vHeight * 0.74;

        ctx.font = "bold 32px Inter, sans-serif";
        const lines = wrapText(ctx, displayText, boxW - 140);
        const lineHeight = 54;
        const boxH = 140 + lines.length * lineHeight;

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

        // Content Text
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 32px Inter, sans-serif";
        lines.forEach((line, i) => {
          ctx.fillText(line, boxX + 70, boxY + 85 + i * lineHeight);
        });
      }

      ctx.restore();
    }
  }

  // ─── 5. OUTRO CARD ────────────────────────────────────────────────
  if (physicsPieces) {
    renderOutroCard({ ctx, vWidth, vHeight, elapsedAfterFinish, channelLogo });
  }

  return (completedPieces.length / totalPieces) * 100;
};
