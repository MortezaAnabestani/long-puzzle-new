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
  BookOpen,
  Wifi,
  WifiOff,
  Clock,
  Film,
} from "lucide-react";
import {
  UserPreferences,
  ReconstructionGenre,
  MasterVisualStyle,
  NarrativeLens,
  DocumentaryProject,
  ProjectStatus,
  GENRE_PRESETS,
} from "../types";
import { PipelineStep } from "../hooks/useProductionPipeline";
import ComplexityConfig from "./sidebar/ComplexityConfig";
import MusicUploader, { MusicTrack } from "./sidebar/MusicUploader";
import ProductionConsole from "./sidebar/ProductionConsole";
import GifUploader from "./sidebar/GifUploader";
import SnapSoundUploader from "./sidebar/SnapSoundUploader";
import ChannelLogoUploader from "./sidebar/ChannelLogoUploader";
import SmartMusicFinder from "./sidebar/SmartMusicFinder";
import { contentApi } from "../services/api/contentApi";
import TestModeToggle from "./sidebar/TestModeToggle";
import { useTestMode } from "../contexts/TestModeContext";
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
  onGenerate: () => void;
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
  project: DocumentaryProject | null;
  currentChapterIndex: number;
}

const GENRE_ICONS: Record<ReconstructionGenre, string> = {
  [ReconstructionGenre.HISTORICAL_RECONSTRUCTION]: "🏛️",
  [ReconstructionGenre.CRIMINAL_CASEFILE]: "🔍",
  [ReconstructionGenre.LOST_CIVILIZATIONS]: "🗺️",
  [ReconstructionGenre.UNSOLVED_MYSTERIES]: "🌪️",
};

const LENS_LABELS: Record<NarrativeLens, string> = {
  [NarrativeLens.HIDDEN_DISCOVERY]: "کشف پنهان",
  [NarrativeLens.WHY_MYSTERY]: "چرا؟",
  [NarrativeLens.UNSOLVED_ENIGMA]: "معمای حل‌نشده",
  [NarrativeLens.ORIGIN_STORY]: "اصل و ریشه",
  [NarrativeLens.TRANSFORMATION]: "تبدیل",
};

const STYLE_LABELS: Record<MasterVisualStyle, string> = {
  [MasterVisualStyle.CINEMATIC]: "سینمایی",
  [MasterVisualStyle.DARK_DOCUMENTARY]: "نوار تاریک",
  [MasterVisualStyle.VINTAGE]: "قدیمی",
  [MasterVisualStyle.EPIC_PAINTERLY]: "حماسی",
  [MasterVisualStyle.FORENSIC]: "فرانزیک",
  [MasterVisualStyle.ARCHAEOLOGICAL]: "باستان‌شناسی",
};

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
  project,
  currentChapterIndex,
}) => {
  const [dbConnected, setDbConnected] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const isDisabled = isSolving || isAutoMode || isGenerating;
  const { isTestMode, toggleTestMode, setTestProject } = useTestMode();

  useEffect(() => {
    const check = async () => {
      const ok = await contentApi.checkConnection();
      setDbConnected(ok);
      if (!ok) setDbError(contentApi.getConnectionStatus().lastError || "Connection failed");
    };
    check();
    const iv = setInterval(check, 30000);
    return () => clearInterval(iv);
  }, []);

  return (
    <aside className="w-[400px] flex flex-col h-full bg-[#050508] border-r border-white/5 text-slate-300 font-sans z-40 overflow-hidden shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
      {/* ── HEADER ── */}
      <div className="shrink-0 px-4 py-3 bg-zinc-950/50 border-b border-white/5 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Database className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            Documentary_Studio
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-1 h-1 rounded-full ${
              isGenerating || isSolving ? "bg-blue-500 animate-pulse" : "bg-zinc-700"
            }`}
          />
          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
            {isGenerating ? "Generating..." : isSolving ? "Playing" : "Standby"}
          </span>
        </div>
      </div>

      {/* ── DB STATUS ── */}
      <div
        className={`shrink-0 px-4 py-2 border-b border-white/5 flex items-center justify-between ${
          dbConnected ? "bg-emerald-950/20" : "bg-red-950/20"
        }`}
      >
        <div className="flex items-center gap-2">
          {dbConnected ? (
            <Wifi className="w-3 h-3 text-emerald-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
          <span
            className={`text-[9px] font-bold uppercase tracking-wider ${
              dbConnected ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {dbConnected ? "Database Connected" : "Database Offline"}
          </span>
        </div>
        {!dbConnected && dbError && (
          <span className="text-[7px] text-red-500/70 font-mono max-w-[150px] truncate" title={dbError}>
            {dbError}
          </span>
        )}
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 space-y-8">
        <ProductionConsole
          step={pipelineStep}
          isAutoMode={isAutoMode}
          isFullPackage={isFullPackage}
          currentIndex={currentPackageIndex}
          total={packageQueueLength}
          preferences={preferences}
          channelLogoUrl={channelLogoUrl}
          project={project}
          currentChapterIndex={currentChapterIndex}
        />

        {/* ── فصل فعلی — فقط وقتی پروژه داره پخش میشه ── */}
        {project &&
          project.status === ProjectStatus.PLAYING &&
          (() => {
            const ch = project.chapters[currentChapterIndex];
            return ch ? (
              <div className="p-3 bg-blue-900/10 border border-blue-500/15 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Film className="w-3 h-3 text-blue-400" />
                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-wider">
                      فصل فعلی
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-zinc-500">
                    {currentChapterIndex + 1} / {project.chapters.length}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-200">{ch.title}</p>
                <div className="flex gap-1">
                  {project.chapters.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        i < currentChapterIndex
                          ? "bg-blue-500"
                          : i === currentChapterIndex
                          ? "bg-blue-400 animate-pulse"
                          : "bg-zinc-800"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : null;
          })()}

        {/* ── 01: Genre & Topic ── */}
        <section className="space-y-4 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-blue-500/60 mb-2">
            <Sparkles className="w-3 h-3" />
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em]">01_Genre & Topic</h3>
          </div>
          <TestModeToggle
            isTestMode={isTestMode}
            onToggle={toggleTestMode}
            onSelectTestProject={setTestProject}
            disabled={isSolving}
          />
          <div className="space-y-3">
            {/* Auto Pilot */}
            <button
              onClick={onAutoMode}
              disabled={isSolving || isGenerating}
              className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border transition-all text-[10px] font-bold tracking-widest uppercase
                ${
                  isAutoMode
                    ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/20"
                    : "bg-zinc-900/30 border-white/5 text-zinc-500 hover:text-zinc-200 hover:border-zinc-700"
                }`}
            >
              <Cpu className="w-3 h-3" />
              {isAutoMode ? "AI Auto-Pilot: Active" : "Engage Auto-Pilot"}
            </button>

            {/* Documentary Overlays toggle */}
            <div className="flex items-center justify-between p-3 bg-blue-900/5 border border-blue-500/10 rounded-xl">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">
                    Documentary Overlays
                  </span>
                  <span className="text-[8px] text-zinc-500 font-mono tracking-wider">
                    فکت‌های روایت نشون داده میشه
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

            {/* Genre Selector — 2x2 */}
            <div className="grid grid-cols-2 gap-2">
              {(Object.values(ReconstructionGenre) as ReconstructionGenre[]).map((genre) => (
                <button
                  key={genre}
                  onClick={() => setPreferences({ ...preferences, genre })}
                  disabled={isDisabled}
                  className={`text-left p-2.5 rounded-xl border transition-all
                    ${
                      preferences.genre === genre
                        ? "bg-blue-600/15 border-blue-500/40 text-blue-300"
                        : "bg-zinc-900/30 border-white/5 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                    }
                    disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  <span className="text-base">{GENRE_ICONS[genre]}</span>
                  <p className="text-[8px] font-bold uppercase tracking-wider mt-1 leading-tight">
                    {genre.split(" ").slice(0, 2).join(" ")}
                  </p>
                </button>
              ))}
            </div>

            {/* Topic Input — خالی = AI auto */}
            <div className="relative">
              <input
                type="text"
                value={preferences.topic}
                onChange={(e) => setPreferences({ ...preferences, topic: e.target.value })}
                placeholder="موضوع داستان... (یا خالی بذارید AI انتخاب کنه)"
                disabled={isDisabled}
                className="w-full bg-zinc-900/50 border border-white/8 rounded-xl px-3 py-2.5 text-[10px] text-slate-300 placeholder-zinc-600 focus:outline-none focus:border-blue-500/40 disabled:opacity-30"
              />
              {preferences.topic.trim().length === 0 && !isDisabled && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[7px] text-blue-400/60 font-mono">
                  AI AUTO
                </span>
              )}
            </div>

            {/* Suggested Topics — فقط وقتی خالیه */}
            {preferences.topic.trim().length === 0 && (
              <div className="rounded-xl border border-white/5 bg-zinc-900/60 overflow-hidden">
                <p className="text-[7px] text-zinc-500 px-3 pt-2 pb-1 uppercase tracking-wider">پیشنهاد AI</p>
                {GENRE_PRESETS[preferences.genre].suggestedTopics.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setPreferences({ ...preferences, topic: s })}
                    disabled={isDisabled}
                    className="w-full text-left px-3 py-1.5 text-[9px] text-zinc-400 hover:bg-blue-600/10 hover:text-blue-300 transition-colors disabled:opacity-30"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Narrative Lens */}
            <div>
              <p className="text-[8px] text-zinc-500 uppercase tracking-wider mb-1.5 px-0.5">زاوiyه روایت</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.values(NarrativeLens) as NarrativeLens[]).map((lens) => (
                  <button
                    key={lens}
                    onClick={() => setPreferences({ ...preferences, narrativeLens: lens })}
                    disabled={isDisabled}
                    className={`px-2.5 py-1.5 rounded-lg border text-[8px] font-bold transition-all
                      ${
                        preferences.narrativeLens === lens
                          ? "bg-purple-600/15 border-purple-500/40 text-purple-300"
                          : "bg-zinc-900/30 border-white/5 text-zinc-500 hover:border-zinc-600"
                      }
                      disabled:opacity-30`}
                  >
                    {LENS_LABELS[lens]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 02: Visual & Duration ── */}
        <section className="space-y-5 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-amber-500/60 mb-2">
            <Layers className="w-3 h-3" />
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em]">02_Visual & Duration</h3>
          </div>

          {/* Master Visual Style */}
          <div>
            <p className="text-[8px] text-zinc-500 uppercase tracking-wider mb-1.5 px-0.5">
              سبل بصری کل ویدئو
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.values(MasterVisualStyle) as MasterVisualStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => setPreferences({ ...preferences, masterVisualStyle: style })}
                  disabled={isDisabled}
                  className={`px-2.5 py-1.5 rounded-lg border text-[8px] font-bold transition-all
                    ${
                      preferences.masterVisualStyle === style
                        ? "bg-amber-600/15 border-amber-500/40 text-amber-300"
                        : "bg-zinc-900/30 border-white/5 text-zinc-500 hover:border-zinc-600"
                    }
                    disabled:opacity-30`}
                >
                  {STYLE_LABELS[style]}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Selector — 8 | 10 | 12 | 15 */}
          <div>
            <p className="text-[8px] text-zinc-500 uppercase tracking-wider mb-1.5 px-0.5 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" /> طول ویدئو
            </p>
            <div className="flex gap-2">
              {[8, 10, 12, 15].map((d) => (
                <button
                  key={d}
                  onClick={() => setPreferences({ ...preferences, targetDurationMinutes: d })}
                  disabled={isDisabled}
                  className={`flex-1 py-2 rounded-xl border text-[10px] font-black transition-all
                    ${
                      preferences.targetDurationMinutes === d
                        ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                        : "bg-zinc-900/30 border-white/5 text-zinc-500 hover:border-zinc-600"
                    }
                    disabled:opacity-30`}
                >
                  {d}
                  <span className="text-[7px] opacity-60 ml-0.5">دق</span>
                </button>
              ))}
            </div>
          </div>

          {/* Complexity — default values for chapters */}
          <ComplexityConfig
            pieceCount={preferences.defaultPieceCount}
            shape={preferences.defaultShape}
            material={preferences.defaultMaterial}
            movement={preferences.defaultMovement}
            onCountChange={(c) => setPreferences({ ...preferences, defaultPieceCount: c })}
            onShapeChange={(s) => setPreferences({ ...preferences, defaultShape: s })}
            onMaterialChange={(m) => setPreferences({ ...preferences, defaultMaterial: m })}
            onMovementChange={(mv) => setPreferences({ ...preferences, defaultMovement: mv })}
            disabled={isSolving || isAutoMode}
          />
        </section>

        {/* ── 03: Audio & Engagement ── */}
        <section className="space-y-4 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-purple-500/60 mb-2">
            <Music className="w-3 h-3" />
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em]">03_Audio & Engagement</h3>
          </div>

          <div className="space-y-4 p-4 bg-zinc-900/10 rounded-2xl border border-white/5">
            <ChannelLogoUploader
              onLogoSelect={onChannelLogoChange}
              currentUrl={channelLogoUrl}
              disabled={isSolving || isAutoMode}
            />
            <SmartMusicFinder
              currentSubject={preferences.topic}
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

      {/* ── FOOTER ── */}
      <div className="shrink-0 p-4 bg-zinc-950/80 border-t border-white/5 space-y-3 backdrop-blur-xl">
        <button
          onClick={onGenerate}
          disabled={isDisabled}
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all disabled:opacity-20"
        >
          <Settings2 className={`w-4 h-4 text-blue-500 ${isGenerating ? "animate-spin" : ""}`} />
          {isGenerating ? "GENERATING NARRATIVE..." : "BUILD DOCUMENTARY"}
        </button>

        <button
          onClick={onToggleSolve}
          disabled={!hasImage || isGenerating}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.3em] transition-all
            ${
              isSolving
                ? "bg-red-600/10 text-red-500 border border-red-500/30"
                : "bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-900/20 border border-blue-400/30"
            }
            disabled:opacity-20`}
        >
          {isSolving ? (
            <Square className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          {isSolving ? "PAUSE" : "PLAY DOCUMENTARY"}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
