import React from 'react';
import { Sparkles, Activity, Terminal } from 'lucide-react';
import Button from '../ui/Button';

interface NeuralAutoPilotProps {
  isAutoMode: boolean;
  isFullPackage: boolean;
  isSolving: boolean;
  isGenerating: boolean;
  onToggleFullPackage: () => void;
  onAutoMode: () => void;
}

const NeuralAutoPilot: React.FC<NeuralAutoPilotProps> = ({
  isAutoMode, isFullPackage, isSolving, isGenerating, onToggleFullPackage, onAutoMode
}) => {
  return (
    <div className="w-full border border-slate-200/10 bg-slate-950 rounded-md overflow-hidden font-sans">
      {/* Header Section: Technical Status Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/50 border-b border-slate-200/10">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-tight">
            System Control
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isAutoMode ? 'bg-[#007acc] animate-pulse' : 'bg-slate-700'}`} />
          <span className="text-[10px] font-mono text-slate-500">
            {isAutoMode ? 'ACTIVE' : 'IDLE'}
          </span>
        </div>
      </div>

      <div className="p-2 grid gap-2">
        {/* Main Action Button */}
        <Button
          onClick={onAutoMode}
          isLoading={isAutoMode}
          disabled={isSolving || isGenerating}
          variant="secondary"
          className={`
            w-full h-10 flex items-center justify-center gap-2 rounded-md border text-[12px] font-medium transition-all duration-200
            ${isAutoMode 
              ? 'bg-[#007acc]/10 border-[#007acc] text-[#007acc] shadow-[0_0_10px_rgba(0,122,204,0.15)]' 
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-500'
            }
          `}
          icon={<Sparkles className={`w-4 h-4 ${isAutoMode ? 'animate-spin-slow' : ''}`} />}
        >
          {isAutoMode ? 'AUTO-PILOT ENGAGED' : 'INITIATE NEURAL AUTO-PILOT'}
        </Button>

        {/* Configuration Row (Toggle) */}
        <div className={`
          flex items-center justify-between px-3 py-2.5 bg-slate-900/30 border border-slate-800 rounded-md transition-opacity
          ${isAutoMode ? 'opacity-50 pointer-events-none' : 'hover:border-slate-700'}
        `}>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-slate-500" />
              <span className="text-[11px] font-medium text-slate-200">Full Bundle Execution</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono pl-5">
              7x STRATEGIC SEQUENCES
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={isFullPackage} 
              onChange={onToggleFullPackage}
              disabled={isAutoMode}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-sm border border-slate-700 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-slate-400 after:border-gray-300 after:border after:rounded-sm after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#007acc] peer-checked:border-[#007acc] peer-checked:after:bg-white peer-checked:after:border-white"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default NeuralAutoPilot;