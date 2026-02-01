import React from 'react';
import { YouTubeMetadata } from '../../services/geminiService';
import { Copy, Hash, AlignLeft, Type, Activity, Download, ExternalLink, Terminal, Cpu } from 'lucide-react';
import Button from '../ui/Button';

interface MetadataStudioProps {
  metadata: YouTubeMetadata | null;
  isLoading: boolean;
  onDownload?: () => void;
}

const MetadataStudio: React.FC<MetadataStudioProps> = ({ metadata, isLoading, onDownload }) => {
  // Loading State: Engineering Skeleton
  if (isLoading) return (
    <div className="mt-8 max-w-6xl mx-auto p-1">
      <div className="border border-zinc-800 bg-zinc-950 rounded-md p-4 space-y-4 animate-pulse">
        <div className="h-8 bg-zinc-900 rounded w-1/4" />
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 space-y-4">
            <div className="h-12 bg-zinc-900 rounded border border-zinc-800/50" />
            <div className="h-64 bg-zinc-900 rounded border border-zinc-800/50" />
          </div>
          <div className="col-span-4 space-y-4">
            <div className="h-32 bg-zinc-900 rounded border border-zinc-800/50" />
            <div className="h-48 bg-zinc-900 rounded border border-zinc-800/50" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!metadata) return null;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="mt-8 mb-24 max-w-7xl mx-auto px-4">
      {/* Main Engineering Container */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden shadow-sm">
        
        {/* Functional Header */}
        <div className="bg-zinc-900/50 border-b border-zinc-800 p-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#007acc]/10 border border-[#007acc]/20 rounded flex items-center justify-center text-[#007acc]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 font-mono tracking-tight">METADATA_GENERATOR_V1</h3>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-zinc-500 font-mono uppercase">System Online • SEO Optimized</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden md:flex flex-col items-end mr-4 px-4 border-r border-zinc-800">
               <span className="text-[10px] text-zinc-500 font-mono uppercase">Est. Reach</span>
               <span className="text-emerald-500 font-mono text-xs font-bold">+84.2%</span>
            </div>
            <Button 
              variant="secondary" 
              onClick={onDownload} 
              icon={<Download className="w-3 h-3" />} 
              className="h-8 text-[11px] font-mono bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
            >
              EXPORT_JSON
            </Button>
          </div>
        </div>

        {/* Content Grid - 12 Column System */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
          
          {/* Left Column: Core Data (8 cols) */}
          <div className="lg:col-span-8 p-6 space-y-6 bg-zinc-950/50">
            
            {/* Title Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-500 font-mono flex items-center gap-2">
                  <Type className="w-3 h-3 text-[#007acc]" />
                  VIDEO_TITLE_STRING
                </label>
                <span className="text-[10px] text-zinc-600 font-mono">{metadata.title.length} chars</span>
              </div>
              <div className="group relative">
                <div className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 font-mono leading-relaxed focus-within:border-[#007acc] transition-colors">
                  {metadata.title}
                </div>
                <button 
                  onClick={() => copy(metadata.title)}
                  className="absolute right-2 top-2 p-1.5 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-all opacity-0 group-hover:opacity-100"
                  title="Copy to clipboard"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-500 font-mono flex items-center gap-2">
                  <AlignLeft className="w-3 h-3 text-[#007acc]" />
                  DESCRIPTION_BLOCK
                </label>
                <span className="text-[10px] text-zinc-600 font-mono">Markdown Supported</span>
              </div>
              <div className="group relative">
                <div className="w-full h-80 bg-zinc-900 border border-zinc-800 rounded-md p-4 text-[12px] text-zinc-300 font-mono leading-relaxed overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                  {metadata.description}
                </div>
                <button 
                  onClick={() => copy(metadata.description)}
                  className="absolute right-4 top-4 p-1.5 bg-zinc-800/80 backdrop-blur border border-zinc-700 text-zinc-400 hover:text-white rounded transition-all opacity-0 group-hover:opacity-100"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Metadata & Logic (4 cols) */}
          <div className="lg:col-span-4 bg-zinc-900/30 flex flex-col">
            
            {/* Logic Block */}
            <div className="p-5 border-b border-zinc-800">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-3.5 h-3.5 text-[#007acc]" />
                <span className="text-[11px] font-bold text-zinc-400 font-mono uppercase">CTR_STRATEGY_CORE</span>
              </div>
              <div className="bg-[#007acc]/5 border border-[#007acc]/20 rounded-md p-3">
                <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">
                  <span className="text-[#007acc] mr-2">{'>'}</span>
                  {metadata.ctr_strategy}
                </p>
              </div>
            </div>

            {/* Tags Block */}
            <div className="p-5 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-[#007acc]" />
                  <span className="text-[11px] font-bold text-zinc-400 font-mono uppercase">TAGS_ARRAY</span>
                </div>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                  {metadata.tags.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {metadata.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono text-zinc-400 hover:border-[#007acc]/50 hover:text-[#007acc] cursor-pointer transition-colors select-all"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Hashtags Block */}
            {metadata.hashtags && metadata.hashtags.length > 0 && (
              <div className="p-5 border-b border-zinc-800 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[11px] font-bold text-zinc-400 font-mono uppercase">HASHTAGS_SHORTS</span>
                  </div>
                  <span className="text-[10px] bg-emerald-900/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                    {metadata.hashtags.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {metadata.hashtags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-emerald-900/10 border border-emerald-500/20 rounded text-[10px] font-mono text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-900/20 cursor-pointer transition-colors select-all"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Footer */}
            <div className="p-5 bg-zinc-950 mt-auto">
              <div className="flex items-center justify-between mb-3">
                 <span className="text-[10px] font-mono text-zinc-500">DEPLOYMENT</span>
                 <Activity className="w-3 h-3 text-emerald-500" />
              </div>
              <button className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-zinc-900 border border-zinc-200 rounded-md py-2 px-4 transition-all group">
                <span className="text-[11px] font-bold font-mono uppercase tracking-wide">Open YouTube Studio</span>
                <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MetadataStudio;