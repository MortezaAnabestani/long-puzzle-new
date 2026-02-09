import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  PieceShape,
  PieceMaterial,
  MovementType,
  UserPreferences,
  PuzzleBackground,
  ReconstructionGenre,
  MasterVisualStyle,
  TopicSource,
  NarrativeLens,
  ChapterTransition,
  ChapterStatus,
  ProjectStatus,
  GENRE_PRESETS,
  calcChapterCount,
} from "./types";
import { useProductionPipeline } from "./hooks/useProductionPipeline";
import Sidebar from "./components/Sidebar";
import CanvasArea from "./components/CanvasArea";
import CanvasAreaGrid from "./components/CanvasAreaGrid";
import Header from "./components/Header";
import ProductionProgress from "./components/ProductionProgress";
import MetadataStudio from "./components/engagement/MetadataStudio";
import ThumbnailGenerator from "./components/ThumbnailGenerator";
import AudioStatus from "./components/layout/AudioStatus";
import RecordingSystem from "./components/RecordingSystem";
import EngagementCTA from "./components/puzzle/EngagementCTA";
import { MusicTrack } from "./components/sidebar/MusicUploader";
import { playWithFade, pauseWithFade } from "./utils/audioFade";
import { BackendModeProvider } from "./contexts/BackendModeContext";
import { TestModeProvider } from "./contexts/TestModeContext";

// ─── APP ─────────────────────────────────────────────────────────────

const AppContent: React.FC = () => {
  // ─── USER PREFERENCES ──────────────────────────────────────────────
  const [preferences, setPreferences] = useState<UserPreferences>({
    genre: ReconstructionGenre.HISTORICAL_RECONSTRUCTION,
    topic: "",
    topicSource: TopicSource.AI_SUGGESTED,
    narrativeLens: NarrativeLens.ORIGIN_STORY,
    masterVisualStyle: MasterVisualStyle.EPIC_PAINTERLY,
    targetDurationMinutes: 8,
    defaultPieceCount: 500,
    defaultShape: PieceShape.JIGSAW,
    defaultMaterial: PieceMaterial.CARDBOARD,
    defaultMovement: MovementType.STANDARD,
    background: PuzzleBackground.FROSTED_DISCOVERY,
    showDocumentaryTips: true,
  });

  // ─── MUSIC ──────────────────────────────────────────────────────────
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [activeTrackName, setActiveTrackName] = useState<string | null>(null);

  // ─── ENGAGEMENT ─────────────────────────────────────────────────────
  const [engagementGifUrl, setEngagementGifUrl] = useState<string | null>(null);
  const [channelLogoUrl, setChannelLogoUrl] = useState<string | null>(null);

  // ─── CHAPTER INFO OVERLAY ───────────────────────────────────────────
  const [showChapterInfo, setShowChapterInfo] = useState(false);

  // ─── CTA GLOBAL TIMING ──────────────────────────────────────────────
  const [globalElapsedTime, setGlobalElapsedTime] = useState(0);
  const [showMidCTA, setShowMidCTA] = useState(false);
  const [showFinalCTA, setShowFinalCTA] = useState(false);
  const globalTimerRef = useRef<number | null>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);

  // ─── REFS ───────────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicBufferRef = useRef<AudioBuffer | null>(null);
  const canvasHandleRef = useRef<CanvasHandle>(null);
  const completedPuzzleSnapshots = useRef<HTMLImageElement[]>([]);

  // ─── CLOUD TRACK ────────────────────────────────────────────────────
  const handleAddCloudTrack = useCallback(
    (url: string, title: string, source: "backend" | "ai" = "backend") => {
      const newTrack: MusicTrack = {
        id: Math.random().toString(36).substr(2, 9),
        name: title,
        url,
        source,
      };
      setMusicTracks((prev) => [...prev, newTrack]);
      setSelectedTrackId(newTrack.id);
    },
    [],
  );

  // ─── PIPELINE HOOK ──────────────────────────────────────────────────
  const {
    state,
    setState,
    metadata,
    isMetadataLoading,
    setThumbnailDataUrl,
    setLastVideoBlob,
    processPipelineItem,
    toggleAutoMode,
  } = useProductionPipeline(
    preferences,
    setPreferences,
    musicTracks,
    selectedTrackId,
    setActiveTrackName,
    handleAddCloudTrack,
    audioRef,
    musicBufferRef,
  );

  // ─── DERIVED STATE ──────────────────────────────────────────────────
  const currentChapter = state.project?.chapters[state.currentChapterIndex] ?? null;
  const currentImageUrl = currentChapter?.imageUrl ?? null;

  // ─── PRELOAD NEXT CHAPTER ───────────────────────────────────────────
  const nextChapter = state.project?.chapters[state.currentChapterIndex + 1] ?? null;
  useEffect(() => {
    if (nextChapter?.imageUrl) {
      const img = new Image();
      img.src = nextChapter.imageUrl;
      console.log(`📥 [App] Preloading chapter ${state.currentChapterIndex + 2} image`);
    }
  }, [nextChapter?.imageUrl, state.currentChapterIndex]);

  // ─── GLOBAL TIMER ───────────────────────────────────────────────────
  useEffect(() => {
    if (state.isSolving && !state.isTransitioning) {
      const startTime = performance.now();
      const updateTimer = () => {
        setGlobalElapsedTime(performance.now() - startTime);
        globalTimerRef.current = requestAnimationFrame(updateTimer);
      };
      globalTimerRef.current = requestAnimationFrame(updateTimer);
    } else {
      if (globalTimerRef.current) {
        cancelAnimationFrame(globalTimerRef.current);
        globalTimerRef.current = null;
      }
    }
    return () => {
      if (globalTimerRef.current) cancelAnimationFrame(globalTimerRef.current);
    };
  }, [state.isSolving, state.isTransitioning]);

  // ─── CTA TIMING ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.project) return;
    const sec = globalElapsedTime / 1000;

    // ✅ فقط در Single Mode (vertical)، نه Grid Mode
    const isGridMode = state.project.chapters.length === 9;
    if (!isGridMode) {
      setShowMidCTA(sec >= 150 && sec <= 210);
      setShowFinalCTA(sec >= 300 && sec <= 360);
    } else {
      // Grid Mode: بدون mid CTA
      setShowMidCTA(false);
      setShowFinalCTA(false); // final CTA از outro card نمایش داده می‌شود
    }
  }, [globalElapsedTime, state.project]);

  // ─── CHANNEL LOGO ───────────────────────────────────────────────────
  useEffect(() => {
    if (channelLogoUrl) {
      const img = new Image();
      img.src = channelLogoUrl;
      img.onload = () => {
        logoImgRef.current = img;
      };
    } else {
      logoImgRef.current = null;
    }
  }, [channelLogoUrl]);

  // ─── ✅ TRANSITION COMPLETE (کلید اصلی!) ──────────────────────────
  const handleTransitionComplete = useCallback(() => {
    console.log(`🎬 [App] handleTransitionComplete called`);

    setState((s) => {
      if (!s.project) {
        console.warn(`⚠️ [App] No project in handleTransitionComplete`);
        return s;
      }

      const nextIndex = s.currentChapterIndex + 1;

      // ✅ آخرین فصل بود
      if (nextIndex >= s.project.chapters.length) {
        console.log(`🏁 [App] Was last chapter - stopping`);
        if (audioRef.current) pauseWithFade(audioRef.current, { duration: 2000 });
        return {
          ...s,
          isSolving: false,
          isRecording: false,
          isTransitioning: false,
          pipelineStep: "PACKAGING",
          project: {
            ...s.project,
            status: ProjectStatus.COMPLETED,
            chapters: s.project.chapters.map((ch, i) =>
              i === s.currentChapterIndex ? { ...ch, status: ChapterStatus.COMPLETED } : ch,
            ),
          },
        };
      }

      console.log(`✅ [App] Advancing to chapter ${nextIndex + 1}/${s.project.chapters.length}`);

      // ✅ نمایش info overlay برای 2 ثانیه
      setShowChapterInfo(true);
      setTimeout(() => setShowChapterInfo(false), 2000);

      // ✅ پیشروی به فصل بعد
      return {
        ...s,
        currentChapterIndex: nextIndex,
        isTransitioning: false,
        progress: 0,
        isSolving: true,
        project: {
          ...s.project,
          chapters: s.project.chapters.map((ch, i) => {
            if (i === s.currentChapterIndex) return { ...ch, status: ChapterStatus.COMPLETED };
            if (i === nextIndex) return { ...ch, status: ChapterStatus.PLAYING };
            return ch;
          }),
        },
      };
    });
  }, [setState]);

  // ─── ✅ PUZZLE FINISHED ─────────────────────────────────────────────
  const handlePuzzleFinished = useCallback(() => {
    console.log(`🏁 [App] handlePuzzleFinished - chapter ${state.currentChapterIndex + 1}`);

    // Snapshot برای slideshow
    if (
      canvasHandleRef.current &&
      state.project &&
      state.currentChapterIndex < state.project.chapters.length - 1
    ) {
      const canvas = canvasHandleRef.current.getCanvas();
      if (canvas) {
        const snapshot = new Image();
        snapshot.src = canvas.toDataURL("image/png");
        snapshot.onload = () => {
          completedPuzzleSnapshots.current.push(snapshot);
          console.log(`📸 Snapshot ${completedPuzzleSnapshots.current.length} saved`);
        };
      }
    }

    setState((s) => {
      if (!s.project) return s;

      const nextIndex = s.currentChapterIndex + 1;

      // ✅ اگر آخرین فصل بود، فقط return
      if (nextIndex >= s.project.chapters.length) {
        console.log(`🏁 [App] Last chapter - no transition`);
        return s;
      }

      // ✅ شروع transition
      console.log(`🎬 [App] Starting transition for chapter ${nextIndex + 1}`);
      return {
        ...s,
        isTransitioning: true,
      };
    });
  }, [setState, state.project, state.currentChapterIndex]);

  // ─── START/PAUSE ────────────────────────────────────────────────────
  const handleToggleSolve = useCallback(() => {
    setState((s) => {
      if (!s.project) return s;

      const nextSolving = !s.isSolving;

      if (nextSolving) {
        console.log(`▶️ [App] Play - chapter ${s.currentChapterIndex + 1}`);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          playWithFade(audioRef.current, { duration: 2000, targetVolume: 1.0 });
        }
        return {
          ...s,
          isSolving: true,
          isRecording: true,
          progress: 0,
          pipelineStep: "RECORDING",
          project: {
            ...s.project,
            status: ProjectStatus.PLAYING,
            chapters: s.project.chapters.map((ch, i) =>
              i === s.currentChapterIndex ? { ...ch, status: ChapterStatus.PLAYING } : ch,
            ),
          },
        };
      } else {
        console.log(`⏸️ [App] Pause`);
        if (audioRef.current) pauseWithFade(audioRef.current, { duration: 1500 });
        return { ...s, isSolving: false, isRecording: false, pipelineStep: "IDLE" };
      }
    });
  }, [setState]);

  // ─── FULL PACKAGE ───────────────────────────────────────────────────
  const handleToggleFullPackage = useCallback(() => {
    setState((prev) => ({ ...prev, isFullPackage: !prev.isFullPackage }));
  }, [setState]);

  // ─── RENDER ─────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#020205] text-slate-100 overflow-hidden font-['Inter'] relative">
      <audio ref={audioRef} loop crossOrigin="anonymous" style={{ display: "none" }} />

      {/* Production Progress */}
      {state.isAutoMode && state.productionSteps?.length > 0 && (
        <ProductionProgress
          currentVideo={state.currentQueueIdx + 1}
          totalVideos={state.queue.length}
          steps={state.productionSteps}
        />
      )}

      {/* Chapter Progress Bar */}
      {state.project?.status === ProjectStatus.PLAYING && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#0a0a12]">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500"
            style={{
              width: `${
                ((state.currentChapterIndex + state.progress / 100) / state.project.chapters.length) * 100
              }%`,
            }}
          />
        </div>
      )}

      {/* ✅ TRANSITION OVERLAY - نمایش بعد از ترنزیشن */}
      {/* این overlay فقط برای نمایش اطلاعات فصل بعدیه، نه خود ترنزیشن */}
      {showChapterInfo &&
        state.project &&
        (() => {
          const current = state.project.chapters[state.currentChapterIndex];
          if (!current) return null;

          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-none">
              <div className="text-center space-y-4 px-8 animate-slide-up">
                <p className="text-xs uppercase tracking-[0.35em] text-purple-400 font-semibold">
                  فصل {state.currentChapterIndex + 1} از {state.project.chapters.length}
                </p>
                <h2 className="text-3xl font-bold text-white drop-shadow-lg">{current.title}</h2>
                <p className="text-sm text-slate-400 italic max-w-md mx-auto leading-relaxed">
                  {current.narrativeText.substring(0, 90)}…
                </p>
              </div>
            </div>
          );
        })()}

      {/* Recording System */}
      <RecordingSystem
        isRecording={state.isRecording}
        getCanvas={() => canvasHandleRef.current?.getCanvas() || null}
        audioRef={audioRef}
        musicBufferRef={musicBufferRef}
        metadata={metadata}
        durationMinutes={preferences.targetDurationMinutes}
        onRecordingComplete={setLastVideoBlob}
      />

      {/* Sidebar */}
      <aside className="w-[420px] z-40 h-full glass-panel flex flex-col shrink-0">
        <Sidebar
          preferences={preferences}
          setPreferences={setPreferences}
          isGenerating={state.isGenerating}
          isSolving={state.isSolving}
          isAutoMode={state.isAutoMode}
          pipelineStep={state.pipelineStep}
          isFullPackage={state.isFullPackage}
          currentPackageIndex={state.currentQueueIdx}
          packageQueueLength={state.queue.length}
          onToggleFullPackage={handleToggleFullPackage}
          hasImage={!!currentImageUrl}
          onGenerate={() => {
            processPipelineItem({
              genre: preferences.genre,
              topic: preferences.topic,
              narrativeLens: preferences.narrativeLens,
              masterVisualStyle: preferences.masterVisualStyle,
              targetDurationMinutes: preferences.targetDurationMinutes,
            });
          }}
          onAutoMode={toggleAutoMode}
          onToggleSolve={handleToggleSolve}
          musicTracks={musicTracks}
          selectedTrackId={selectedTrackId}
          onAddMusicTracks={(files: FileList) => {
            const newTracks = Array.from(files).map((f: File) => ({
              id: Math.random().toString(36).substr(2, 9),
              name: f.name,
              url: URL.createObjectURL(f),
              source: "manual" as const,
            }));
            setMusicTracks((prev) => [...prev, ...newTracks]);
            if (newTracks.length === 1) setSelectedTrackId(newTracks[0].id);
          }}
          onAddCloudTrack={handleAddCloudTrack}
          onSelectTrack={setSelectedTrackId}
          onRemoveTrack={(id: string) => {
            setMusicTracks((prev) => prev.filter((t) => t.id !== id));
            if (selectedTrackId === id) setSelectedTrackId(null);
          }}
          onGifChange={setEngagementGifUrl}
          onChannelLogoChange={setChannelLogoUrl}
          project={state.project}
          currentChapterIndex={state.currentChapterIndex}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#020205] relative z-10 flex flex-col">
        <Header
          progress={state.progress}
          isColoring={state.isSolving}
          isRecording={state.isRecording}
          error={state.error}
          hasImage={!!currentImageUrl}
          currentChapter={currentChapter}
          totalChapters={state.project?.chapters.length ?? 0}
        />

        {/* Canvas */}
        <section className="h-[85vh] w-full relative bg-black shrink-0">
          {/* ✅ GRID MODE 3×3 */}
          {state.project && state.project.chapters.length === 9 ? (
            <CanvasAreaGrid
              canvasHandleRef={canvasHandleRef}
              chapters={state.project.chapters}
              durationPerChapterSeconds={45}
              isColoring={state.isSolving}
              pieceCount={preferences.defaultPieceCount}
              shape={preferences.defaultShape}
              material={preferences.defaultMaterial}
              movement={preferences.defaultMovement}
              background={preferences.background}
              topicCategory={state.project?.topic}
              channelLogoUrl={channelLogoUrl}
              onProgress={(p) => setState((prev) => ({ ...prev, progress: p }))}
              onFinished={handlePuzzleFinished}
              showDocumentaryTips={preferences.showDocumentaryTips}
              progress={state.progress}
            />
          ) : (
            <CanvasArea
              canvasHandleRef={canvasHandleRef}
              imageUrl={currentImageUrl}
              durationMinutes={currentChapter ? currentChapter.durationSeconds / 60 : 0.75}
              isColoring={state.isSolving}
              pieceCount={currentChapter?.puzzleConfig.pieceCount ?? preferences.defaultPieceCount}
              shape={currentChapter?.puzzleConfig.shape ?? preferences.defaultShape}
              material={currentChapter?.puzzleConfig.material ?? preferences.defaultMaterial}
              movement={currentChapter?.puzzleConfig.movement ?? preferences.defaultMovement}
              background={preferences.background}
              topicCategory={state.project?.topic}
              engagementGifUrl={engagementGifUrl}
              channelLogoUrl={channelLogoUrl}
              onProgress={(p) => setState((prev) => ({ ...prev, progress: p }))}
              onFinished={handlePuzzleFinished}
              onTransitionComplete={handleTransitionComplete}
              onToggleSolve={handleToggleSolve}
              narrativeText={currentChapter?.narrativeText ?? ""}
              showDocumentaryTips={preferences.showDocumentaryTips}
              progress={state.progress}
              isLastChapter={
                state.project ? state.currentChapterIndex === state.project.chapters.length - 1 : false
              }
              isTransitioning={state.isTransitioning}
              completedPuzzleSnapshots={completedPuzzleSnapshots.current}
            />
          )}
        </section>

        {/* Thumbnail + Metadata */}
        <div className="w-full bg-[#050508] border-t border-white/5 pb-32">
          {(currentImageUrl || metadata || isMetadataLoading) && (
            <div className="max-w-7xl mx-auto px-8 py-20 space-y-20">
              <ThumbnailGenerator
                imageUrl={currentImageUrl}
                metadata={metadata}
                isLoading={isMetadataLoading}
                narrativeLens={preferences.narrativeLens}
                onThumbnailReady={setThumbnailDataUrl}
              />
              <MetadataStudio metadata={metadata} isLoading={isMetadataLoading} />
            </div>
          )}
        </div>

        <AudioStatus
          isSolving={state.isSolving}
          musicTrack={activeTrackName || "Standby"}
          hasError={state.audioError}
        />
      </main>

      {/* CTAs */}
      {showMidCTA && <EngagementCTA isVisible={true} variant="mid" channelLogo={logoImgRef.current} />}
      {showFinalCTA && <EngagementCTA isVisible={true} variant="final" channelLogo={logoImgRef.current} />}
    </div>
  );
};

const App: React.FC = () => (
  <TestModeProvider>
    <BackendModeProvider>
      <AppContent />
    </BackendModeProvider>
  </TestModeProvider>
);

export default App;
