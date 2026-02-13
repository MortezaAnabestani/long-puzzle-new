/**
 * 🎬 Cinematic Carousel for Puzzle Snapshots
 * Renders completed puzzle images in a professional carousel with Ken Burns effects
 */

export interface CarouselRenderOptions {
  ctx: CanvasRenderingContext2D;
  snapshots: HTMLImageElement[];
  currentIndex: number;
  progress: number; // 0-1
  vWidth: number;
  vHeight: number;
}

/**
 * Render cinematic carousel with crossfade transitions
 */
export const renderCinematicCarousel = ({
  ctx,
  snapshots,
  currentIndex,
  progress,
  vWidth,
  vHeight,
}: CarouselRenderOptions) => {
  if (!snapshots || snapshots.length === 0) return;

  // Ensure indices are valid
  const currentSlide = snapshots[Math.min(currentIndex, snapshots.length - 1)];
  const nextSlide = snapshots[Math.min(currentIndex + 1, snapshots.length - 1)];

  if (!currentSlide) return;

  // Background - Deep black with subtle gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, vHeight);
  bgGrad.addColorStop(0, "#000000");
  bgGrad.addColorStop(0.5, "#0a0a0a");
  bgGrad.addColorStop(1, "#000000");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, vWidth, vHeight);

  // ═══════════════════════════════════════════════════════
  // RENDER CURRENT SLIDE
  // ═══════════════════════════════════════════════════════

  ctx.save();

  // Calculate opacity for crossfade
  const currentOpacity = progress < 0.8 ? 1 : 1 - (progress - 0.8) / 0.2;
  ctx.globalAlpha = currentOpacity;

  // Ken Burns Effect - Slow zoom and pan
  const kenBurnsProgress = Math.min(progress * 1.2, 1); // Slightly faster than slide duration

  // Smooth easing (ease-in-out)
  const eased =
    kenBurnsProgress < 0.5
      ? 2 * kenBurnsProgress * kenBurnsProgress
      : 1 - Math.pow(-2 * kenBurnsProgress + 2, 2) / 2;

  // Zoom: 1.0 → 1.15 (subtle but noticeable)
  const scale = 1.0 + eased * 0.15;

  // Pan in a figure-8 pattern (lemniscate) for organic movement
  const angle = eased * Math.PI * 2;
  const panRadius = 30;
  const panX = Math.sin(angle) * panRadius * Math.cos(angle / 2);
  const panY = Math.sin(angle * 0.6) * (panRadius * 0.7);

  // Apply transformations
  ctx.translate(vWidth / 2 + panX, vHeight / 2 + panY);
  ctx.scale(scale, scale);
  ctx.translate(-vWidth / 2, -vHeight / 2);

  // Draw current slide
  ctx.drawImage(currentSlide, 0, 0, vWidth, vHeight);

  ctx.restore();

  // ═══════════════════════════════════════════════════════
  // CROSSFADE TO NEXT SLIDE
  // ═══════════════════════════════════════════════════════

  if (progress > 0.8 && nextSlide && currentIndex < snapshots.length - 1) {
    ctx.save();

    // Fade in next slide
    const nextOpacity = (progress - 0.8) / 0.2;
    ctx.globalAlpha = nextOpacity;

    // Next slide starts at scale 1.0 (will zoom during its turn)
    ctx.drawImage(nextSlide, 0, 0, vWidth, vHeight);

    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════
  // CINEMATIC VIGNETTE
  // ═══════════════════════════════════════════════════════

  ctx.save();
  ctx.globalAlpha = 0.6;

  const vignette = ctx.createRadialGradient(
    vWidth / 2,
    vHeight / 2,
    vHeight * 0.2,
    vWidth / 2,
    vHeight / 2,
    vHeight * 0.7,
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(0.6, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.5)");

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, vWidth, vHeight);

  ctx.restore();

  // ═══════════════════════════════════════════════════════
  // PROGRESS INDICATOR (Subtle dots at bottom)
  // ═══════════════════════════════════════════════════════

  if (snapshots.length > 1) {
    ctx.save();

    const dotRadius = 4;
    const dotSpacing = 16;
    const totalWidth = snapshots.length * dotSpacing;
    const startX = (vWidth - totalWidth) / 2;
    const y = vHeight - 60;

    ctx.globalAlpha = 0.5;

    for (let i = 0; i < snapshots.length; i++) {
      const x = startX + i * dotSpacing + dotSpacing / 2;

      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);

      if (i === currentIndex) {
        // Active dot - larger and bright
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ffffff";
        ctx.fill();
      } else {
        // Inactive dots
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.shadowBlur = 0;
        ctx.fill();
      }
    }

    ctx.restore();
  }
};
