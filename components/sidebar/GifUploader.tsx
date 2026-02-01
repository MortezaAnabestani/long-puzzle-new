import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Upload, X, FileCode2, Terminal } from 'lucide-react';

interface GifUploaderProps {
  onGifSelect: (url: string | null) => void;
  disabled?: boolean;
}

const GifUploader: React.FC<GifUploaderProps> = ({ onGifSelect, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'image/gif') {
      const url = URL.createObjectURL(file);
      setFileName(file.name);
      onGifSelect(url);
    } else if (file) {
      alert("SYSTEM ERROR: Invalid file format. Expected .gif");
    }
  };

  const handleClear = () => {
    setFileName(null);
    onGifSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full border border-slate-800 bg-slate-900/50 rounded-md overflow-hidden">
      {/* Header Section - Technical Look */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#007acc]" />
          <span className="text-[11px] font-mono font-medium text-slate-300 uppercase tracking-tight">
            Asset Configuration
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">TYPE: GIF</span>
      </div>

      <div className="p-3 space-y-3">
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/gif"
          className="hidden"
        />
        
        {!fileName ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="group w-full h-20 border border-dashed border-slate-700 hover:border-[#007acc]/50 bg-slate-800/20 hover:bg-slate-800/50 rounded-md flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2 text-slate-500 group-hover:text-[#007acc] transition-colors">
              <Upload className="w-4 h-4" />
              <span className="text-[11px] font-mono">INITIATE_UPLOAD</span>
            </div>
            <span className="text-[9px] text-slate-600 font-mono uppercase">Target: Like & Sub Animation</span>
          </button>
        ) : (
          <div className="flex items-center justify-between p-2 bg-[#007acc]/5 border border-[#007acc]/20 rounded-md">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded bg-[#007acc]/10 border border-[#007acc]/20 flex items-center justify-center text-[#007acc]">
                <FileCode2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-mono text-slate-200 truncate max-w-[150px]">{fileName}</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase">MOUNTED</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleClear}
              className="p-1.5 hover:bg-red-500/10 hover:text-red-400 text-slate-500 rounded transition-colors"
              title="Unmount Asset"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Info Footer */}
        <div className="flex items-start gap-2 px-2 py-1.5 bg-slate-950/30 rounded border border-slate-800/50">
          <div className="mt-0.5 w-1 h-1 bg-slate-600 rounded-full" />
          <p className="text-[10px] text-slate-500 font-mono leading-tight">
            RENDER_NOTE: Asset will be injected into the lower viewport overlay at specified intervals.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GifUploader;