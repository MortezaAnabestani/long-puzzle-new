
import React, { useRef } from 'react';
import PuzzleCanvas, { CanvasHandle } from './PuzzleCanvas';
import { PieceShape, PieceMaterial, MovementType, PuzzleBackground, StoryArc } from '../types';
import { Maximize2, Smartphone, Monitor } from 'lucide-react';

interface CanvasAreaProps {
  canvasHandleRef: React.RefObject<CanvasHandle | null>;
  imageUrl: string | null;
  durationMinutes: number;
  isColoring: boolean;
  pieceCount: number;
  shape: PieceShape;
  material: PieceMaterial;
  movement: MovementType;
  background: PuzzleBackground;
  topicCategory?: string;
  engagementGifUrl: string | null;
  channelLogoUrl: string | null;
  onProgress: (p: number) => void;
  onFinished: () => void;
  onToggleSolve: () => void;
  docSnippets?: string[];
  storyArc?: StoryArc | null;
  showDocumentaryTips?: boolean;
  progress: number;
}

const CanvasArea: React.FC<CanvasAreaProps> = ({
  canvasHandleRef, imageUrl, durationMinutes, isColoring, pieceCount, shape, material, movement, background, topicCategory, engagementGifUrl, channelLogoUrl, onProgress, onFinished, onToggleSolve,
  docSnippets = [], storyArc = null, showDocumentaryTips = false, progress
}) => {
  const phoneFrameRef = useRef<HTMLDivElement>(null);

  const handleFullscreen = () => {
    if (phoneFrameRef.current) {
      if (!document.fullscreenElement) {
        phoneFrameRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#010103] overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0" 
             style={{
               backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)',
               backgroundSize: '40px 40px'
             }}
        />
      </div>

      <div className="relative h-[94%] flex items-center justify-center py-6 px-4">
        <div 
          ref={phoneFrameRef}
          className="phone-frame-container relative h-full aspect-[9/19.5] bg-[#050508] rounded-[3.8rem] p-3 shadow-[0_0_80px_rgba(0,0,0,0.9),0_0_0_4px_#1a1a1f] border border-white/10 flex flex-col group overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-12 flex items-center justify-center z-50 pointer-events-none">
            <div className="w-32 h-7 bg-black rounded-b-[1.5rem] flex items-center justify-center px-4 gap-3 border-x border-b border-white/5">
              <div className="w-2 h-2 rounded-full bg-zinc-900 shadow-inner" />
              <div className="w-10 h-1.5 bg-zinc-900 rounded-full" />
            </div>
          </div>

          <div className="absolute top-14 right-6 z-[60] flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <button 
              onClick={handleFullscreen}
              className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-blue-600 transition-all shadow-2xl"
              title="Fullscreen Monitor"
            >
              <Maximize2 className="w-6 h-6" />
            </button>
          </div>

          <div className="w-full h-full rounded-[3.1rem] overflow-hidden bg-black relative border border-white/5 shadow-inner">
            {imageUrl ? (
              <PuzzleCanvas
                ref={canvasHandleRef}
                imageUrl={imageUrl}
                durationMinutes={durationMinutes}
                pieceCount={pieceCount}
                shape={shape}
                material={material}
                movement={movement}
                background={background}
                topicCategory={topicCategory}
                engagementGifUrl={engagementGifUrl}
                channelLogoUrl={channelLogoUrl}
                onProgress={onProgress}
                isSolving={isColoring}
                onFinished={onFinished}
                onToggleSolve={onToggleSolve}
                docSnippets={docSnippets}
                storyArc={storyArc}
                showDocumentaryTips={showDocumentaryTips}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050508]">
                <div className="relative mb-8">
                  <div className="w-20 h-20 border-2 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Smartphone className="w-8 h-8 text-zinc-800" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                   <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.5em]">Studio_Standby</span>
                   <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] rounded-full border border-white/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-[8px] text-zinc-500 font-mono">LINK_READY</span>
                   </div>
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/10 rounded-full z-50" />
        </div>
      </div>
    </div>
  );
};

export default CanvasArea;
