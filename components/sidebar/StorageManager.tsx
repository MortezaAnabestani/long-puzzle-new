import React from 'react';
import { FolderOpen, ShieldCheck, AlertTriangle, Download, HardDrive, Info, Terminal } from 'lucide-react';

interface StorageManagerProps {
  directoryName: string | null;
  isAutoMode: boolean;
  onSelectDirectory: () => Promise<void>;
  isFileSystemApiBlocked?: boolean;
}

const StorageManager: React.FC<StorageManagerProps> = ({ 
  directoryName, 
  isAutoMode, 
  onSelectDirectory,
  isFileSystemApiBlocked = false
}) => {
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await onSelectDirectory();
  };

  return (
    <div className="w-full border border-slate-200/10 bg-slate-900/50 rounded-md overflow-hidden font-sans">
      {/* Header Section */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800/30 border-b border-slate-200/10">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            I/O Configuration
          </span>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${
          directoryName 
            ? 'bg-[#007acc]/10 border-[#007acc]/20 text-[#007acc]' 
            : isFileSystemApiBlocked 
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
            : 'bg-slate-800 border-slate-700 text-slate-500'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            directoryName ? 'bg-[#007acc]' : isFileSystemApiBlocked ? 'bg-amber-500' : 'bg-slate-500'
          }`} />
          {directoryName ? 'MOUNTED' : isFileSystemApiBlocked ? 'FALLBACK' : 'IDLE'}
        </div>
      </div>

      {/* Main Action Area */}
      <div className="p-2 space-y-2">
        <button
          type="button"
          onClick={handleClick}
          disabled={isAutoMode}
          className={`group relative w-full flex items-center gap-3 p-2 rounded-md border transition-all duration-200 text-left ${
            directoryName 
            ? 'bg-[#007acc]/5 border-[#007acc]/30 hover:bg-[#007acc]/10' 
            : isFileSystemApiBlocked
            ? 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 cursor-not-allowed'
            : 'bg-slate-800/20 border-slate-700 hover:border-slate-600 hover:bg-slate-800/40'
          }`}
        >
          {/* Status Indicator Bar */}
          <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-r ${
            directoryName ? 'bg-[#007acc]' : isFileSystemApiBlocked ? 'bg-amber-500' : 'bg-slate-600'
          }`} />

          <div className={`p-2 rounded-md ${
            directoryName ? 'bg-[#007acc]/10 text-[#007acc]' : 'bg-slate-800 text-slate-400'
          }`}>
            {isFileSystemApiBlocked ? <Download className="w-4 h-4" /> : <FolderOpen className="w-4 h-4" />}
          </div>
          
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] text-slate-500 font-medium uppercase mb-0.5">
              {directoryName ? "Target Directory" : "Output Destination"}
            </span>
            <span className={`text-[12px] font-mono truncate ${
              directoryName ? 'text-slate-200' : 'text-slate-400'
            }`}>
              {directoryName || (isFileSystemApiBlocked ? "Browser Default Downloads" : "~/Select-Folder...")}
            </span>
          </div>

          {directoryName && (
            <ShieldCheck className="w-4 h-4 text-[#007acc] opacity-80" />
          )}
        </button>

        {/* Info / Warning Section - Table Style */}
        {(isFileSystemApiBlocked || directoryName) && (
          <div className="grid grid-cols-1 gap-px bg-slate-800/50 border border-slate-200/10 rounded-md overflow-hidden">
            {isFileSystemApiBlocked && !directoryName && (
              <div className="flex items-start gap-3 p-2 bg-amber-950/10">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-amber-500">FileSystem API Restricted</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Environment sandbox detected. Files will be saved to default <span className="text-slate-300 font-mono">Downloads</span> folder.
                  </p>
                </div>
              </div>
            )}

            {directoryName && (
              <div className="flex items-center justify-between p-2 bg-slate-900/30">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] text-slate-400">Write Access</span>
                </div>
                <span className="text-[10px] font-mono text-[#007acc]">GRANTED_RW</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StorageManager;