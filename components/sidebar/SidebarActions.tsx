import React from 'react';
import { Settings2, Play, Square, Activity, Cpu } from 'lucide-react';
import Button from '../ui/Button';

interface SidebarActionsProps {
  isGenerating: boolean;
  isSolving: boolean;
  isAutoMode: boolean;
  hasImage: boolean;
  onGenerate: () => void;
  onToggleSolve: () => void;
}

const SidebarActions: React.FC<SidebarActionsProps> = ({
  isGenerating, isSolving, isAutoMode, hasImage, onGenerate, onToggleSolve
}) => {
  return (
    <div className="w-full border border-slate-200/10 bg-slate-900/50 rounded-md p-3">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/5">
        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
          Control Unit
        </span>
        {isGenerating && (
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007acc] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007acc]"></span>
            </span>
            <span className="text-[10px] font-mono text-[#007acc]">PROCESSING</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {/* Synthesis Control */}
        <div className="group relative">
          <Button
            onClick={onGenerate}
            isLoading={isGenerating}
            disabled={isSolving || isAutoMode}
            className="w-full h-9 flex items-center justify-between px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-[11px] font-mono transition-all disabled:opacity-50"
            icon={<Cpu className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />}
          >
            <span className="tracking-tight">
              {isGenerating ? 'SYNTHESIZING_DATA...' : 'INIT_SYNTHESIS'}
            </span>
          </Button>
        </div>

        {/* Solver Control */}
        <div className="group relative">
          <Button
            onClick={onToggleSolve}
            disabled={!hasImage || isGenerating}
            // Overriding variant styles for strict functional look
            className={`w-full h-9 flex items-center justify-between px-3 rounded-md text-[11px] font-mono border transition-all ${
              isSolving 
                ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' 
                : 'bg-[#007acc]/10 border-[#007acc]/20 text-[#007acc] hover:bg-[#007acc]/20'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
            icon={
              isSolving ? (
                <Square className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )
            }
          >
            <span className="tracking-tight font-semibold">
              {isSolving ? 'ABORT_SEQUENCE' : 'EXECUTE_SOLVER'}
            </span>
          </Button>
        </div>
      </div>

      {/* Status Footer */}
      <div className="mt-3 pt-2 border-t border-slate-200/5 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
        <Activity className="w-3 h-3" />
        <span>SYSTEM_READY</span>
      </div>
    </div>
  );
};

export default SidebarActions;