import React from 'react';
import { Radio, ShieldAlert, Activity, Database, Wifi, WifiOff, FileJson, Globe } from 'lucide-react';
import { useBackendMode } from '../contexts/BackendModeContext';
import { BackendMode } from '../types';

interface HeaderProps {
  progress: number;
  isColoring: boolean;
  isRecording: boolean;
  error: string | null;
  hasImage: boolean;
}

const Header: React.FC<HeaderProps> = ({ progress, isColoring, isRecording, error, hasImage }) => {
  const { mode, isConnected, setMode, checkConnection } = useBackendMode();

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-50">
      {/* Left: Brand Identity & System Info */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#007acc]/5 border border-[#007acc]/20 rounded-md flex items-center justify-center">
          <Radio className="w-4 h-4 text-[#007acc]" />
        </div>
        <div className="flex flex-col justify-center h-full">
          <h1 className="text-sm font-semibold text-slate-800 tracking-tight leading-none">
            Short<span className="text-[#007acc]">PuzzleMaker</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">SYS.ENG.V1</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-[10px] font-mono text-slate-400">READY</span>
          </div>
        </div>
      </div>

      {/* Right: Status Indicators & Metrics */}
      <div className="flex items-center gap-3">
        {/* Backend Mode Switcher */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md">
          <button
            onClick={() => checkConnection()}
            className="hover:opacity-70 transition-opacity"
            title="بررسی اتصال"
          >
            {isConnected ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
          <div className="w-px h-4 bg-slate-300"></div>
          <button
            onClick={() => setMode(BackendMode.JSON)}
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${
              mode === BackendMode.JSON
                ? 'bg-amber-500 text-white'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            title="JSON Mode: فقط ذخیره و بررسی تشابه"
          >
            <FileJson className="w-3 h-3" />
          </button>
          <button
            onClick={() => setMode(BackendMode.ALL)}
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${
              mode === BackendMode.ALL
                ? 'bg-[#007acc] text-white'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            title="All Mode: همه فراخوانی‌ها از بک‌اند"
          >
            <Globe className="w-3 h-3" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-md">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            <span className="text-[11px] font-medium text-red-700 font-mono">{error}</span>
          </div>
        )}
        
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#007acc]/5 border border-[#007acc]/20 rounded-md">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007acc] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007acc]"></span>
            </div>
            <span className="text-[11px] font-medium text-[#007acc] font-mono uppercase tracking-tight">Uplink Active</span>
          </div>
        )}

        {hasImage && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Processing</span>
                <span className="text-[11px] font-mono font-bold text-slate-700">{Math.floor(progress)}%</span>
              </div>
              <div className="w-32 h-1.5 bg-slate-100 rounded-sm overflow-hidden border border-slate-200">
                <div 
                  className="h-full bg-[#007acc] transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
            <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center text-slate-400">
                <Database className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;