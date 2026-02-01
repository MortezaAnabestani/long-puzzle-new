/**
 * Cinematic Outro Renderer v2.1 (Compact Material-Glass)
 * Refined layout with equal spacing, larger typography, and 3-button action row.
 */

export interface OutroOptions {
  ctx: CanvasRenderingContext2D;
  vWidth: number;
  vHeight: number;
  elapsedAfterFinish: number;
  channelLogo?: HTMLImageElement;
}

// Helper: Draw a rounded rectangle path
const roundRectPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.closePath();
};

// Helper: Draw a Glass Container
const drawGlassPanel = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.save();
  roundRectPath(ctx, x, y, w, h, r);
  
  // 1. Surface Fill (Subtle Gradient)
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.09)'); 
  grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.04)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0.01)'); 
  ctx.fillStyle = grad;
  ctx.fill();

  // 2. Border (1px subtle edge)
  ctx.lineWidth = 1.5;
  const borderGrad = ctx.createLinearGradient(x, y, x, y + h);
  borderGrad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  borderGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
  borderGrad.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
  ctx.strokeStyle = borderGrad;
  ctx.stroke();

  // 3. Inner Glow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 10;
  
  ctx.restore();
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

const drawIcon = (ctx: CanvasRenderingContext2D, type: 'heart' | 'bell' | 'comment', x: number, y: number, size: number, color: string, scale: number = 1) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.shadowBlur = 15;
  ctx.shadowColor = color;
  
  if (type === 'heart') {
    ctx.beginPath();
    const topY = -size/2;
    ctx.moveTo(0, size/2);
    ctx.bezierCurveTo(-size, topY, -size/2, -size, 0, -size/4);
    ctx.bezierCurveTo(size/2, -size, size, topY, 0, size/2);
    ctx.fill();
  } else if (type === 'bell') {
    ctx.beginPath();
    ctx.arc(0, -size/4, size/2, Math.PI, 0);
    ctx.lineTo(size/2, size/4);
    ctx.lineTo(-size/2, size/4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, size/4, size/6, 0, Math.PI);
    ctx.fill();
  } else if (type === 'comment') {
    // Speech Bubble
    ctx.beginPath();
    ctx.ellipse(0, -size/6, size/1.8, size/2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tail
    ctx.beginPath();
    ctx.moveTo(-size/4, size/4);
    ctx.lineTo(-size/2, size/2);
    ctx.lineTo(0, size/4);
    ctx.fill();
  }
  ctx.restore();
};

export const renderOutroCard = ({ ctx, vWidth, vHeight, elapsedAfterFinish, channelLogo }: OutroOptions) => {
  const OUTRO_START = 11500; 
  if (elapsedAfterFinish < OUTRO_START) return;

  const t = Math.min(1, (elapsedAfterFinish - OUTRO_START) / 800); 
  
  // MOVED UP: Shift center Y up by 80px for better visual balance
  const centerX = vWidth / 2;
  const centerY = (vHeight / 2) - 80; 

  const PRIMARY_COLOR = '#007acc';
  const SURFACE_BG = 'rgba(10, 10, 12, 0.85)';

  ctx.save();
  ctx.globalAlpha = t;

  // 1. BACKDROP
  ctx.fillStyle = SURFACE_BG;
  ctx.fillRect(0, 0, vWidth, vHeight);

  // 2. AMBIENT GLOW
  ctx.save();
  ctx.globalAlpha = t * 0.6;
  const glowGrad = ctx.createRadialGradient(centerX, centerY - 50, 0, centerX, centerY, 600);
  glowGrad.addColorStop(0, 'rgba(0, 122, 204, 0.25)');
  glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, vWidth, vHeight);
  ctx.restore();

  // --- LAYOUT CALCULATIONS ---
  // We want equal spacing (GAP) between elements.
  const GAP = 50; 
  const panelW = 960; // Slightly wider to fit 3 buttons
  // Height calculation: TopPadding + Headline + Gap + Subtitle + Gap + Buttons + BottomPadding
  // Approx: 140 + 60 + 50 + 80 + 50 + 90 + 50 = ~520 (Compact)
  const panelH = 580; 
  const panelX = centerX - panelW / 2;
  const panelY = centerY - (panelH / 2) + 40; // Adjust to center visually with avatar
  const panelRadius = 48;

  // 3. MAIN GLASS PANEL
  drawGlassPanel(ctx, panelX, panelY, panelW, panelH, panelRadius);

  // 4. CHANNEL AVATAR (Floating on top edge)
  const avatarY = panelY; 
  const avatarRadius = 85;
  
  ctx.save();
  ctx.shadowBlur = 40;
  ctx.shadowColor = 'rgba(0, 122, 204, 0.5)';
  ctx.beginPath();
  ctx.arc(centerX, avatarY, avatarRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#1e1e1e';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = PRIMARY_COLOR;
  ctx.stroke();

  if (channelLogo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, avatarY, avatarRadius - 3, 0, Math.PI * 2);
    ctx.clip();
    const dSize = avatarRadius * 2;
    ctx.drawImage(channelLogo, centerX - avatarRadius, avatarY - avatarRadius, dSize, dSize);
    ctx.restore();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ID', centerX, avatarY);
  }
  ctx.restore();

  // 5. TEXT CONTENT
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  
  let currentY = panelY + 150; // Start below avatar

  // Headline
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 52px Inter'; 
  ctx.shadowBlur = 25;
  ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
  ctx.fillText('THANKS FOR WATCHING', centerX, currentY);
  ctx.shadowBlur = 0;

  currentY += GAP + 10; // Add Gap

  // Subtitle (Larger Font as requested)
  ctx.font = '600 34px Inter'; // Increased from 24px
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // Brighter for readability
  const subText = "If you enjoyed this, please Like and Subscribe! Your support fuels our journey.";
  const subLines = wrapText(ctx, subText, panelW - 100);
  
  subLines.forEach((l, i) => {
    ctx.fillText(l, centerX, currentY + (i * 42));
  });

  // Move Y down by height of text block + Gap
  currentY += (subLines.length * 42) + GAP;

  // 6. ACTION BUTTONS (Row of 3)
  // Layout: [LIKE] [COMMENT] [SUBSCRIBE]
  const btnH = 80;
  const btnW = 260; // Width per button
  const btnGap = 20;
  const totalBtnW = (btnW * 3) + (btnGap * 2);
  let startX = centerX - (totalBtnW / 2);

  const time = Date.now();
  // Heartbeat animation specifically for Like button
  // Fast beat, pause, fast beat pattern
  const heartPulse = 1 + (Math.sin(time / 100) > 0.5 ? 0.15 : 0); 
  const generalPulse = 1;

  // -- BUTTON 1: LIKE --
  const likeX = startX;
  drawGlassPanel(ctx, likeX, currentY, btnW, btnH, 40);
  drawIcon(ctx, 'heart', likeX + 60, currentY + btnH/2, 28, '#ef4444', heartPulse);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Inter';
  ctx.textAlign = 'left';
  ctx.fillText('LIKE', likeX + 100, currentY + btnH/2 + 8);

  // -- BUTTON 2: COMMENT (New) --
  const commentX = likeX + btnW + btnGap;
  drawGlassPanel(ctx, commentX, currentY, btnW, btnH, 40);
  drawIcon(ctx, 'comment', commentX + 50, currentY + btnH/2, 28, '#3b82f6', generalPulse);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('COMMENT', commentX + 90, currentY + btnH/2 + 8);

  // -- BUTTON 3: SUBSCRIBE (Primary) --
  const subX = commentX + btnW + btnGap;
  ctx.save();
  roundRectPath(ctx, subX, currentY, btnW, btnH, 40);
  const subGrad = ctx.createLinearGradient(subX, currentY, subX, currentY + btnH);
  subGrad.addColorStop(0, 'rgba(0, 122, 204, 0.5)'); 
  subGrad.addColorStop(1, 'rgba(0, 122, 204, 0.2)');
  ctx.fillStyle = subGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 122, 204, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Glow
  ctx.shadowColor = 'rgba(0, 122, 204, 0.6)';
  ctx.shadowBlur = 25;
  ctx.stroke(); 
  ctx.restore();

  drawIcon(ctx, 'bell', subX + 45, currentY + btnH/2, 28, '#ffffff', generalPulse);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('SUBSCRIBE', subX + 85, currentY + btnH/2 + 8);

  ctx.restore();
};