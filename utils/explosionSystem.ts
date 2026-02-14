/**
 * 💥 GENTLE COLLAPSE SYSTEM - سیستم فروریختن آرام و طبیعی
 *
 * این سیستم شامل:
 * - فروریختن تدریجی قطعات به سمت پایین
 * - انباشته شدن روی هم
 * - گرد و غبار ملایم
 * - بدون انفجار خشن
 */

export interface CollapseParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  lifetime: number;
  maxLifetime: number;
  type: "dust";
}

export interface FallingPiece {
  x: number;
  y: number;
  targetY: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  settled: boolean;
}

export class GentleCollapseSystem {
  private particles: CollapseParticle[] = [];
  private fallingPieces: Map<number, FallingPiece> = new Map();
  private groundLevel: number = 2100; // پایین صفحه

  /**
   * شروع فروریختن تدریجی - بدون گرد و غبار
   */
  public startCollapse(pieces: Array<{ id: number; x: number; y: number }>, delay: number = 50): void {
    // بدون پارتیکل - فقط فروریختن

    // راه‌اندازی سقوط تدریجی قطعات
    pieces.forEach((piece, index) => {
      setTimeout(() => {
        const stackHeight = Math.floor(index / 10) * 20; // ارتفاع انباشته
        this.fallingPieces.set(piece.id, {
          x: piece.x,
          y: piece.y,
          targetY: this.groundLevel - stackHeight,
          vx: (Math.random() - 0.5) * 30, // حرکت افقی بسیار کم (کاهش از 50)
          vy: 0,
          rotation: 0,
          rotationSpeed: (Math.random() - 0.5) * 0.02, // چرخش خیلی آرام (کاهش از 0.05)
          settled: false,
        });
      }, index * delay);
    });
  }

  /**
   * به‌روزرسانی فیزیک فروریختن
   */
  public update(deltaTime: number): void {
    const dt = deltaTime / 1000;
    const gravity = 300; // گرانش خیلی ملایم (کاهش از 400)
    const damping = 0.7; // کاهش بیشتر سرعت (افزایش از 0.6)

    // به‌روزرسانی قطعات در حال سقوط
    this.fallingPieces.forEach((piece, id) => {
      if (piece.settled) return;

      // اعمال گرانش
      piece.vy += gravity * dt;

      // به‌روزرسانی موقعیت
      piece.x += piece.vx * dt;
      piece.y += piece.vy * dt;

      // کاهش سرعت افقی
      piece.vx *= 1 - dt * 0.5; // کاهش سریع‌تر

      // چرخش آرام
      piece.rotation += piece.rotationSpeed;

      // برخورد با زمین
      if (piece.y >= piece.targetY) {
        piece.y = piece.targetY;
        piece.vy *= -damping; // پرش کوچک
        piece.vx *= damping;

        // اگر سرعت خیلی کم شد، متوقف کن
        if (Math.abs(piece.vy) < 5 && Math.abs(piece.vx) < 5) {
          piece.settled = true;
          piece.vy = 0;
          piece.vx = 0;
          piece.rotationSpeed = 0;
        }
      }
    });

    // به‌روزرسانی گرد و غبار (حذف شده - لیست خالی است)
    this.particles = [];
  }

  /**
   * دریافت موقعیت قطعه برای رندر
   */
  public getPiecePosition(pieceId: number): { x: number; y: number; rotation: number } | null {
    const piece = this.fallingPieces.get(pieceId);
    if (!piece) return null;
    return { x: piece.x, y: piece.y, rotation: piece.rotation };
  }

  /**
   * رندر کردن - حالا خالی است (بدون پارتیکل)
   */
  public render(ctx: CanvasRenderingContext2D): void {
    // بدون رندر - فقط فروریختن قطعات
  }

  /**
   * پاک کردن همه
   */
  public clear(): void {
    this.particles = [];
    this.fallingPieces.clear();
  }

  /**
   * آیا فروریختن در حال اجرا است؟
   */
  public isActive(): boolean {
    return this.particles.length > 0 || this.fallingPieces.size > 0;
  }

  /**
   * آیا همه قطعات نشسته‌اند؟
   */
  public isSettled(): boolean {
    for (const piece of this.fallingPieces.values()) {
      if (!piece.settled) return false;
    }
    return true;
  }
}

// نمونه سینگلتون
export const collapseSystem = new GentleCollapseSystem();

// نگه داشتن explosionSystem برای سازگاری با کد قبلی
export const explosionSystem = collapseSystem;
