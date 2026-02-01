
import React from 'react';
import { Loader2, AlertCircle, Target, Activity, Hash } from 'lucide-react';

interface PuzzleOverlayProps {
  isLoading: boolean;
  error: string | null;
  isShorts: boolean;
  topicCategory?: string;
  buildProgress?: number;
}

const PuzzleOverlay: React.FC<PuzzleOverlayProps> = ({ isLoading, error, isShorts, topicCategory, buildProgress }) => {
  if (error) {
    return (
      <div className="absolute inset-0 z-[60] flex items-center justify-center bg-zinc-950 p-4 font-mono">
        <div className="w-full max-w-sm border border-red-900/30 bg-red-950/5 rounded-md overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-red-900/30 bg-red-900/10">
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[11px] font-medium text-red-500">ERR_MODULE_FAILURE</span>
          </div>
          <div className="p-3">
            <p className="text-[11px] text-red-400/80 leading-relaxed">
              <span className="opacity-50 mr-2">{`>`}</span>
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-sm font-mono">
        <div className="flex flex-col items-center gap-3 p-6 border border-slate-800 rounded-md bg-zinc-900/50 min-w-[240px]">
          <Loader2 className="w-6 h-6 text-[#007acc] animate-spin" />
          <div className="flex flex-col items-center gap-1 w-full">
            <span className="text-[11px] font-medium text-slate-200 uppercase tracking-widest">Synthesizing Nodes</span>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
               <div className="h-full bg-[#007acc] transition-all duration-300" style={{ width: `${buildProgress}%` }} />
            </div>
            <span className="text-[9px] text-slate-500 mt-1">{buildProgress}% Complete</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="absolute top-0 left-0 w-full p-2 z-40 flex justify-between items-start pointer-events-none">
        {topicCategory && (
          <div className="flex flex-col gap-1 pointer-events-auto">
            <div className="flex items-center gap-0 border border-slate-800 bg-zinc-950/90 rounded-md overflow-hidden shadow-sm">
              <div className="px-2 py-1.5 border-r border-slate-800 bg-slate-900/50">
                <Target className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="px-3 py-1.5 flex flex-col justify-center min-w-[100px]">
                <span className="text-[9px] text-slate-500 font-mono uppercase leading-none mb-0.5">Category_ID</span>
                <span className="text-[11px] font-medium text-slate-200 leading-none truncate max-w-[120px]">
                  {topicCategory}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1 items-end pointer-events-auto">
          <div className="flex items-center border border-slate-800 bg-zinc-950/90 rounded-md overflow-hidden">
            <div className="px-2 py-1.5 border-r border-slate-800 bg-slate-900/50">
              <Activity className="w-3.5 h-3.5 text-[#007acc]" />
            </div>
            <div className="px-3 py-1.5 flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 font-mono uppercase leading-none mb-0.5">Aspect_Ratio</span>
                <span className="text-[11px] font-medium text-slate-200 leading-none font-mono">
                  {isShorts ? '9:16' : '16:9'}
                </span>
              </div>
              <div className="h-4 w-[1px] bg-slate-800" />
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#007acc] rounded-sm animate-pulse" />
                <span className="text-[9px] font-mono text-[#007acc]">SYNCED</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded-md border border-white/5">
            <Hash className="w-3 h-3 text-slate-600" />
            <span className="text-[9px] font-mono text-slate-500">V.2.0.4-RC</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default PuzzleOverlay;
