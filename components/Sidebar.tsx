
import React, { useState, useEffect } from "react";
import {
  Settings2,
  Play,
  Square,
  Sparkles,
  Cpu,
  Database,
  Music,
  Layers,
  Eye,
  BookOpen,
  User,
  Wifi,
  WifiOff,
} from "lucide-react";
import { UserPreferences, PieceShape, TopicType, PuzzleBackground } from "../types";
import { PipelineStep } from "../hooks/useProductionPipeline";
import VisionInput from "./sidebar/VisionInput";
import VisualPresets from "./sidebar/VisualPresets";
import ComplexityConfig from "./sidebar/ComplexityConfig";
import MusicUploader, { MusicTrack } from "./sidebar/MusicUploader";
import SpeedSlider from "./SpeedSlider";
import ProductionConsole from "./sidebar/ProductionConsole";
import GifUploader from "./sidebar/GifUploader";
import SnapSoundUploader from "./sidebar/SnapSoundUploader";
import ChannelLogoUploader from "./sidebar/ChannelLogoUploader";
import SmartMusicFinder from "./sidebar/SmartMusicFinder";
import { contentApi } from "../services/api/contentApi";

interface SidebarProps {
  preferences: UserPreferences;
  setPreferences: (p: UserPreferences) => void;
  isGenerating: boolean;
  isSolving: boolean;
  isAutoMode: boolean;
  pipelineStep: PipelineStep;
  isFullPackage: boolean;
  currentPackageIndex: number;
  packageQueueLength: number;
  onToggleFullPackage: () => void;
  hasImage: boolean;
  onGenerate: (isManual: boolean) => void;
  onAutoMode: () => void;
  onToggleSolve: () => void;
  musicTracks: MusicTrack[];
  selectedTrackId: string | null;
  onAddMusicTracks: (files: FileList) => void;
  onAddCloudTrack: (url: string, title: string) => void;
  onSelectTrack: (id: string | null) => void;
  onRemoveTrack: (id: string) => void;
  onGifChange: (url: string | null) => void;
  onChannelLogoChange: (url: string | null) => void;
  channelLogoUrl: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  preferences,
  setPreferences,
  isGenerating,
  isSolving,
  isAutoMode,
  pipelineStep,
  isFullPackage,
  currentPackageIndex,
  packageQueueLength,
  onToggleFullPackage,
  hasImage,
  onGenerate,
  onAutoMode,
  onToggleSolve,
  musicTracks,
  selectedTrackId,
  onAddMusicTracks,
  onAddCloudTrack,
  onSelectTrack,
  onRemoveTrack,
  onGifChange,
  onChannelLogoChange,
  channelLogoUrl,
}) => {
  const [dbConnected, setDbConnected] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Check database connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await contentApi.checkConnection();
      setDbConnected(isConnected);

      if (!isConnected) {
        const status = contentApi.getConnectionStatus();
        setDbError(status.lastError || "Connection failed");
      }
    };

    checkConnection();
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-[400px] flex flex-col h-full bg-[#050508] border-r border-white/5 text-slate-300 font-sans z-40 overflow-hidden shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
      <div className="shrink-0 px-4 py-3 bg-zinc-950/50 border-b border-white/5 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Database className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            Studio_Matrix
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-1 h-1 rounded-full ${
              isGenerating || isSolving ? "bg-blue-500 animate-pulse" : "bg-zinc-700"
            }`}
          />
          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
            {isGenerating ? "Uplink_Active" : "Standby"}
          </span>
        </div>
      </div>

      {/* Database Connection Status */}
      <div className={`shrink-0 px-4 py-2 border-b border-white/5 flex items-center justify-between ${
        dbConnected ? "bg-emerald-950/20" : "bg-red-950/20"
      }`}>
        <div className="flex items-center gap-2">
          {dbConnected ? (
            <Wifi className="w-3 h-3 text-emerald-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
          <span className="text-[9px] font-bold uppercase tracking-wider">
            {dbConnected ? (
              <span className="text-emerald-400">Database Connected</span>
            ) : (
              <span className="text-red-400">Database Offline</span>
            )}
          </span>
        </div>
        {!dbConnected && dbError && (
          <span className="text-[7px] text-red-500/70 font-mono max-w-[150px] truncate" title={dbError}>
            {dbError}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 space-y-8">
        <ProductionConsole
          step={pipelineStep}
          isAutoMode={isAutoMode}
          isFullPackage={isFullPackage}
          currentIndex={currentPackageIndex}
          total={packageQueueLength}
          preferences={preferences}
          channelLogoUrl={channelLogoUrl}
        />

        <section className="space-y-4 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-blue-500/60 mb-2">
            <Sparkles className="w-3 h-3" />
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em]">01_Neural_Input</h3>
          </div>

          <div className="space-y-3">
            <button
              onClick={onAutoMode}
              disabled={isSolving || isGenerating}
              className={`
                        w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border transition-all text-[10px] font-bold tracking-widest uppercase
                        ${
                          isAutoMode
                            ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/20"
                            : "bg-zinc-900/30 border-white/5 text-zinc-500 hover:text-zinc-200 hover:border-zinc-700"
                        }
                    `}
            >
              <Cpu className="w-3 h-3" />
              {isAutoMode ? "AI Auto-Pilot: Active" : "Engage Auto-Pilot"}
            </button>

            <div className="flex items-center justify-between p-3 bg-blue-900/5 border border-blue-500/10 rounded-xl">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">
                    Documentary Mode
                  </span>
                  <span className="text-[8px] text-zinc-500 font-mono tracking-wider">
                    AI Factual Overlays
                  </span>
                </div>
              </div>
              <label className="relative flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.showDocumentaryTips}
                  onChange={() =>
                    setPreferences({ ...preferences, showDocumentaryTips: !preferences.showDocumentaryTips })
                  }
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
              </label>
            </div>

            <VisionInput
              value={preferences.subject}
              onChange={(subject, topicType, topicCategory) =>
                setPreferences({
                  ...preferences,
                  subject,
                  topicType: topicType || preferences.topicType,
                  topicCategory: topicCategory,
                })
              }
              disabled={isSolving || isAutoMode || isGenerating}
            />
          </div>
        </section>

        <section className="space-y-5 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-amber-500/60 mb-2">
            <Layers className="w-3 h-3" />
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em]">02_Engine_Config</h3>
          </div>

          <VisualPresets
            currentStyle={preferences.style}
            onStyleChange={(style) => setPreferences({ ...preferences, style })}
            disabled={isSolving || isAutoMode}
          />

          <ComplexityConfig
            pieceCount={preferences.pieceCount}
            shape={preferences.shape}
            material={preferences.material}
            movement={preferences.movement}
            onCountChange={(pieceCount) => setPreferences({ ...preferences, pieceCount })}
            onShapeChange={(shape) => setPreferences({ ...preferences, shape })}
            onMaterialChange={(material) => setPreferences({ ...preferences, material })}
            onMovementChange={(movement) => setPreferences({ ...preferences, movement })}
            disabled={isSolving || isAutoMode}
          />

          <SpeedSlider
            value={preferences.durationMinutes}
            onChange={(durationMinutes) => setPreferences({ ...preferences, durationMinutes })}
            disabled={isSolving || isAutoMode}
          />
        </section>

        <section className="space-y-4 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-purple-500/60 mb-2">
            <Music className="w-3 h-3" />
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em]">03_Sensory_Link</h3>
          </div>

          <div className="space-y-4 p-4 bg-zinc-900/10 rounded-2xl border border-white/5">
            <ChannelLogoUploader 
              onLogoSelect={onChannelLogoChange} 
              currentUrl={channelLogoUrl}
              disabled={isSolving || isAutoMode} 
            />

            {/* Neural Sonic Finder - قابلیت جدید */}
            <SmartMusicFinder
              currentSubject={preferences.subject}
              onSelectTrack={onAddCloudTrack}
              disabled={isSolving || isAutoMode}
            />

            <MusicUploader
              tracks={musicTracks}
              selectedTrackId={selectedTrackId}
              onAddTracks={onAddMusicTracks}
              onAddCloudTrack={onAddCloudTrack}
              onSelectTrack={onSelectTrack}
              onRemoveTrack={onRemoveTrack}
              disabled={isSolving || isAutoMode}
            />
            <SnapSoundUploader disabled={isSolving || isAutoMode} />
            <GifUploader onGifSelect={onGifChange} disabled={isSolving || isAutoMode} />
          </div>
        </section>
      </div>

      <div className="shrink-0 p-4 bg-zinc-950/80 border-t border-white/5 space-y-3 backdrop-blur-xl">
        <button
          onClick={() => onGenerate(true)}
          disabled={isSolving || isAutoMode || isGenerating}
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all disabled:opacity-20"
        >
          <Settings2 className={`w-4 h-4 text-blue-500 ${isGenerating ? "animate-spin" : ""}`} />
          {isGenerating ? "SYNTHESIZING..." : "INITIALIZE MATRIX"}
        </button>

        <button
          onClick={onToggleSolve}
          disabled={!hasImage || isGenerating}
          className={`
            w-full flex items-center justify-center gap-3 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.3em] transition-all
            ${
              isSolving
                ? "bg-red-600/10 text-red-500 border border-red-500/30"
                : "bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-900/20 border border-blue-400/30"
            }
            disabled:opacity-20
          `}
        >
          {isSolving ? (
            <Square className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          {isSolving ? "TERMINATE SEQ" : "EXECUTE SOLVE"}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
