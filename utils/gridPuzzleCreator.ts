/**
 * Grid Puzzle Creator - استخراج شده از usePuzzleLogic
 * برای استفاده در Grid Mode که نیاز به ساخت چندین پازل همزمان دارد
 */

import { PieceShape, PieceMaterial } from "../types";
import { Piece, PieceConnections } from "../hooks/usePuzzleLogic";
import { drawPiecePath } from "./puzzleDrawing";

// Material texture cache (مشترک)
const materialTextureCache = new Map<string, HTMLCanvasElement>();

function createMaterialTexture(material: PieceMaterial, pw: number, ph: number): HTMLCanvasElement {
  const cacheKey = `${material}-${Math.ceil(pw)}-${Math.ceil(ph)}`;

  if (materialTextureCache.has(cacheKey)) {
    return materialTextureCache.get(cacheKey)!;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(pw);
  canvas.height = Math.ceil(ph);
  const ctx = canvas.getContext("2d", { alpha: true })!;

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);

  switch (material) {
    case PieceMaterial.CARDBOARD:
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.08;
      const pixelCount = (pw * ph) / 8;
      for (let i = 0; i < pixelCount; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? "#ffffff" : "#000000";
        ctx.fillRect((Math.random() - 0.5) * pw, (Math.random() - 0.5) * ph, 1, 1);
      }
      break;

    case PieceMaterial.WOOD:
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.15;
      const woodBase = ctx.createLinearGradient(-pw / 2, -ph / 2, pw / 2, ph / 2);
      woodBase.addColorStop(0, "#2d1b0e");
      woodBase.addColorStop(0.5, "#4a2e19");
      woodBase.addColorStop(1, "#2d1b0e");
      ctx.fillStyle = woodBase;
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
      break;

    case PieceMaterial.GLASS:
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.2;
      const glassGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(pw, ph));
      glassGrad.addColorStop(0, "rgba(255,255,255,0.1)");
      glassGrad.addColorStop(1, "rgba(255,255,255,0.4)");
      ctx.fillStyle = glassGrad;
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
      break;

    case PieceMaterial.CARBON:
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#000000";
      const step = 3;
      for (let i = -pw / 2; i < pw / 2; i += step) {
        for (let j = -ph / 2; j < ph / 2; j += step) {
          if ((Math.floor(i / step) + Math.floor(j / step)) % 2 === 0) {
            ctx.fillRect(i, j, step, step);
          }
        }
      }
      break;
  }

  ctx.restore();
  materialTextureCache.set(cacheKey, canvas);
  return canvas;
}

function applyMaterialTexture(
  ctx: CanvasRenderingContext2D,
  pw: number,
  ph: number,
  material: PieceMaterial,
) {
  const texture = createMaterialTexture(material, pw, ph);
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = 1.0;
  ctx.drawImage(texture, -pw / 2, -ph / 2, pw, ph);
  ctx.restore();
}

/**
 * ساخت قطعات پازل برای یک panel در grid
 * این function کاملاً مستقل از React hooks است
 */
export async function createPiecesForPanel(
  img: HTMLImageElement,
  pieceCount: number,
  shape: PieceShape,
  material: PieceMaterial,
  virtualW: number,
  virtualH: number,
  onProgress?: (p: number) => void,
): Promise<Piece[]> {
  if (!img || img.naturalWidth === 0) return [];

  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const scale = Math.max(virtualW / imgW, virtualH / imgH);

  const effectiveShape = shape;
  let effectiveCount = pieceCount;
  if (effectiveShape === PieceShape.TRIANGLE) effectiveCount /= 2;

  const isHex = effectiveShape === PieceShape.HEXAGON;
  const isBrick = effectiveShape === PieceShape.BRICK;
  const isDiamond = effectiveShape === PieceShape.DIAMOND;

  const ratio = virtualW / virtualH;
  let rows = Math.round(Math.sqrt(effectiveCount / ratio));
  let cols = Math.round(rows * ratio);

  let pw: number, ph: number;

  if (isHex) {
    pw = virtualW / (cols * 0.75 + 0.25);
    ph = pw * (Math.sqrt(3) / 2);
  } else if (isBrick) {
    pw = virtualW / cols;
    ph = pw / 2.2;
    rows = Math.ceil(virtualH / ph);
  } else if (isDiamond) {
    pw = virtualW / (cols * 0.5);
    ph = pw * 0.62;
    cols = Math.ceil(virtualW / (pw / 2)) + 2;
    rows = Math.ceil(virtualH / (ph / 2)) + 2;
  } else {
    pw = virtualW / cols;
    ph = virtualH / rows;
  }

  const globalPadding = Math.max(pw, ph) * 0.6;

  const needsConnections = effectiveShape === PieceShape.JIGSAW;
  const connGrid: PieceConnections[][] = [];

  if (needsConnections) {
    for (let y = 0; y < rows; y++) {
      connGrid[y] = [];
      for (let x = 0; x < cols; x++) {
        connGrid[y][x] = { top: 0, right: 0, bottom: 0, left: 0 };
      }
    }
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (x < cols - 1) {
          const side = Math.random() > 0.5 ? 1 : -1;
          connGrid[y][x].right = side;
          connGrid[y][x + 1].left = -side;
        }
        if (y < rows - 1) {
          const side = Math.random() > 0.5 ? 1 : -1;
          connGrid[y][x].bottom = side;
          connGrid[y + 1][x].top = -side;
        }
      }
    }
  }

  const newPieces: Piece[] = [];
  let idCounter = 0;
  const BATCH_SIZE = 25;
  const allPieceData: Array<{
    piece: Piece;
    canvasSize: { w: number; h: number };
  }> = [];

  // First pass: Calculate all piece data
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const variations = effectiveShape === PieceShape.TRIANGLE ? 2 : 1;
      for (let v = 0; v < variations; v++) {
        let targetX: number, targetY: number;

        if (isHex) {
          targetX = x * pw * 0.75 + pw / 2;
          targetY = y * ph + (x % 2 === 1 ? ph / 2 : 0) + ph / 2;
        } else if (isBrick) {
          const offset = y % 2 === 1 ? pw / 2 : 0;
          targetX = x * pw + offset + pw / 2;
          targetY = y * ph + ph / 2;
          if (targetX - pw / 2 > virtualW || targetY - ph / 2 > virtualH || targetX + pw / 2 < 0) continue;
        } else if (isDiamond) {
          if ((x + y) % 2 !== 0) continue;
          targetX = x * (pw / 2);
          targetY = y * (ph / 2);
          if (
            targetX > virtualW + pw / 2 ||
            targetY > virtualH + ph / 2 ||
            targetX < -pw / 2 ||
            targetY < -ph / 2
          )
            continue;
        } else {
          targetX = x * pw + pw / 2;
          targetY = y * ph + ph / 2;
        }

        const drawX = targetX - pw / 2;
        const drawY = targetY - ph / 2;

        const sectorX = Math.floor(targetX / (virtualW / 4));
        const sectorY = Math.floor(targetY / (virtualH / 3));
        const sectorIndex = Math.min(11, Math.max(0, sectorY * 4 + sectorX));

        const sampleX = (drawX - globalPadding) / scale + imgW / 2 - virtualW / (2 * scale);
        const sampleY = (drawY - globalPadding) / scale + imgH / 2 - virtualH / (2 * scale);
        const sampleW = (pw + globalPadding * 2) / scale;
        const sampleH = (ph + globalPadding * 2) / scale;

        const scatterX = virtualW * 0.1 + Math.random() * virtualW * 0.8;
        const scatterY = virtualH * 0.85 + (Math.random() - 0.5) * (virtualH * 0.1);
        const randomRotation = (Math.random() - 0.5) * Math.PI * 0.5;

        const piece: Piece = {
          id: idCounter++,
          sx: sampleX,
          sy: sampleY,
          sw: sampleW,
          sh: sampleH,
          tx: drawX,
          ty: drawY,
          cx: scatterX,
          cy: scatterY,
          pw: pw,
          ph: ph,
          rotation: randomRotation,
          zOrder: Math.random(),
          assemblyOrder: 0,
          subIndex: v,
          gridX: x,
          gridY: y,
          sectorIndex,
          connections: needsConnections ? connGrid[y][x] : undefined,
          hasSnapped: false,
        };

        const canvasSizeW = Math.ceil(pw + globalPadding * 2);
        const canvasSizeH = Math.ceil(ph + globalPadding * 2);

        allPieceData.push({
          piece,
          canvasSize: { w: canvasSizeW, h: canvasSizeH },
        });
      }
    }
  }

  // Second pass: Process in batches
  const totalBatches = Math.ceil(allPieceData.length / BATCH_SIZE);

  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const start = batchIdx * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, allPieceData.length);
    const batch = allPieceData.slice(start, end);

    for (const { piece, canvasSize } of batch) {
      const offCanvas = document.createElement("canvas");
      offCanvas.width = canvasSize.w;
      offCanvas.height = canvasSize.h;
      const offCtx = offCanvas.getContext("2d", { alpha: true })!;

      offCtx.clearRect(0, 0, canvasSize.w, canvasSize.h);
      offCtx.translate(canvasSize.w / 2, canvasSize.h / 2);

      // Draw piece
      offCtx.save();
      drawPiecePath(offCtx, pw, ph, effectiveShape, piece.subIndex, piece.connections);
      offCtx.clip();
      offCtx.drawImage(
        img,
        piece.sx,
        piece.sy,
        piece.sw,
        piece.sh,
        -pw / 2 - globalPadding,
        -ph / 2 - globalPadding,
        pw + globalPadding * 2,
        ph + globalPadding * 2,
      );

      // Apply material texture
      applyMaterialTexture(offCtx, pw, ph, material);
      offCtx.restore();

      // Draw border
      offCtx.save();
      drawPiecePath(offCtx, pw, ph, effectiveShape, piece.subIndex, piece.connections);
      offCtx.strokeStyle = "rgba(0,0,0,0.2)";
      offCtx.lineWidth = 0.8;
      offCtx.stroke();
      offCtx.restore();

      piece.cachedCanvas = offCanvas;
      newPieces.push(piece);
    }

    if (onProgress) {
      onProgress(end / allPieceData.length);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  // Assembly order
  const orderArray = Array.from({ length: newPieces.length }, (_, i) => i).sort(() => Math.random() - 0.5);
  newPieces.forEach((p, i) => (p.assemblyOrder = orderArray[i]));

  return newPieces;
}
