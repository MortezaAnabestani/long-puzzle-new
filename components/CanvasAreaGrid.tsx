import React, { useRef } from "react";
import PuzzleCanvasGrid, { CanvasHandle } from "./PuzzleCanvasGrid";
import { PieceShape, PieceMaterial, MovementType, PuzzleBackground, Chapter } from "../types";
import { Maximize2 } from "lucide-react";

interface CanvasAreaGridProps {
  canvasHandleRef: React.RefObject<CanvasHandle | null>;
  chapters: Chapter[]; // همه 9 فصل
  durationPerChapterSeconds: number; // 45 ثانیه
  isColoring: boolean;
  pieceCount: number;
  shape: PieceShape;
  material: PieceMaterial;
  movement: MovementType;
  background: PuzzleBackground;
  topicCategory?: string;
  channelLogoUrl: string | null;
  onProgress: (p: number) => void;
  onChapterChange?: (chapterNum: number) => void; // ✅
  onFinished: () => void;
  showDocumentaryTips?: boolean;
  progress: number;
}

const CanvasAreaGrid: React.FC<CanvasAreaGridProps> = ({
  canvasHandleRef,
  chapters,
  durationPerChapterSeconds,
  isColoring,
  pieceCount,
  shape,
  material,
  movement,
  background,
  topicCategory,
  channelLogoUrl,
  onProgress,
  onChapterChange,
  onFinished,
  showDocumentaryTips = false,
  progress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.error(`Error: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#010103] overflow-hidden relative">
      {/* Grid pattern background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Landscape container (16:9) */}
      <div className="relative w-full h-full flex items-center justify-center p-6">
        <div
          ref={containerRef}
          className="relative w-full h-full max-w-[95%] max-h-[90%] bg-[#050508] rounded-3xl p-4 shadow-[0_0_80px_rgba(0,0,0,0.9),0_0_0_4px_#1a1a1f] border border-white/10 flex flex-col group overflow-hidden"
          style={{ aspectRatio: "16/9" }}
        >
          {/* Fullscreen button */}
          <div className="absolute top-4 right-4 z-[60] flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <button
              onClick={handleFullscreen}
              className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-blue-600 transition-all shadow-2xl"
              title="Fullscreen"
            >
              <Maximize2 className="w-6 h-6" />
            </button>
          </div>

          {/* Canvas */}
          <div className="w-full h-full rounded-2xl overflow-hidden bg-black relative border border-white/5 shadow-inner">
            {chapters.length === 9 ? (
              <PuzzleCanvasGrid
                ref={canvasHandleRef}
                chapters={chapters}
                durationPerChapterSeconds={durationPerChapterSeconds}
                pieceCount={pieceCount}
                shape={shape}
                material={material}
                movement={movement}
                background={background}
                topicCategory={topicCategory}
                channelLogoUrl={channelLogoUrl}
                onProgress={onProgress}
                onChapterChange={onChapterChange}
                isSolving={isColoring}
                onFinished={onFinished}
                showDocumentaryTips={showDocumentaryTips}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050508]">
                <div className="text-center space-y-4">
                  <div className="text-red-500 text-xl font-bold">⚠️ خطا</div>
                  <div className="text-white/70">
                    باید دقیقاً 9 فصل داشته باشید.
                    <br />
                    فصل‌های موجود: {chapters.length}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {progress > 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanvasAreaGrid;
