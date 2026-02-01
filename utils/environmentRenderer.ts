
import { PuzzleBackground } from '../types';

/**
 * Frosted Discovery Engine v11.0 - Cinematic Clarity
 * Balanced blur and brightness to keep the image recognizable while maintaining focus on the puzzle.
 */
class EnvironmentRenderer {
  private particles: any[] = [];

  constructor() {
    this.initEntities();
  }

  private initEntities() {
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random() * 1080,
        y: Math.random() * 2280,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.4,
        speed: 0.1 + Math.random() * 0.15
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, elapsed: number, w: number, h: number) {
    const t = elapsed / 1000;

    // 1. Base Deep Black Layer
    ctx.fillStyle = '#020205';
    ctx.fillRect(0, 0, w, h);

    if (img) {
      // 2. Cinematic Blurred Image Background
      ctx.save();
      // Reduced blur to 40px for clarity as requested
      ctx.filter = 'blur(40px) saturate(1.1) brightness(0.48)';
      
      const scale = Math.max(w / img.width, h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;
      
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    }

    // 3. Cinematic Subtle Glass Reflections
    ctx.save();
    const grad = ctx.createLinearGradient(0, 0, w, h);
    const pulse = Math.sin(t * 0.4) * 0.015;
    grad.addColorStop(0, `rgba(255, 255, 255, ${0.03 + pulse})`);
    grad.addColorStop(0.5, 'transparent');
    grad.addColorStop(1, `rgba(255, 255, 255, ${0.03 - pulse})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // 4. Subtle Floating Dust Motes
    ctx.save();
    this.particles.forEach(p => {
      p.y -= p.speed;
      if (p.y < -10) p.y = h + 10;
      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.25})`;
      ctx.beginPath();
      ctx.arc(p.x + Math.sin(t * 0.7 + p.y * 0.01) * 8, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 5. Soft Vignette
    const vig = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, h * 0.75);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(0.5, 'rgba(0,0,0,0.15)');
    vig.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }
}

export const envEngine = new EnvironmentRenderer();
