import React from 'react';
import { Music, ShieldCheck, AlertCircle, Activity } from 'lucide-react';

interface AudioStatusProps {
  isSolving: boolean;
  musicTrack?: string;
  hasError?: boolean;
}

const AudioStatus: React.FC<AudioStatusProps> = ({ isSolving, musicTrack, hasError }) => {
  return (
    <div className="h-12 border-t border-slate-800 bg-slate-950 flex items-center px-4 gap-4 sticky bottom-0 z-[100] font-mono text-[11px]">
      {/* Left Section: Audio Source Info */}
      <div className="flex items-center gap-3 border-r border-slate-800 pr-4">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center border ${
          hasError 
            ? 'bg-amber-900/20 border-amber-500/30 text-amber-500' 
            : isSolving 
              ? 'bg-[#007acc]/10 border-[#007acc]/30 text-[#007acc]' 
              : 'bg-slate-900 border-slate-800 text-slate-500'
        }`}>
          {hasError ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Music className="w-4 h-4" />
          )}
        </div>
        
        <div className="flex flex-col justify-center h-full">
          <span className="text-[10px] text-slate-500 uppercase leading-none mb-1">
            CH_01 :: AUDIO_OUT
          </span>
          <div className={`font-medium truncate max-w-[180px] leading-none ${hasError ? 'text-amber-500' : 'text-slate-200'}`}>
            {hasError ? 'ERR_CORS_BLOCK' : musicTrack || "IDLE_STATE"}
          </div>
        </div>
      </div>

      {/* Middle Section: Technical Visualizer */}
      <div className="flex-1 flex items-center justify-start gap-4">
        {isSolving && !hasError ? (
          <div className="flex gap-[2px] items-end h-6 px-2 border-l border-r border-slate-800/50 bg-slate-900/30">
            {[...Array(16)].map((_, i) => (
              <div 
                key={i} 
                className="w-[3px] bg-[#007acc] rounded-[1px]" 
                style={{ 
                  height: `${20 + Math.random() * 80}%`, 
                  animation: `pulse 0.${5 + (i % 3)}s infinite alternate`,
                  opacity: 0.6 + (Math.random() * 0.4)
                }} 
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-600">
            <Activity className="w-3 h-3" />
            <span className="text-[10px]">NO_SIGNAL_INPUT</span>
          </div>
        )}
        
        {/* Metadata Display */}
        {isSolving && (
           <div className="hidden md:flex gap-4 text-slate-500">
             <div className="flex gap-2">
               <span>BITRATE:</span>
               <span className="text-slate-300">320KBPS</span>
             </div>
             <div className="flex gap-2">
               <span>FREQ:</span>
               <span className="text-slate-300">44.1KHZ</span>
             </div>
           </div>
        )}
      </div>

      {/* Right Section: System Status */}
      <div className="flex items-center gap-4 pl-4 border-l border-slate-800">
         <div className="flex items-center gap-2">
           <div className={`w-1.5 h-1.5 rounded-full ${!hasError ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
           <span className="text-slate-400 uppercase">SYS_READY</span>
         </div>

         <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[#007acc]">
           <ShieldCheck className="w-3.5 h-3.5" />
           <span className="text-[10px] font-bold tracking-tight">SECURE_ASSET</span>
         </div>
      </div>
    </div>
  );
};

export default AudioStatus;