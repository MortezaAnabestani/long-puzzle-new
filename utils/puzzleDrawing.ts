
import { PieceShape } from '../types';
import { PieceConnections } from '../hooks/usePuzzleLogic';

export const drawPiecePath = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  shape: PieceShape,
  subIndex: number = 0,
  connections?: PieceConnections
) => {
  const x = -w / 2;
  const y = -h / 2;
  
  // Negative bleed (overlap) for Diamond to ensure no background shows through
  const b = shape === PieceShape.DIAMOND ? 0.2 : (shape === PieceShape.HEXAGON ? 0.3 : 0.8); 

  ctx.beginPath();

  switch (shape) {
    case PieceShape.JIGSAW:
      if (connections) {
        drawInterlockingJigsaw(ctx, x, y, w, h, connections, false);
      } else {
        ctx.rect(x - b, y - b, w + b * 2, h + b * 2);
      }
      break;

    case PieceShape.HEXAGON:
      const r = w / 2; 
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = r * Math.cos(angle);
        const py = r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;

    case PieceShape.DIAMOND:
      // Diamond points must touch the exact bounding box edges
      ctx.moveTo(0, -h / 2 - b);
      ctx.lineTo(w / 2 + b, 0);
      ctx.lineTo(0, h / 2 + b);
      ctx.lineTo(-w / 2 - b, 0);
      ctx.closePath();
      break;

    case PieceShape.BRICK:
      ctx.rect(x - b, y - b, w + b * 2, h + b * 2);
      break;

    case PieceShape.CHEVRON:
      const offset = w * 0.3;
      ctx.moveTo(x - b, y - b);
      ctx.lineTo(x + w / 2, y + offset - b);
      ctx.lineTo(x + w + b, y - b);
      ctx.lineTo(x + w + b, y + h - b);
      ctx.lineTo(x + w / 2, y + h + offset - b);
      ctx.lineTo(x - b, y + h - b);
      ctx.closePath();
      break;

    case PieceShape.TRIANGLE:
      if (subIndex === 0) {
        ctx.moveTo(x - b, y - b);
        ctx.lineTo(x + w + b, y - b);
        ctx.lineTo(x - b, y + h + b);
      } else {
        ctx.moveTo(x + w + b, y + h + b);
        ctx.lineTo(x + w + b, y - b);
        ctx.lineTo(x - b, y + h + b);
      }
      ctx.closePath();
      break;

    case PieceShape.SQUARE:
    default:
      ctx.rect(x - b, y - b, w + b * 2, h + b * 2);
      break;
  }
};

function drawTab(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  side: number,
  nx: number,
  ny: number,
  isSquare: boolean
) {
  if (side === 0) {
    ctx.lineTo(x2, y2);
    return;
  }

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const tx = dx / length;
  const ty = dy / length;

  const tabDepth = length * 0.22; 
  const neckWidth = length * 0.15;
  const headWidth = length * 0.32;

  const neck1x = midX - (neckWidth / 2) * tx;
  const neck1y = midY - (neckWidth / 2) * ty;
  const neck2x = midX + (neckWidth / 2) * tx;
  const neck2y = midY + (neckWidth / 2) * ty;

  const peakX = midX + nx * tabDepth * side;
  const peakY = midY + ny * tabDepth * side;

  const shoulder1x = midX - (headWidth / 2) * tx + nx * (tabDepth * 0.6) * side;
  const shoulder1y = midY - (headWidth / 2) * ty + ny * (tabDepth * 0.6) * side;
  const shoulder2x = midX + (headWidth / 2) * tx + nx * (tabDepth * 0.6) * side;
  const shoulder2y = midY + (headWidth / 2) * ty + ny * (tabDepth * 0.6) * side;

  ctx.lineTo(neck1x, neck1y);
  ctx.bezierCurveTo(
    neck1x + nx * (tabDepth * 0.1) * side, neck1y + ny * (tabDepth * 0.1) * side,
    shoulder1x - tx * (neckWidth * 0.1), shoulder1y - ty * (neckWidth * 0.1),
    shoulder1x, shoulder1y
  );
  ctx.bezierCurveTo(
    shoulder1x + tx * (headWidth * 0.4), shoulder1y + ty * (headWidth * 0.4),
    peakX - tx * (headWidth * 0.4), peakY - ty * (headWidth * 0.4),
    peakX, peakY
  );
  ctx.bezierCurveTo(
    peakX + tx * (headWidth * 0.4), peakY + ty * (headWidth * 0.4),
    shoulder2x - tx * (headWidth * 0.4), shoulder2y - ty * (headWidth * 0.4),
    shoulder2x, shoulder2y
  );
  ctx.bezierCurveTo(
    shoulder2x + tx * (neckWidth * 0.1), shoulder2y + ty * (neckWidth * 0.1),
    neck2x + nx * (tabDepth * 0.1) * side, neck2y + ny * (tabDepth * 0.1) * side,
    neck2x, neck2y
  );
  ctx.lineTo(x2, y2);
}

function drawInterlockingJigsaw(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  conn: PieceConnections,
  isSquare: boolean
) {
  ctx.moveTo(x, y);
  drawTab(ctx, x, y, x + w, y, conn.top, 0, -1, isSquare);
  drawTab(ctx, x + w, y, x + w, y + h, conn.right, 1, 0, isSquare);
  drawTab(ctx, x + w, y + h, x, y + h, conn.bottom, 0, 1, isSquare);
  drawTab(ctx, x, y + h, x, y, conn.left, -1, 0, isSquare);
  ctx.closePath();
}
