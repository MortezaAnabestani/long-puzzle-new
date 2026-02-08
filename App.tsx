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

// ─── TRANSITION DURATIONS (ms) ──────────────────────────────────────

const TRANSITION_DURATIONS: Record<ChapterTransition, number> = {
  [ChapterTransition.FADE_TEXT]: 2500,
  [ChapterTransition.PARTICLE_DISSOLVE]: 3000,
  [ChapterTransition.TIMELINE_PULSE]: 2000,
};

// ─── APP ─────────────────────────────────────────────────────────────

const AppContent: React.FC = () => {
  // ─── USER PREFERENCES — فقط long-form فیلدها ──────────────────────
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

  // ─── 🔥 CTA GLOBAL TIMING ───────────────────────────────────────────
  const [globalElapsedTime, setGlobalElapsedTime] = useState(0);
  const [showMidCTA, setShowMidCTA] = useState(false);
  const [showFinalCTA, setShowFinalCTA] = useState(false);
  const globalTimerRef = useRef<number | null>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);

  // ─── REFS ───────────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicBufferRef = useRef<AudioBuffer | null>(null);
  const canvasHandleRef = useRef<CanvasHandle>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedPuzzleSnapshots = useRef<HTMLImageElement[]>([]); // 🔥 اسلایدشو

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
    []
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
    musicBufferRef
  );

  // ─── DERIVED: فصل فعلی و imageUrl ───────────────────────────────────
  const currentChapter = state.project?.chapters[state.currentChapterIndex] ?? null;
  const currentImageUrl = currentChapter?.imageUrl ?? null;

  // ─── 🔥 PHASE 1: PRELOAD NEXT CHAPTER IMAGE ─────────────────────────
  const nextChapter = state.project?.chapters[state.currentChapterIndex + 1] ?? null;
  const nextImageUrl = nextChapter?.imageUrl ?? null;

  useEffect(() => {
    if (nextImageUrl) {
      // Preload next chapter image in background
      const preloadImg = new Image();
      preloadImg.src = nextImageUrl;
    }
  }, [nextImageUrl]);

  // ─── 🔥 GLOBAL TIMER FOR CTA ────────────────────────────────────────
  useEffect(() => {
    if (state.isSolving && !state.isTransitioning) {
      const startTime = performance.now();

      const updateTimer = () => {
        const elapsed = performance.now() - startTime;
        setGlobalElapsedTime(elapsed);
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
      if (globalTimerRef.current) {
        cancelAnimationFrame(globalTimerRef.current);
      }
    };
  }, [state.isSolving, state.isTransitioning]);

  // ─── 🔥 CTA TIMING LOGIC ────────────────────────────────────────────
  useEffect(() => {
    if (!state.project) return;

    const elapsedSeconds = globalElapsedTime / 1000;

    // Mid-CTA: 2:30 - 3:30 (150-210 seconds)
    const showMid = elapsedSeconds >= 150 && elapsedSeconds <= 210;
    setShowMidCTA(showMid);

    // Final-CTA: 5:00 - 6:00 (300-360 seconds)
    const showFinal = elapsedSeconds >= 300 && elapsedSeconds <= 360;
    setShowFinalCTA(showFinal);
  }, [globalElapsedTime, state.project]);

  // ─── 🔥 CHANNEL LOGO LOADER ─────────────────────────────────────────
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

  // ─── CHAPTER ADVANCE ────────────────────────────────────────────────
  /**
   * یک فصل تموم شده.
   * اگه فصل بعدی هست → transition → فصل بعدی شروع شه
   * اگه آخرین فصل بود → pause صدا → پایان
   */
  const advanceToNextChapter = useCallback(() => {
    setState((s) => {
      if (!s.project) return s;

      const chapters = s.project.chapters;
      const nextIndex = s.currentChapterIndex + 1;

      // ─── آخرین فصل بود → تموم ───────────────────────────────────
      if (nextIndex >= chapters.length) {
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
            chapters: chapters.map((ch, i) =>
              i === s.currentChapterIndex ? { ...ch, status: ChapterStatus.COMPLETED } : ch
            ),
          },
        };
      }

      // ─── فصل بعدی هست → transition شروع شه ─────────────────────
      const transitionType = chapters[s.currentChapterIndex].transition;

      // فصل فعلی = COMPLETED
      const updatedChapters = chapters.map((ch, i) =>
        i === s.currentChapterIndex ? { ...ch, status: ChapterStatus.COMPLETED } : ch
      );

      // بعد از delay، فصل بعدی شروع شه
      transitionTimerRef.current = setTimeout(() => {
        setState((inner) => {
          if (!inner.project) return inner;
          const nxt = inner.currentChapterIndex + 1;

          return {
            ...inner,
            currentChapterIndex: nxt,
            isTransitioning: false,
            progress: 0,
            isSolving: true,
            project: {
              ...inner.project,
              chapters: inner.project.chapters.map((ch, i) =>
                i === nxt ? { ...ch, status: ChapterStatus.PLAYING } : ch
              ),
            },
          };
        });
      }, TRANSITION_DURATIONS[transitionType]);

      return {
        ...s,
        isTransitioning: true,
        project: { ...s.project, chapters: updatedChapters },
      };
    });
  }, [setState]);

  // ─── PUZZLE FINISHED (فصل فعلی تموم شد) ────────────────────────────
  const handlePuzzleFinished = useCallback(() => {
    // 🔥 ذخیره snapshot برای اسلایدشو (فقط فصل‌های میانی)
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
          console.log(`📸 Snapshot saved: ${completedPuzzleSnapshots.current.length} total`);
        };
      }
    }

    advanceToNextChapter();
  }, [advanceToNextChapter, state.project, state.currentChapterIndex]);

  // ─── START / PAUSE ──────────────────────────────────────────────────
  const handleToggleSolve = useCallback(() => {
    setState((s) => {
      if (!s.project) return s;

      const nextSolving = !s.isSolving;

      if (nextSolving) {
        // ─── شروع پخش ─────────────────────────────────────────────
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          playWithFade(audioRef.current, { duration: 2000, targetVolume: 1.0 });
        }
        return {
          ...s,
          isSolving: true,
          isRecording: true,
          currentChapterIndex: s.currentChapterIndex,
          progress: 0,
          pipelineStep: "RECORDING",
          project: {
            ...s.project,
            status: ProjectStatus.PLAYING,
            chapters: s.project.chapters.map((ch, i) =>
              i === s.currentChapterIndex ? { ...ch, status: ChapterStatus.PLAYING } : ch
            ),
          },
        };
      } else {
        // ─── pause ─────────────────────────────────────────────────
        if (audioRef.current) pauseWithFade(audioRef.current, { duration: 1500 });
        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
        return { ...s, isSolving: false, isRecording: false, pipelineStep: "IDLE" };
      }
    });
  }, [setState]);

  // ─── FULL PACKAGE TOGGLE ────────────────────────────────────────────
  const handleToggleFullPackage = useCallback(() => {
    setState((prev) => ({ ...prev, isFullPackage: !prev.isFullPackage }));
  }, [setState]);

  // ─── CLEANUP ────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  // ─── RENDER ─────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#020205] text-slate-100 overflow-hidden font-['Inter'] relative">
      <audio ref={audioRef} loop crossOrigin="anonymous" style={{ display: "none" }} />

      {/* ── Auto-mode production progress ────────────────────────── */}
      {state.isAutoMode && state.productionSteps?.length > 0 && (
        <ProductionProgress
          currentVideo={state.currentQueueIdx + 1}
          totalVideos={state.queue.length}
          steps={state.productionSteps}
        />
      )}

      {/* ── CHAPTER PROGRESS BAR (فوق صفحه) ──────────────────────── */}
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

      {/* ── CHAPTER TRANSITION OVERLAY ───────────────────────────── */}
      {state.isTransitioning &&
        state.project &&
        (() => {
          const nextIdx = state.currentChapterIndex + 1;
          const next = state.project.chapters[nextIdx];
          if (!next) return null;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
              <div className="text-center space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-purple-400 font-semibold">
                  فصل {nextIdx + 1} از {state.project.chapters.length}
                </p>
                <h2 className="text-3xl font-bold text-white drop-shadow-lg">{next.title}</h2>
                <p className="text-sm text-slate-400 italic max-w-md mx-auto leading-relaxed">
                  {next.narrativeText.substring(0, 90)}…
                </p>
              </div>
            </div>
          );
        })()}

      {/* ── RECORDING SYSTEM ──────────────────────────────────────── */}
      <RecordingSystem
        isRecording={state.isRecording}
        getCanvas={() => canvasHandleRef.current?.getCanvas() || null}
        audioRef={audioRef}
        musicBufferRef={musicBufferRef}
        metadata={metadata}
        durationMinutes={preferences.targetDurationMinutes}
        onRecordingComplete={setLastVideoBlob}
      />

      {/* ── SIDEBAR ───────────────────────────────────────────────── */}
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
          // ── long-form props ─────────────────────────────────────
          project={state.project}
          currentChapterIndex={state.currentChapterIndex}
        />
      </aside>

      {/* ── MAIN ──────────────────────────────────────────────────── */}
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

        {/* ── CANVAS (پازل فصل فعلی) ─────────────────────────────── */}
        <section className="h-[85vh] w-full relative bg-black shrink-0">
          <CanvasArea
            canvasHandleRef={canvasHandleRef}
            imageUrl={currentImageUrl}
            durationMinutes={currentChapter ? currentChapter.durationSeconds / 60 : 0.75}
            isColoring={state.isSolving && !state.isTransitioning}
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
            onToggleSolve={handleToggleSolve}
            narrativeText={currentChapter?.narrativeText ?? ""}
            showDocumentaryTips={preferences.showDocumentaryTips}
            progress={state.progress}
            isLastChapter={
              state.project ? state.currentChapterIndex === state.project.chapters.length - 1 : false
            }
            completedPuzzleSnapshots={completedPuzzleSnapshots.current}
          />
        </section>

        {/* ── BOTTOM: THUMBNAIL + METADATA ─────────────────────────── */}
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

      {/* ── 🔥 GLOBAL CTAs ────────────────────────────────────────── */}
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
