import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Check, Database, ShieldCheck, Zap, Activity, Globe, FileAudio } from 'lucide-react';
import { SONIC_LIBRARY } from '../../services/geminiService';

interface SonicGalleryProps {
  onSelect: (url: string, title: string) => void;
  onClose: () => void;
  activeUrl: string | null;
}

const SonicGallery: React.FC<SonicGalleryProps> = ({ onSelect, onClose, activeUrl }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    previewAudioRef.current = new Audio();
    previewAudioRef.current.crossOrigin = "anonymous";
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  const togglePreview = (id: string, url: string) => {
    if (!previewAudioRef.current) return;
    if (playingId === id) {
      previewAudioRef.current.pause();
      setPlayingId(null);
    } else {
      previewAudioRef.current.src = url;
      previewAudioRef.current.play().catch(e => console.warn("Preview blocked", e));
      setPlayingId(id);
    }
  };

  const handleSelect = (url: string, title: string) => {
    if (previewAudioRef.current) previewAudioRef.current.pause();
    onSelect(url, title);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm font-mono">
      {/* Main Container: Strict Engineering Style */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/50 rounded-md shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header: Technical Data Bar */}
        <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#007acc]/10 border border-[#007acc]/20 rounded-md flex items-center justify-center">
              <Database className="w-4 h-4 text-[#007acc]" />
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-[13px] font-bold text-slate-200 tracking-tight">ASSET_LIBRARY_V2</h2>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span>CDN_LINKED</span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>AUDIO_STREAM</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex px-3 py-1.5 bg-slate-800 border border-slate-700/50 rounded-md text-[10px] text-slate-400 items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                STATUS: ONLINE
             </div>
             <button 
               onClick={onClose} 
               className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200 transition-colors border border-transparent hover:border-slate-700"
             >
               <X className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-[10px] font-semibold text-slate-500 uppercase tracking-wider select-none">
          <div className="col-span-1 text-center">Control</div>
          <div className="col-span-6 sm:col-span-5">Asset Identifier</div>
          <div className="hidden sm:block sm:col-span-3">Properties</div>
          <div className="col-span-5 sm:col-span-3 text-right">Operation</div>
        </div>

        {/* List: Dense Data Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900">
          {SONIC_LIBRARY.map((track, index) => {
             const isActive = activeUrl === track.url;
             const isPlaying = playingId === track.id;
             
             return (
              <div 
                key={track.id}
                className={`group grid grid-cols-12 gap-2 px-4 py-2.5 items-center border-b border-slate-800/50 hover:bg-slate-800/40 transition-all duration-200 ${isActive ? 'bg-[#007acc]/5' : ''}`}
              >
                {/* Play Control */}
                <div className="col-span-1 flex justify-center">
                  <button 
                    onClick={() => togglePreview(track.id, track.url)}
                    className={`w-8 h-8 rounded-md flex items-center justify-center border transition-all ${isPlaying ? 'bg-[#007acc] border-[#007acc] text-white shadow-[0_0_10px_rgba(0,122,204,0.3)]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'}`}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />}
                  </button>
                </div>

                {/* Track Info */}
                <div className="col-span-6 sm:col-span-5 flex flex-col justify-center pl-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[12px] font-medium truncate ${isActive ? 'text-[#007acc]' : 'text-slate-300 group-hover:text-white'}`}>
                      {track.title}
                    </span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#007acc]" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500 font-mono">ID: {String(index + 1).padStart(3, '0')}</span>
                    <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-[3px] bg-slate-800 text-[9px] text-slate-400 border border-slate-700/50">MP3</span>
                  </div>
                </div>

                {/* Metadata (Hidden on mobile) */}
                <div className="hidden sm:flex col-span-3 flex-col justify-center gap-1">
                   <div className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-slate-500" />
                      <span className="text-[11px] text-slate-400">{track.genre}</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-slate-600" />
                      <span className="text-[10px] text-slate-500">Royalty Free</span>
                   </div>
                </div>

                {/* Action Button */}
                <div className="col-span-5 sm:col-span-3 flex justify-end">
                  <button 
                    onClick={() => handleSelect(track.url, track.title)}
                    className={`h-8 px-3 rounded-md text-[10px] font-bold tracking-wide border transition-all flex items-center gap-2 uppercase ${isActive 
                      ? 'bg-[#007acc]/10 border-[#007acc] text-[#007acc]' 
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white'}`}
                  >
                    {isActive ? (
                      <>Selected <Check className="w-3 h-3" /></>
                    ) : (
                      'Load Asset'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: System Status */}
        <div className="h-9 bg-slate-950 border-t border-slate-800 flex items-center px-4 justify-between text-[10px] text-slate-500 select-none">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 hover:text-slate-300 transition-colors cursor-help">
              <Activity className="w-3 h-3" />
              SYSTEM_READY
            </span>
            <span className="hidden sm:flex items-center gap-1.5 hover:text-slate-300 transition-colors cursor-help">
              <Globe className="w-3 h-3" />
              PROXY: ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FileAudio className="w-3 h-3" />
            <span className="font-mono opacity-60">LIB_VER: 2.4.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SonicGallery;