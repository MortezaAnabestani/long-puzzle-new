
import { Download, Sparkles, Eye, Smartphone, Monitor } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { YouTubeMetadata } from '../services/geminiService';
import Button from './ui/Button';

interface ThumbnailGeneratorProps {
  imageUrl: string | null;
  metadata: YouTubeMetadata | null;
  isLoading: boolean;
  isShortsMode?: boolean;
  onThumbnailReady?: (url: string) => void;
}

const ThumbnailGenerator: React.FC<ThumbnailGeneratorProps> = ({ imageUrl, metadata, isLoading, isShortsMode = false, onThumbnailReady }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl || !metadata || isLoading) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      // Adjusted for 9:19 (tall vertical)
      const width = 1080;
      const height = isShortsMode ? 2280 : 720;
      canvas.width = width;
      canvas.height = height;

      // 1. HIGH-END GLASSMORPHISM BACKGROUND
      ctx.save();
      // Draw centered image to fill tall background
      const scale = Math.max(width / img.width, height / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (width - dw) / 2;
      const dy = (height - dh) / 2;
      
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 0.45;
      ctx.filter = 'blur(110px) saturate(2.5)';
      ctx.drawImage(img, dx - 100, dy - 100, dw + 200, dh + 200);
      ctx.restore();

      // 2. LUXURY OVERLAY VIGNETTE
      const vignette = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width*0.9);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.95)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      // 3. CENTRAL MYSTERY LENS
      const centerX = width / 2;
      const centerY = height * (isShortsMode ? 0.4 : 0.45);
      const radius = isShortsMode ? 380 : 210;

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 15, 0, Math.PI * 2);
      ctx.lineWidth = 18;
      ctx.strokeStyle = '#ff3333';
      ctx.shadowColor = '#ff3333';
      ctx.shadowBlur = 60;
      ctx.globalAlpha = 0.8;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();
      const zoom = 0.7;
      const sSize = Math.min(img.width, img.height) * zoom;
      ctx.drawImage(img, img.width/2 - sSize/2, img.height/2 - sSize/2, sSize, sSize, centerX - radius, centerY - radius, radius * 2, radius * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = `900 ${isShortsMode ? '580px' : '280px'} Inter`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(255,255,255,0.4)';
      ctx.shadowBlur = 25;
      ctx.fillText('?', centerX, centerY + (isShortsMode ? 30 : 12));
      ctx.restore();

      // 5. CINEMATIC TEXT (At bottom)
      const titlePadding = width * 0.1;
      const titleFontSize = isShortsMode ? 110 : 75;
      ctx.font = `900 ${titleFontSize}px Inter`;
      ctx.textAlign = 'center';
      
      const words = (metadata.title || "VIRAL REVEAL").toUpperCase().split(' ');
      let lines = [];
      let currentLine = words[0];
      for (let i = 1; i < words.length; i++) {
        if (ctx.measureText(currentLine + ' ' + words[i]).width < width - titlePadding * 2) {
          currentLine += ' ' + words[i];
        } else {
          lines.push(currentLine);
          currentLine = words[i];
        }
      }
      lines.push(currentLine);

      const textStartY = isShortsMode ? height - 800 : height - 240;
      const grad = ctx.createLinearGradient(0, textStartY - 150, 0, height);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0.95)');
      grad.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, textStartY - 150, width, height - (textStartY - 150));

      lines.forEach((line, idx) => {
        const y = textStartY + (idx * titleFontSize * 1.2);
        ctx.shadowColor = 'rgba(255,0,0,0.7)';
        ctx.shadowBlur = 40;
        ctx.fillStyle = (idx === lines.length - 1) ? '#ffcc00' : '#ffffff';
        ctx.fillText(line, centerX, y);
      });

      const finalUrl = canvas.toDataURL('image/jpeg', 0.98);
      setThumbnailUrl(finalUrl);
      if (onThumbnailReady) onThumbnailReady(finalUrl);
    };
  }, [imageUrl, metadata, isLoading, isShortsMode]);

  const handleDownload = () => {
    if (!thumbnailUrl) return;
    const link = document.createElement('a');
    link.download = `Studio-Cover-9x19-${Date.now()}.jpg`;
    link.href = thumbnailUrl;
    link.click();
  };

  if (isLoading) return (
    <div className="mt-8 max-w-4xl mx-auto aspect-[9/19] max-h-[700px] bg-white/5 rounded-[4.5rem] border border-white/10 animate-pulse flex flex-col items-center justify-center">
      <Eye className="w-20 h-20 text-white/10 mb-8" />
      <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em]">Rendering 9:19 Vertical Asset...</div>
    </div>
  );

  if (!imageUrl || !metadata) return null;

  return (
    <div className="mt-14 max-w-5xl mx-auto px-6">
      <div className="bg-[#050505] border border-white/5 p-14 rounded-[4.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20"><Sparkles className="w-12 h-12 text-white" /></div>
        <div className="flex items-center justify-between mb-12 relative z-10">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 bg-red-600/20 rounded-3xl flex items-center justify-center text-red-500 shadow-[0_0_40px_rgba(220,38,38,0.25)] border border-red-500/20">
              {isShortsMode ? <Smartphone className="w-8 h-8" /> : <Monitor className="w-8 h-8" />}
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                9:19 Studio Cover
              </h3>
              <p className="text-[11px] text-slate-600 font-black uppercase tracking-[0.5em] mt-1.5 italic">Retina Ready Vertical</p>
            </div>
          </div>
          <Button variant="secondary" onClick={handleDownload} icon={<Download className="w-5 h-5" />}>
            Export JPEG
          </Button>
        </div>
        <div className={`relative ${isShortsMode ? 'max-w-[400px] mx-auto aspect-[9/19]' : 'aspect-video'} rounded-[4rem] overflow-hidden border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.9)] group cursor-pointer bg-black`}>
          <canvas ref={canvasRef} className="hidden" />
          {thumbnailUrl && <img src={thumbnailUrl} className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-105" />}
          <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[4px]">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-3xl border border-white/10 animate-pulse">
               <Eye className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailGenerator;
