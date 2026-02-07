import React, { useEffect, useRef } from "react";

interface EngagementCTAProps {
  isVisible: boolean;
  variant?: "mid" | "final";
  channelLogo?: HTMLImageElement | null;
}

/**
 * Canvas-based CTA با طراحی مشابه Outro Card
 * نمایش در زمان‌های مشخص کل ویدئو (نه هر فصل)
 */
const EngagementCTA: React.FC<EngagementCTAProps> = ({ isVisible, variant = "mid", channelLogo }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas size
    const vWidth = 1080;
    const vHeight = 2280;
    canvas.width = vWidth;
    canvas.height = vHeight;

    // Clear
    ctx.clearRect(0, 0, vWidth, vHeight);

    // Position
    const centerX = vWidth / 2;
    const centerY = vHeight / 2;
    const PRIMARY_COLOR = "#007acc";

    // Messages
    const messages = {
      mid: {
        headline: "ENJOYING THIS?",
        subtitle: "Quick tap on Like helps us reach more people! Subscribe for more discoveries.",
      },
      final: {
        headline: "THANKS FOR WATCHING",
        subtitle: "If you enjoyed this, please Like and Subscribe! Your support fuels our journey.",
      },
    };
    const msg = messages[variant];

    // Panel dimensions
    const panelW = 960;
    const panelH = 580;
    const panelX = centerX - panelW / 2;
    const panelY = centerY - panelH / 2 + 40;
    const panelRadius = 48;

    // Glass panel helper
    const drawGlassPanel = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.closePath();

      const grad = ctx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.09)");
      grad.addColorStop(0.4, "rgba(255, 255, 255, 0.04)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0.01)");
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = 1.5;
      const borderGrad = ctx.createLinearGradient(x, y, x, y + h);
      borderGrad.addColorStop(0, "rgba(255, 255, 255, 0.3)");
      borderGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.05)");
      borderGrad.addColorStop(1, "rgba(255, 255, 255, 0.1)");
      ctx.strokeStyle = borderGrad;
      ctx.stroke();

      ctx.restore();
    };

    // Backdrop
    ctx.fillStyle = "rgba(10, 10, 12, 0.85)";
    ctx.fillRect(0, 0, vWidth, vHeight);

    // Glow
    ctx.save();
    ctx.globalAlpha = 0.6;
    const glowGrad = ctx.createRadialGradient(centerX, centerY - 50, 0, centerX, centerY, 600);
    glowGrad.addColorStop(0, "rgba(0, 122, 204, 0.25)");
    glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, vWidth, vHeight);
    ctx.restore();

    // Main panel
    drawGlassPanel(panelX, panelY, panelW, panelH, panelRadius);

    // Avatar
    const avatarY = panelY;
    const avatarRadius = 85;
    ctx.save();
    ctx.shadowBlur = 40;
    ctx.shadowColor = "rgba(0, 122, 204, 0.5)";
    ctx.beginPath();
    ctx.arc(centerX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#1e1e1e";
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
    }
    ctx.restore();

    // Text
    let currentY = panelY + 150;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    // Headline
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 52px Inter";
    ctx.shadowBlur = 25;
    ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
    ctx.fillText(msg.headline, centerX, currentY);
    ctx.shadowBlur = 0;

    currentY += 60;

    // Subtitle
    ctx.font = "600 34px Inter";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    const words = msg.subtitle.split(" ");
    const lines: string[] = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + " " + words[i];
      if (ctx.measureText(testLine).width < panelW - 100) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);

    lines.forEach((line, i) => {
      ctx.fillText(line, centerX, currentY + i * 42);
    });

    currentY += lines.length * 42 + 50;

    // Buttons
    const btnH = 80;
    const btnW = 260;
    const btnGap = 20;
    const totalBtnW = btnW * 3 + btnGap * 2;
    const startX = centerX - totalBtnW / 2;

    // Like
    const likeX = startX;
    drawGlassPanel(likeX, currentY, btnW, btnH, 40);
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 40px Inter";
    ctx.fillText("❤️", likeX + 60, currentY + btnH / 2 + 10);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px Inter";
    ctx.textAlign = "left";
    ctx.fillText("LIKE", likeX + 100, currentY + btnH / 2 + 8);

    // Comment
    const commentX = likeX + btnW + btnGap;
    drawGlassPanel(commentX, currentY, btnW, btnH, 40);
    ctx.fillStyle = "#3b82f6";
    ctx.font = "bold 36px Inter";
    ctx.textAlign = "center";
    ctx.fillText("💬", commentX + 50, currentY + btnH / 2 + 10);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px Inter";
    ctx.textAlign = "left";
    ctx.fillText("COMMENT", commentX + 90, currentY + btnH / 2 + 8);

    // Subscribe
    const subX = commentX + btnW + btnGap;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(subX, currentY, btnW, btnH, 40);
    const subGrad = ctx.createLinearGradient(subX, currentY, subX, currentY + btnH);
    subGrad.addColorStop(0, "rgba(0, 122, 204, 0.5)");
    subGrad.addColorStop(1, "rgba(0, 122, 204, 0.2)");
    ctx.fillStyle = subGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 122, 204, 0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowColor = "rgba(0, 122, 204, 0.6)";
    ctx.shadowBlur = 25;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px Inter";
    ctx.textAlign = "center";
    ctx.fillText("🔔", subX + 45, currentY + btnH / 2 + 10);
    ctx.font = "bold 24px Inter";
    ctx.textAlign = "left";
    ctx.fillText("SUBSCRIBE", subX + 85, currentY + btnH / 2 + 8);
  }, [isVisible, variant, channelLogo]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full object-contain" />
    </div>
  );
};

export default EngagementCTA;
