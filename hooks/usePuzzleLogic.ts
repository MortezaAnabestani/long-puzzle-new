
// @google/genai Coding Guidelines: This file does not use GenAI directly but supports the UI/UX.
import { useCallback, useRef } from 'react';
import { PieceShape, PieceMaterial } from '../types';
import { drawPiecePath } from '../utils/puzzleDrawing';

export interface PieceConnections {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Piece {
  id: number;
  sx: number; sy: number; 
  sw: number; sh: number; 
  tx: number; ty: number; 
  cx: number; cy: number; 
  pw: number; ph: number; 
  rotation: number;
  zOrder: number;
  assemblyOrder: number;
  subIndex: number;
  connections?: PieceConnections;
  gridX: number;
  gridY: number;
  sectorIndex: number; 
  cachedCanvas?: HTMLCanvasElement;
  hasSnapped?: boolean;
}

export const usePuzzleLogic = () => {
  const piecesRef = useRef<Piece[]>([]);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const applyMaterialTexture = (ctx: CanvasRenderingContext2D, pw: number, ph: number, material: PieceMaterial) => {
    ctx.save();
    
    switch (material) {
      case PieceMaterial.CARDBOARD:
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.08; 
        for (let i = 0; i < (pw * ph) / 8; i++) { 
          ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
          ctx.fillRect((Math.random() - 0.5) * pw, (Math.random() - 0.5) * ph, 1, 1);
        }
        break;
        
      case PieceMaterial.WOOD:
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.15;
        const woodBase = ctx.createLinearGradient(-pw/2, -ph/2, pw/2, ph/2);
        woodBase.addColorStop(0, '#2d1b0e');
        woodBase.addColorStop(0.5, '#4a2e19');
        woodBase.addColorStop(1, '#2d1b0e');
        ctx.fillStyle = woodBase;
        ctx.fillRect(-pw/2, -ph/2, pw, ph);
        break;
        
      case PieceMaterial.GLASS:
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.2;
        const glassGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(pw, ph));
        glassGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
        glassGrad.addColorStop(1, 'rgba(255,255,255,0.4)');
        ctx.fillStyle = glassGrad;
        ctx.fill();
        break;
        
      case PieceMaterial.CARBON:
        ctx.globalCompositeOperation = 'soft-light';
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#000000';
        const step = 3;
        for (let i = -pw/2; i < pw/2; i += step) {
          for (let j = -ph/2; j < ph/2; j += step) {
            if ((Math.floor(i/step) + Math.floor(j/step)) % 2 === 0) {
              ctx.fillRect(i, j, step, step);
            }
          }
        }
        break;
    }
    ctx.restore();
  };

  const createPieces = useCallback(async (
    img: HTMLImageElement, 
    pieceCount: number, 
    shape: PieceShape, 
    isShorts: boolean, 
    material: PieceMaterial, 
    onProgress?: (p: number) => void
  ) => {
    if (!img || img.naturalWidth === 0) return [];
    
    imageRef.current = img;
    // Updated virtual dimensions for 19:9 Vertical (approx 9:19 ratio)
    const virtualW = 1080;
    const virtualH = 2280; 

    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    
    // Calculate scaling to fill 1080x2280 with a 9:16 image (Object-Fit: Cover)
    // 9:16 is 1080x1920. 2280/1920 = 1.1875
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
    const totalExpected = rows * cols * (effectiveShape === PieceShape.TRIANGLE ? 2 : 1);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const variations = effectiveShape === PieceShape.TRIANGLE ? 2 : 1;
        for (let v = 0; v < variations; v++) {
          let targetX: number, targetY: number;

          if (isHex) {
            targetX = (x * pw * 0.75) + pw / 2;
            targetY = (y * ph + (x % 2 === 1 ? ph / 2 : 0)) + ph / 2;
          } else if (isBrick) {
            const offset = (y % 2 === 1) ? pw / 2 : 0;
            targetX = x * pw + offset + pw / 2;
            targetY = y * ph + ph / 2;
            if (targetX - pw/2 > virtualW || targetY - ph/2 > virtualH || targetX + pw/2 < 0) continue;
          } else if (isDiamond) {
            if ((x + y) % 2 !== 0) continue; 
            targetX = x * (pw / 2);
            targetY = y * (ph / 2);
            if (targetX > virtualW + pw/2 || targetY > virtualH + ph/2 || targetX < -pw/2 || targetY < -ph/2) continue;
          } else {
            targetX = x * pw + pw / 2;
            targetY = y * ph + ph / 2;
          }

          const drawX = targetX - pw / 2;
          const drawY = targetY - ph / 2;

          const sectorX = Math.floor(targetX / (virtualW / 4));
          const sectorY = Math.floor(targetY / (virtualH / 3));
          const sectorIndex = Math.min(11, Math.max(0, sectorY * 4 + sectorX));

          // Smart Sampling to Cover 9:19 canvas from 9:16 source
          const padding = Math.max(pw, ph) * 0.6; 
          const sampleX = ((drawX - padding) / scale) + (imgW / 2) - (virtualW / (2 * scale));
          const sampleY = ((drawY - padding) / scale) + (imgH / 2) - (virtualH / (2 * scale));
          const sampleW = (pw + padding * 2) / scale;
          const sampleH = (ph + padding * 2) / scale;

          const scatterX = virtualW * 0.1 + Math.random() * virtualW * 0.8;
          const scatterY = virtualH * 0.85 + (Math.random() - 0.5) * (virtualH * 0.1);
          const randomRotation = (Math.random() - 0.5) * Math.PI * 0.5;

          const piece: Piece = {
            id: idCounter++,
            sx: sampleX, sy: sampleY,
            sw: sampleW, sh: sampleH,
            tx: drawX, ty: drawY,
            cx: scatterX, cy: scatterY,
            pw: pw, ph: ph,
            rotation: randomRotation,
            zOrder: Math.random(),
            assemblyOrder: 0,
            subIndex: v,
            gridX: x, gridY: y,
            sectorIndex,
            connections: needsConnections ? connGrid[y][x] : undefined,
            hasSnapped: false
          };

          const offCanvas = document.createElement('canvas');
          const canvasSizeW = Math.ceil(pw + padding * 2);
          const canvasSizeH = Math.ceil(ph + padding * 2);
          offCanvas.width = canvasSizeW;
          offCanvas.height = canvasSizeH;
          const offCtx = offCanvas.getContext('2d', { alpha: true })!;
          
          offCtx.translate(canvasSizeW / 2, canvasSizeH / 2);
          offCtx.save();
          drawPiecePath(offCtx, pw, ph, effectiveShape, v, piece.connections);
          offCtx.clip();
          // Draw with smart samples
          offCtx.drawImage(img, piece.sx, piece.sy, piece.sw, piece.sh, -pw/2 - padding, -ph/2 - padding, pw + padding*2, ph + padding*2);
          applyMaterialTexture(offCtx, pw, ph, material);
          offCtx.restore();
          
          offCtx.save();
          drawPiecePath(offCtx, pw, ph, effectiveShape, v, piece.connections);
          offCtx.strokeStyle = 'rgba(0,0,0,0.2)';
          offCtx.lineWidth = 0.8;
          offCtx.stroke();
          offCtx.restore();
          
          piece.cachedCanvas = offCanvas;
          newPieces.push(piece);

          if (onProgress && idCounter % 50 === 0) {
            onProgress(idCounter / totalExpected);
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
      }
    }

    const orderArray = Array.from({ length: newPieces.length }, (_, i) => i).sort(() => Math.random() - 0.5);
    newPieces.forEach((p, i) => p.assemblyOrder = orderArray[i]);

    piecesRef.current = newPieces;
    return newPieces;
  }, []);

  return { piecesRef, imageRef, createPieces };
};
