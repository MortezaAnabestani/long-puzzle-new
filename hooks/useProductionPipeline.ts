/**
 * Documentary Puzzle Studio — Production Pipeline Hook
 *
 * فکشن اصلی: processPipelineItem
 *   SCAN → NARRATIVE → IMAGES (batch) → MUSIC → METADATA → READY
 *
 * موندنی از قبل:
 *   selectSmartMusic, fetchAudioBlob, decodeAndStoreMusicBuffer,
 *   executePackaging, downloadFile, updateProductionStep
 *
 * حذف شده:
 *   VIRAL loop, BREAKING loop, similarity check, randomizeVisualParameters,
 *   generateArtImage, YouTubeMetadata, TopicType, MusicSelectionMode,
 *   VIRAL_CATEGORIES, selectFreshCategory, addTopicVariation, getTrendingTopics
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  PieceShape,
  PieceMaterial,
  MovementType,
  UserPreferences,
  ReconstructionGenre,
  MasterVisualStyle,
  NarrativeLens,
  DocumentaryProject,
  ProjectStatus,
  ChapterStatus,
  StoryArc,
  MusicMood,
  Chapter,
  calcChapterCount,
  assignChapterRoles,
  getChapterComplexity,
  getChapterTransition,
  getPieceCountForComplexity,
} from "../types";
import { generateDocumentaryNarrative, detectMusicMoodFromTopic } from "../services/ai/narrativeEngine";
import { generateChapterImages } from "../services/ai/artGeneration";
import { BatchProgressEvent, DocumentaryMetadata, ChapterMarker } from "../services/types/serviceTypes";
import { MusicTrack } from "../components/sidebar/MusicUploader";
import { contentApi, ContentPayload } from "../services/api/contentApi";
import { sonicEngine } from "../services/proceduralAudio";
import { getJalaliDate } from "../utils/dateUtils";
import { getFolderFromMood } from "../services/ai/musicSelection";

// ─── TYPES ────────────────────────────────────────────────────────────

export type PipelineStep =
  | "IDLE"
  | "SCAN"
  | "NARRATIVE"
  | "IMAGES"
  | "MUSIC"
  | "METADATA"
  | "READY"
  | "RECORDING"
  | "PACKAGING";

export interface ProductionStep {
  id: string;
  label: string;
  status: "pending" | "in_progress" | "completed" | "error";
  details?: string;
}

/** قیتم صورت‌صورت auto-pilot یا دستی */
export interface DocumentaryQueueItem {
  genre: ReconstructionGenre;
  topic: string; // خالی → AI موضوع میده
  narrativeLens: NarrativeLens;
  masterVisualStyle: MasterVisualStyle;
  targetDurationMinutes: number; // 8 | 10 | 12 | 15
}

export interface PipelineState {
  project: DocumentaryProject | null;
  currentChapterIndex: number;
  isGenerating: boolean;
  isSolving: boolean;
  isRecording: boolean;
  progress: number;
  error: string | null;
  audioError: boolean;
  isAutoMode: boolean;
  isFullPackage: boolean;
  queue: DocumentaryQueueItem[];
  currentQueueIdx: number;
  pipelineStep: PipelineStep;
  productionSteps: ProductionStep[];
  storyArc: StoryArc | null;
  docSnippets: string[]; // keyFacts از narrative
  lastVideoBlob: Blob | null;
  thumbnailDataUrl: string | null;
}

// ─── CLOUDFLARE PROXY ─────────────────────────────────────────────────

const CLOUDFLARE_WORKER_URL = "https://plain-tooth-75c3.jujube-bros.workers.dev/";

// ─── AUDIO HELPERS (موندنی، دست‌نخورده) ─────────────────────────────

const decodeAndStoreMusicBuffer = async (
  audioRef: React.RefObject<HTMLAudioElement | null>,
  musicBufferRef: React.MutableRefObject<AudioBuffer | null>,
  blobOrNull?: Blob | null
): Promise<void> => {
  const ctx = sonicEngine.getContext();
  if (!ctx) {
    console.warn("⚠️ [MUSIC] No AudioContext for decode");
    return;
  }

  let arrayBuffer: ArrayBuffer;
  if (blobOrNull && blobOrNull.size > 0 && !blobOrNull.type.startsWith("text/")) {
    try {
      arrayBuffer = await blobOrNull.arrayBuffer();
    } catch (e) {
      console.warn("⚠️ [MUSIC] Blob.arrayBuffer() failed:", e);
      return;
    }
  } else {
    const el = audioRef.current;
    const url = el?.src || el?.currentSrc;
    if (!url || url === "" || url === "about:blank") return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fetch ${res.status}`);
      const blob = await res.blob();
      if (blob.size === 0 || blob.type.startsWith("text/")) {
        console.warn(`⚠️ [MUSIC] Fetched response is not audio (size=${blob.size}, type=${blob.type})`);
        return;
      }
      arrayBuffer = await blob.arrayBuffer();
    } catch (e) {
      console.warn("⚠️ [MUSIC] Fetch for decode failed:", e);
      return;
    }
  }

  try {
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    musicBufferRef.current = decoded;
    console.log(`🎵 [MUSIC] Decoded to AudioBuffer (${(decoded.length / decoded.sampleRate).toFixed(1)}s)`);
  } catch (e) {
    console.warn("⚠️ [MUSIC] Decode failed (keeping previous buffer):", e);
  }
};

// ─── SMART MUSIC (موندنی، فقط MusicSelectionMode حذف شد — backend+AI fallback) ─

interface SmartMusicParams {
  musicTracks: MusicTrack[];
  mood: MusicMood;
  topic: string;
  fetchAudioBlob: (url: string) => Promise<{ url: string; blob: Blob } | null>;
  onAddCloudTrack: (url: string, title: string, source?: "backend" | "ai") => void;
  setActiveTrackName: (name: string | null) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const selectSmartMusic = async (
  params: SmartMusicParams
): Promise<{ source: string; title: string; blob?: Blob } | null> => {
  const { musicTracks, mood, topic, fetchAudioBlob, onAddCloudTrack, setActiveTrackName, audioRef } = params;

  // Priority 1: دستی
  const manual = musicTracks.filter((t) => t.source === "manual");
  if (manual.length > 0) {
    const track = manual[0];
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.load();
    }
    setActiveTrackName(track.name);
    console.log(`🎵 [MUSIC] Manual: ${track.name}`);
    return { source: "Manual Upload", title: track.name };
  }

  // Priority 2: Backend database
  let trackData: { title: string; url: string; source: string } | null = null;
  try {
    const { assetApi } = await import("../services/api/assetApi");
    const folderName = getFolderFromMood(mood);
    console.log(`🎵 [MUSIC] Backend search: folder=${folderName}`);
    const backendUrl = await assetApi.getRandomMusicByMood(folderName);
    if (backendUrl) trackData = { title: `${mood} (Database)`, url: backendUrl, source: "Backend Database" };

    if (!trackData) {
      const fallback = await assetApi.getRandomMusicByMood("calm");
      if (fallback) trackData = { title: "Calm (Fallback)", url: fallback, source: "Backend Database" };
    }
  } catch (e) {
    console.warn("⚠️ [MUSIC] Backend search failed:", e);
  }

  // Priority 3: AI search
  if (!trackData) {
    try {
      const { findSmartMusicByMood } = await import("../services/geminiService");
      trackData = await findSmartMusicByMood(mood, topic);
    } catch (e) {
      console.warn("⚠️ [MUSIC] AI search failed:", e);
    }
  }

  if (trackData?.url) {
    const result = await fetchAudioBlob(trackData.url);
    if (result) {
      const sourceType = trackData.source === "Backend Database" ? "backend" : "ai";
      onAddCloudTrack(result.url, trackData.title, sourceType);
      setActiveTrackName(trackData.title);
      if (audioRef.current) {
        audioRef.current.src = result.url;
        audioRef.current.load();
      }
      console.log(`🎵 [MUSIC] Selected: ${trackData.title}`);
      return { source: trackData.source, title: trackData.title, blob: result.blob };
    }
  }

  console.warn("⚠️ [MUSIC] No music found");
  return null;
};

// ─── CHAPTER MARKERS ──────────────────────────────────────────────────

const buildChapterMarkers = (chapters: Chapter[]): ChapterMarker[] => {
  let totalSeconds = 0;
  return chapters.map((ch) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const timestamp = `${mins}:${secs.toString().padStart(2, "0")}`;
    totalSeconds += ch.durationSeconds;
    return { timestamp, title: ch.title };
  });
};

// ─── METADATA BUILDER ─────────────────────────────────────────────────

const buildDocumentaryMetadata = (project: DocumentaryProject): DocumentaryMetadata => {
  const markers = buildChapterMarkers(project.chapters);
  const chapterList = project.chapters.map((ch, i) => `فصل ${i + 1}: ${ch.title}`).join("\n");

  return {
    title: `🔍 ${project.topic} — ${project.genre} Documentary`,
    description: `یک documentary ${project.targetDurationMinutes}-دقیقه‌ای درباره ${project.topic}\n\n${chapterList}\n\nAuto-generated by Documentary Puzzle Studio`,
    tags: [project.genre, project.topic, "documentary", "puzzle", "history", "mystery", "longform"],
    hashtags: ["#documentary", "#puzzle", "#mystery", "#longform", "#history"],
    ctr_strategy: `عنوان شوک‌دهنده + فصل‌بندی واضح + chapter markers`,
    chapterMarkers: markers,
  };
};

// ─── HOOK ─────────────────────────────────────────────────────────────

export const useProductionPipeline = (
  preferences: UserPreferences,
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>,
  musicTracks: MusicTrack[],
  selectedTrackId: string | null,
  setActiveTrackName: (name: string | null) => void,
  onAddCloudTrack: (url: string, title: string, source?: "backend" | "ai") => void,
  audioRef: React.RefObject<HTMLAudioElement | null>,
  musicBufferRef: React.MutableRefObject<AudioBuffer | null>
) => {
  const [state, setState] = useState<PipelineState>({
    project: null,
    currentChapterIndex: 0,
    isGenerating: false,
    isSolving: false,
    isRecording: false,
    progress: 0,
    error: null,
    audioError: false,
    isAutoMode: false,
    isFullPackage: false,
    queue: [],
    currentQueueIdx: -1,
    pipelineStep: "IDLE",
    productionSteps: [],
    storyArc: null,
    docSnippets: [],
    lastVideoBlob: null,
    thumbnailDataUrl: null,
  });

  const [metadata, setMetadata] = useState<DocumentaryMetadata | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const isExportingRef = useRef(false);

  // ─── STEP HELPERS ───────────────────────────────────────────────

  const updateProductionStep = useCallback(
    (stepId: string, status: ProductionStep["status"], details?: string) => {
      setState((prev) => {
        const idx = prev.productionSteps.findIndex((s) => s.id === stepId);
        if (idx >= 0) {
          const steps = [...prev.productionSteps];
          steps[idx] = { ...steps[idx], status, details: details || steps[idx].details };
          return { ...prev, productionSteps: steps };
        }
        return {
          ...prev,
          productionSteps: [...prev.productionSteps, { id: stepId, label: stepId, status, details }],
        };
      });
    },
    []
  );

  const initProductionSteps = useCallback(() => {
    setState((prev) => ({
      ...prev,
      productionSteps: [
        { id: "📊 SCAN", label: "شروع پروژه", status: "pending" },
        { id: "📖 NARRATIVE", label: "تولید روایت فصل‌ها", status: "pending" },
        { id: "🖼️ IMAGES", label: "تولید تصاویر batch", status: "pending" },
        { id: "🎵 MUSIC", label: "انتخاب موسیقی", status: "pending" },
        { id: "📝 METADATA", label: "متادیتا و فصل‌بندی", status: "pending" },
        { id: "🎬 READY", label: "آماده پخش", status: "pending" },
        { id: "🎥 RECORD", label: "ضبط ویدئو", status: "pending" },
        { id: "📦 PACKAGE", label: "دانلود و ذخیره", status: "pending" },
      ],
    }));
  }, []);

  // ─── FETCH AUDIO BLOB (موندنی) ────────────────────────────────

  const fetchAudioBlob = useCallback(async (url: string): Promise<{ url: string; blob: Blob } | null> => {
    const proxies = [
      `${CLOUDFLARE_WORKER_URL}?url=${encodeURIComponent(url)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    ];
    for (const p of proxies) {
      try {
        const res = await fetch(p);
        if (res.ok) {
          let blob = await res.blob();
          if (!blob.type || blob.type === "application/octet-stream")
            blob = new Blob([blob], { type: "audio/mpeg" });
          console.log(`✅ [fetchAudioBlob] size=${(blob.size / 1024).toFixed(1)}KB`);
          return { url: URL.createObjectURL(blob), blob };
        }
      } catch {
        /* next */
      }
    }
    console.error("❌ [fetchAudioBlob] All proxies failed");
    return null;
  }, []);

  // ─── DOWNLOAD ─────────────────────────────────────────────────

  const downloadFile = (name: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  // ─── PACKAGING (موندنی، metadata شکلش عوض شد) ─────────────────

  const executePackaging = useCallback(
    async (videoBlob: Blob) => {
      if (isExportingRef.current) return;
      isExportingRef.current = true;

      const jalali = getJalaliDate();
      const cleanTitle = (metadata?.title || "Documentary").replace(/[\\/:*?"<>|]/g, "").slice(0, 50);
      const base = `${jalali}_${cleanTitle}`;

      updateProductionStep("📦 PACKAGE", "in_progress", "دانلود شروع شد...");

      try {
        // ── ویدئو ──
        downloadFile(`${base}_Video.${videoBlob.type.includes("mp4") ? "mp4" : "webm"}`, videoBlob);

        // ── metadata (شامل chapter markers) ──
        if (metadata) {
          await new Promise((r) => setTimeout(r, 1500));
          const markerText = metadata.chapterMarkers.map((m) => `${m.timestamp} - ${m.title}`).join("\n");
          downloadFile(
            `${base}_Metadata.txt`,
            new Blob(
              [
                `TITLE: ${metadata.title}\n\nDESC:\n${
                  metadata.description
                }\n\nCHAPTER MARKERS:\n${markerText}\n\nTAGS: ${metadata.tags.join(
                  ", "
                )}\n\nHASHTAGS: ${metadata.hashtags.join(" ")}`,
              ],
              { type: "text/plain" }
            )
          );
        }

        // ── تامبنیل ──
        if (state.thumbnailDataUrl) {
          await new Promise((r) => setTimeout(r, 1500));
          const res = await fetch(state.thumbnailDataUrl);
          downloadFile(`${base}_Thumbnail.jpg`, await res.blob());
        }

        // ── ذخیره دیتابیس ──
        if (metadata && state.project && state.storyArc) {
          try {
            const payload: ContentPayload = {
              jalaliDate: jalali,
              puzzleCard: {
                source: "DOCUMENTARY",
                category: state.project.genre,
                narrativeLens: state.project.narrativeLens,
                duration: state.project.targetDurationMinutes,
              },
              story: {
                coreSubject: state.project.topic,
                hook: state.storyArc.hook,
                buildup: state.storyArc.buildup,
                climax: state.storyArc.climax,
                reveal: state.storyArc.reveal,
                conclusion: state.storyArc.conclusion,
              },
              metadata: {
                title: metadata.title,
                description: metadata.description,
                tags: metadata.tags,
                hashtags: metadata.hashtags,
              },
              files: {
                videoFilename: `${base}_Video.${videoBlob.type.includes("mp4") ? "mp4" : "webm"}`,
                videoSizeMB: Number((videoBlob.size / 1024 / 1024).toFixed(2)),
              },
            };
            const result = await contentApi.saveContent(payload);
            if (result.success) {
              console.log(`✅ [DB] Saved — ID: ${result.data?._id}`);
              updateProductionStep(
                "📦 PACKAGE",
                "completed",
                `ذخیره شد — ID: ${result.data?._id?.substring(0, 8)}...`
              );
            } else {
              updateProductionStep("📦 PACKAGE", "completed", "دانلود انجام شد — خطا در ذخیره DB");
            }
          } catch {
            updateProductionStep("📦 PACKAGE", "completed", "دانلود انجام شد — DB skip");
          }
        } else {
          updateProductionStep("📦 PACKAGE", "completed", "دانلود انجام شد");
        }
      } finally {
        setState((prev) => ({ ...prev, lastVideoBlob: null }));
        isExportingRef.current = false;

        // ── queue بعدیه؟ ──
        setTimeout(() => {
          setState((prev) => {
            const nextIdx = prev.currentQueueIdx + 1;
            const hasNext = prev.isFullPackage && nextIdx < prev.queue.length;
            if (hasNext)
              console.log(
                `\n➡️  [AutoPilot] Moving to next documentary (${nextIdx + 1}/${prev.queue.length})\n`
              );
            else console.log(`\n🏁 [AutoPilot] All documentaries completed!\n`);
            return {
              ...prev,
              currentQueueIdx: hasNext ? nextIdx : -1,
              pipelineStep: "IDLE",
              isAutoMode: hasNext,
              isFullPackage: hasNext,
              isSolving: false,
              isRecording: false,
              progress: 0,
              project: hasNext ? null : prev.project,
            };
          });
        }, 2500);
      }
    },
    [metadata, state.thumbnailDataUrl, state.project, state.storyArc, updateProductionStep]
  );

  // packaging trigger
  useEffect(() => {
    if (state.pipelineStep === "PACKAGING" && state.lastVideoBlob && !isExportingRef.current) {
      executePackaging(state.lastVideoBlob);
    }
  }, [state.pipelineStep, state.lastVideoBlob, executePackaging]);

  // ─── MAIN PIPELINE ──────────────────────────────────────────────

  const processPipelineItem = useCallback(
    async (item: DocumentaryQueueItem) => {
      initProductionSteps();
      setState((s) => ({
        ...s,
        pipelineStep: "SCAN",
        isGenerating: true,
        error: null,
        progress: 0,
        project: null,
        storyArc: null,
        currentChapterIndex: 0,
      }));
      setMetadata(null);

      try {
        // ─── STEP 1: SCAN ───────────────────────────────────────
        const chapterCount = calcChapterCount(item.targetDurationMinutes);
        console.log(
          `📊 [SCAN] Genre: ${item.genre}, Topic: "${item.topic}", Chapters: ${chapterCount}, Duration: ${item.targetDurationMinutes}min`
        );
        updateProductionStep(
          "📊 SCAN",
          "completed",
          `${item.genre} — ${chapterCount} فصل — ${item.targetDurationMinutes} دق`
        );

        // ─── STEP 2: NARRATIVE ──────────────────────────────────
        setState((s) => ({ ...s, pipelineStep: "NARRATIVE" }));
        updateProductionStep("📖 NARRATIVE", "in_progress", "AI داره روایت میسازه...");

        const narrativeResponse = await generateDocumentaryNarrative(
          item.genre,
          item.topic,
          item.narrativeLens,
          item.targetDurationMinutes,
          item.masterVisualStyle
        );

        console.log(
          `📖 [NARRATIVE] Generated ${narrativeResponse.chapters.length} chapters — topic: "${narrativeResponse.topic}"`
        );
        updateProductionStep(
          "📖 NARRATIVE",
          "completed",
          `${narrativeResponse.chapters.length} فصل تولید شد`
        );

        // ─── فصل‌ها رو Chapter objects بسازیم ────────────────────
        const roles = assignChapterRoles(narrativeResponse.chapters.length);

        const chapters: Chapter[] = narrativeResponse.chapters.map((nc, i) => {
          const role = roles[i];
          const complexity = getChapterComplexity(role);
          const pieceCount = getPieceCountForComplexity(complexity, preferences.defaultPieceCount);

          return {
            id: `ch_${Date.now()}_${i}`,
            index: i,
            role,
            title: nc.title,
            narrativeText: nc.narrativeText,
            imagePrompt: nc.imagePrompt,
            imageUrl: null,
            puzzleConfig: nc.puzzleConfig || {
              pieceCount,
              shape: preferences.defaultShape,
              material: preferences.defaultMaterial,
              movement: preferences.defaultMovement,
              complexityLevel: complexity,
            },
            durationSeconds: 45,
            transition: getChapterTransition(role),
            status: ChapterStatus.PENDING,
          };
        });

        // ─── STEP 3: IMAGES (batch) ─────────────────────────────
        setState((s) => ({ ...s, pipelineStep: "IMAGES" }));
        updateProductionStep("🖼️ IMAGES", "in_progress", "تصاویر فصل‌ها داره ساخته میشه...");

        const imageResults = await generateChapterImages(
          chapters,
          narrativeResponse.masterStylePrompt,
          (event: BatchProgressEvent) => {
            if (event.type === "chapter_completed") {
              console.log(`🖼️ [IMAGE] فصل ${event.chapterIndex + 1}/${event.totalChapters} تموم شد`);
              updateProductionStep(
                "🖼️ IMAGES",
                "in_progress",
                `فصل ${event.chapterIndex + 1}/${event.totalChapters} تصویر شد`
              );
              // imageUrl local update — imageResults.results بعداً کامل میشه
              if (event.imageUrl) {
                chapters[event.chapterIndex].imageUrl = event.imageUrl;
                chapters[event.chapterIndex].status = ChapterStatus.IMAGE_READY;
              }
            }
            if (event.type === "chapter_failed") {
              console.warn(`⚠️ [IMAGE] فصل ${event.chapterIndex + 1} شکست خورد`);
            }
          }
        );

        // نتیجه‌های batch اعمال
        imageResults.results.forEach((r) => {
          if (r.status === "success") {
            chapters[r.chapterIndex].imageUrl = r.imageUrl;
            chapters[r.chapterIndex].status = ChapterStatus.IMAGE_READY;
          }
        });

        console.log(`🖼️ [IMAGES] ${imageResults.totalGenerated}/${chapters.length} موفق`);
        updateProductionStep(
          "🖼️ IMAGES",
          "completed",
          `${imageResults.totalGenerated}/${chapters.length} موفق`
        );

        // ─── STEP 4: MUSIC ──────────────────────────────────────
        setState((s) => ({ ...s, pipelineStep: "MUSIC" }));
        updateProductionStep("🎵 MUSIC", "in_progress", "موسیقی ambient داره پیدا میشه...");

        const ambientMood = detectMusicMoodFromTopic(narrativeResponse.topic, item.narrativeLens);
        const musicResult = await selectSmartMusic({
          musicTracks,
          mood: ambientMood,
          topic: narrativeResponse.topic,
          fetchAudioBlob,
          onAddCloudTrack,
          setActiveTrackName,
          audioRef,
        });

        if (musicResult) {
          updateProductionStep("🎵 MUSIC", "completed", `${musicResult.title} (${musicResult.source})`);
          await decodeAndStoreMusicBuffer(audioRef, musicBufferRef, musicResult.blob);
        } else {
          updateProductionStep("🎵 MUSIC", "completed", "موسیقی پیدا نشد — بدون صدا");
          musicBufferRef.current = null;
        }

        // ─── STEP 5: METADATA ───────────────────────────────────
        setState((s) => ({ ...s, pipelineStep: "METADATA" }));
        updateProductionStep("📝 METADATA", "in_progress");
        setIsMetadataLoading(true);

        const project: DocumentaryProject = {
          id: `doc_${Date.now()}`,
          genre: item.genre,
          topic: narrativeResponse.topic,
          narrativeLens: item.narrativeLens,
          targetDurationMinutes: item.targetDurationMinutes,
          masterVisualStyle: item.masterVisualStyle,
          masterStylePrompt: narrativeResponse.masterStylePrompt,
          chapters,
          musicTimeline: {
            ambientTrackUrl: audioRef.current?.src || null,
            climaxTrackUrl: null, // Round 4
            revealTrackUrl: null, // Round 4
            chapterStingers: [],
          },
          status: ProjectStatus.READY_TO_PLAY,
          createdAt: Date.now(),
        };

        const docMetadata = buildDocumentaryMetadata(project);
        setMetadata(docMetadata);
        setIsMetadataLoading(false);
        updateProductionStep(
          "📝 METADATA",
          "completed",
          `${docMetadata.chapterMarkers.length} chapter marker`
        );

        // ─── STEP 6: READY ──────────────────────────────────────
        updateProductionStep("🎬 READY", "completed", "آماده پخش");

        setState((s) => ({
          ...s,
          project,
          storyArc: narrativeResponse.storyArc,
          docSnippets: narrativeResponse.keyFacts,
          isGenerating: false,
          pipelineStep: "READY",
        }));

        console.log(`✅ [PIPELINE] Documentary ready: "${project.topic}" — ${chapters.length} فصل`);

        // ─── AUTO MODE: 10s صبر بعد پخش ──────────────────────
        if (state.isAutoMode) {
          updateProductionStep("🎬 READY", "in_progress", "10s صبر... بعد شروع پخش");
          setTimeout(() => {
            setState((s) => ({ ...s, isSolving: true, isRecording: true, pipelineStep: "RECORDING" }));
            updateProductionStep("🎥 RECORD", "in_progress", "ضبط شروع شد");
          }, 10000);
        }
      } catch (e) {
        console.error("❌ [PIPELINE] Error:", e);
        setState((s) => ({
          ...s,
          isGenerating: false,
          isAutoMode: false,
          pipelineStep: "IDLE",
          error: "Pipeline Error — لطفاً دوباره سعی کنید",
        }));
      }
    },
    [
      preferences,
      musicTracks,
      fetchAudioBlob,
      onAddCloudTrack,
      setActiveTrackName,
      audioRef,
      musicBufferRef,
      state.isAutoMode,
      initProductionSteps,
      updateProductionStep,
    ]
  );

  // ─── AUTO PILOT TOGGLE ──────────────────────────────────────────

  const toggleAutoMode = useCallback(() => {
    setState((s) => {
      const active = !s.isAutoMode;
      return {
        ...s,
        isAutoMode: active,
        isFullPackage: active,
        pipelineStep: active ? "IDLE" : s.pipelineStep,
        queue: active
          ? [
              {
                genre: ReconstructionGenre.HISTORICAL_RECONSTRUCTION,
                topic: "",
                narrativeLens: NarrativeLens.ORIGIN_STORY,
                masterVisualStyle: MasterVisualStyle.EPIC_PAINTERLY,
                targetDurationMinutes: 8,
              },
              {
                genre: ReconstructionGenre.CRIMINAL_CASEFILE,
                topic: "",
                narrativeLens: NarrativeLens.WHY_MYSTERY,
                masterVisualStyle: MasterVisualStyle.FORENSIC,
                targetDurationMinutes: 10,
              },
              {
                genre: ReconstructionGenre.LOST_CIVILIZATIONS,
                topic: "",
                narrativeLens: NarrativeLens.HIDDEN_DISCOVERY,
                masterVisualStyle: MasterVisualStyle.ARCHAEOLOGICAL,
                targetDurationMinutes: 8,
              },
              {
                genre: ReconstructionGenre.UNSOLVED_MYSTERIES,
                topic: "",
                narrativeLens: NarrativeLens.UNSOLVED_ENIGMA,
                masterVisualStyle: MasterVisualStyle.DARK_DOCUMENTARY,
                targetDurationMinutes: 12,
              },
            ]
          : s.queue,
        currentQueueIdx: active ? 0 : s.currentQueueIdx,
      };
    });
  }, []);

  // ─── AUTO PILOT LOOP ────────────────────────────────────────────

  useEffect(() => {
    if (
      state.isAutoMode &&
      state.pipelineStep === "IDLE" &&
      state.currentQueueIdx >= 0 &&
      state.currentQueueIdx < state.queue.length
    ) {
      processPipelineItem(state.queue[state.currentQueueIdx]);
    }
  }, [state.isAutoMode, state.pipelineStep, state.currentQueueIdx, state.queue, processPipelineItem]);

  // ─── RETURN ───────────────────────────────────────────────────────

  return {
    state,
    setState,
    metadata,
    isMetadataLoading,
    setThumbnailDataUrl: (url: string | null) => setState((s) => ({ ...s, thumbnailDataUrl: url })),
    setLastVideoBlob: (blob: Blob | null) => setState((s) => ({ ...s, lastVideoBlob: blob })),
    processPipelineItem,
    toggleAutoMode,
  };
};
