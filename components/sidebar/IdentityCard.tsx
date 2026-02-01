
import React from 'react';
import { 
  Layers, Clock, Zap, Sparkles, BookOpen, 
  Fingerprint, Target, Hash, Shapes, Box, Binary, Palette, 
  Cpu, Database, ShieldCheck
} from 'lucide-react';
import { UserPreferences, TopicType } from '../../types';

interface IdentityCardProps {
  preferences: UserPreferences;
  channelLogoUrl?: string | null;
}

const IdentityCard: React.FC<IdentityCardProps> = ({ preferences, channelLogoUrl }) => {
  const getTopicConfig = () => {
    switch (preferences.topicType) {
      case TopicType.BREAKING: return { icon: Zap, color: 'text-red-500', label: 'Signal: Breaking News' };
      case TopicType.VIRAL: return { icon: Sparkles, color: 'text-amber-500', label: 'Signal: Viral Trend' };
      case TopicType.NARRATIVE: return { icon: BookOpen, color: 'text-emerald-500', label: 'Signal: Narrative Link' };
      default: return { icon: Fingerprint, color: 'text-zinc-500', label: 'Signal: Manual Seed' };
    }
  };

  const { icon: TopicIcon, color: topicColor, label: topicLabel } = getTopicConfig();

  return (
    <div className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Upper Status Line */}
      <div className="px-4 py-2 bg-gradient-to-r from-blue-600/10 to-transparent border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {channelLogoUrl ? (
            <div className="w-4 h-4 rounded-full overflow-hidden border border-white/20">
              <img src={channelLogoUrl} className="w-full h-full object-cover" alt="Identity" />
            </div>
          ) : (
            <TopicIcon className={`w-3.5 h-3.5 ${topicColor}`} />
          )}
          <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">{topicLabel}</span>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1">
             <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[8px] font-mono text-emerald-500/70">CORE_SYNC</span>
           </div>
           <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter">
             PID_{Math.floor(Math.random() * 9999)}
           </span>
        </div>
      </div>

      {/* Primary Specs Grid */}
      <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-zinc-500">
            <Palette className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Art Direction</span>
          </div>
          <span className="text-[11px] font-bold text-zinc-200 truncate pr-2">{preferences.style}</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-zinc-500">
            <Layers className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Grid Density</span>
          </div>
          <span className="text-[11px] font-bold text-zinc-200">{preferences.pieceCount} Nodes</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-zinc-500">
            <Shapes className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Geometry</span>
          </div>
          <span className="text-[11px] font-bold text-zinc-200">{preferences.shape}</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-zinc-500">
            <Box className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Tactile Layer</span>
          </div>
          <span className="text-[11px] font-bold text-zinc-200">{preferences.material}</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-zinc-500">
            <Zap className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Kinetic Model</span>
          </div>
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-tighter">{preferences.movement}</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-zinc-500">
            <Clock className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Time Profile</span>
          </div>
          <span className="text-[11px] font-mono font-bold text-amber-500">{preferences.durationMinutes.toFixed(1)}m / {Math.round(preferences.durationMinutes * 60)}s</span>
        </div>
      </div>

      {/* Narrative Context */}
      <div className="px-4 py-4 bg-black/40 border-t border-white/5">
        <div className="flex items-center gap-2 text-zinc-500 mb-2.5">
          <Target className="w-3 h-3" />
          <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Semantic Narrative Anchor</span>
        </div>
        <div className="relative p-3.5 rounded-xl bg-white/5 border border-white/5 shadow-inner">
            <p className="text-[11px] text-zinc-300 leading-relaxed italic font-serif">
              "{preferences.subject}"
            </p>
        </div>
      </div>
      
      {/* Features Bar */}
      <div className="px-4 py-2.5 bg-zinc-950 flex items-center gap-6 border-t border-white/5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
             <ShieldCheck className="w-3 h-3 text-blue-500" />
             <span className="text-[8px] font-mono text-zinc-500">SYNC_ENABLED</span>
          </div>
          <div className={`flex items-center gap-2 shrink-0 ${preferences.showDocumentaryTips ? 'text-emerald-500' : 'text-zinc-700'}`}>
             <Database className="w-3 h-3" />
             <span className="text-[8px] font-mono">FACT_ENGINE</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
             <Cpu className="w-3 h-3 text-purple-500" />
             <span className="text-[8px] font-mono text-zinc-500">KINETIC_V4</span>
          </div>
      </div>
    </div>
  );
};

export default IdentityCard;
