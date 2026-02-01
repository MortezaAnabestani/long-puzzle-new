import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  ArtStyle,
  PieceShape,
  PieceMaterial,
  MovementType,
  PuzzleState,
  UserPreferences,
  TopicType,
  StoryArc,
} from "../types";
import {
  generateArtImage,
  YouTubeMetadata,
  getTrendingTopics,
  fetchFactNarrative,
  generateCoherentContentPackage,
  findSmartMusicByMood,
  extractCoreSubject,
} from "../services/geminiService";
import { getJalaliDate } from "../utils/dateUtils";
import { MusicTrack } from "../components/sidebar/MusicUploader";
import { VIRAL_CATEGORIES } from "../components/sidebar/VisionInput";
import { selectFreshCategory, addTopicVariation } from "../utils/contentVariety";
import { contentApi, ContentPayload } from "../services/api/contentApi";

export type PipelineStep =
  | "IDLE"
  | "SCAN"
  | "MUSIC"
  | "SYNTH"
  | "METADATA"
  | "THUMBNAIL"
  | "ANIMATE"
  | "RECORDING"
  | "PACKAGING";

export interface ProductionStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  details?: string;
}

const CLOUDFLARE_WORKER_URL = "https://plain-tooth-75c3.jujube-bros.workers.dev/";

interface QueueItem {
  duration: number;
  source: "BREAKING" | "VIRAL" | "NARRATIVE";
  pieceCount: number;
}

/**
 * تصادفی‌سازی پارامترهای بصری مطابق AUTO_PILOT_STRATEGY.md
 */
const randomizeVisualParameters = () => {
  const artStyles = Object.values(ArtStyle);
  const movements = Object.values(MovementType);
  const materials = Object.values(PieceMaterial);
  const shapes = Object.values(PieceShape);

  const randomStyle = artStyles[Math.floor(Math.random() * artStyles.length)];
  const randomMovement = movements[Math.floor(Math.random() * movements.length)];
  const randomMaterial = materials[Math.floor(Math.random() * materials.length)];
  const randomShape = shapes[Math.floor(Math.random() * shapes.length)];

  console.log(`🎭 [VARIETY] Style: ${randomStyle}, Movement: ${randomMovement}, Material: ${randomMaterial}, Shape: ${randomShape}`);

  return { randomStyle, randomMovement, randomMaterial, randomShape };
};

/**
 * انتخاب هوشمند موسیقی با اولویت‌بندی: Manual → Backend → AI
 */
interface SmartMusicSelectionParams {
  musicTracks: MusicTrack[];
  queueIndex: number;
  musicMood: any;
  topic: string;
  fetchAudioBlob: (url: string) => Promise<string | null>;
  onAddCloudTrack: (url: string, title: string, source?: 'backend' | 'ai') => void;
  setActiveTrackName: (name: string | null) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const selectSmartMusic = async (params: SmartMusicSelectionParams): Promise<{ source: string; title: string } | null> => {
  const { musicTracks, queueIndex, musicMood, topic, fetchAudioBlob, onAddCloudTrack, setActiveTrackName, audioRef } = params;

  // Priority 1: Manual tracks only (filter out backend/ai tracks)
  const manualTracks = musicTracks.filter(track => track.source === 'manual');
  if (manualTracks.length > 0) {
    const selectedTrack = manualTracks[queueIndex % manualTracks.length];
    console.log(`🎵 [MUSIC] Source: Manual (${queueIndex % manualTracks.length + 1}/${manualTracks.length}), Track: ${selectedTrack.name}`);

    // Load music to audioRef
    if (audioRef.current) {
      console.log(`   🔊 Loading manual track to audio player...`);
      console.log(`      Track URL: ${selectedTrack.url.substring(0, 80)}...`);
      audioRef.current.src = selectedTrack.url;
      audioRef.current.load();
      console.log(`      Audio element readyState: ${audioRef.current.readyState}`);
      console.log(`   ✅ Music loaded to audio player`);
    } else {
      console.error(`   ❌ audioRef.current is null!`);
    }

    setActiveTrackName(selectedTrack.name);
    return { source: 'Manual Upload', title: selectedTrack.name };
  }

  // Priority 2 & 3: Backend (در smartFetcher مدیریت می‌شود) یا AI
  console.log(`🎵 [MUSIC] No manual tracks, using smartFetcher...`);
  const { smartFetcher } = await import('../services/smartFetcher');
  const trackData = await smartFetcher.fetchMusic(musicMood, topic);

  if (trackData && trackData.url) {
    const blobUrl = await fetchAudioBlob(trackData.url);
    if (blobUrl) {
      // Determine source type for musicTracks
      const sourceType = trackData.source === 'Backend Database' ? 'backend' : 'ai';
      onAddCloudTrack(blobUrl, trackData.title, sourceType);
      setActiveTrackName(trackData.title);

      // Load music to audioRef
      if (audioRef.current) {
        console.log(`   🔊 Loading cloud track to audio player...`);
        console.log(`      Blob URL: ${blobUrl.substring(0, 80)}...`);
        console.log(`      Track source: ${trackData.source}`);
        audioRef.current.src = blobUrl;
        audioRef.current.load();
        console.log(`      Audio element readyState: ${audioRef.current.readyState}`);
        console.log(`   ✅ Music loaded to audio player`);
      } else {
        console.error(`   ❌ audioRef.current is null!`);
      }

      console.log(`🎵 [MUSIC] Source: ${trackData.source}, Track: ${trackData.title}`);
      return { source: trackData.source, title: trackData.title };
    }
  }

  console.warn(`⚠️ [MUSIC] No music found`);
  return null;
};

export const useProductionPipeline = (
  preferences: UserPreferences,
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>,
  musicTracks: MusicTrack[],
  selectedTrackId: string | null,
  setActiveTrackName: (name: string | null) => void,
  onAddCloudTrack: (url: string, title: string, source?: 'backend' | 'ai') => void,
  audioRef: React.RefObject<HTMLAudioElement | null>
) => {
  const [state, setState] = useState<
    PuzzleState & {
      audioError: boolean;
      isAutoMode: boolean;
      pipelineStep: PipelineStep;
      isFullPackage: boolean;
      queue: QueueItem[];
      currentQueueIdx: number;
      docSnippets: string[];
      storyArc: StoryArc | null;
      productionSteps: ProductionStep[];
    }
  >({
    isGenerating: false,
    isSolving: false,
    isRecording: false,
    progress: 0,
    imageUrl: null,
    error: null,
    audioError: false,
    isAutoMode: false,
    pipelineStep: "IDLE",
    isFullPackage: false,
    queue: [],
    currentQueueIdx: -1,
    docSnippets: [],
    storyArc: null,
    productionSteps: [],
  });

  const [metadata, setMetadata] = useState<YouTubeMetadata | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);
  const [currentCoreSubject, setCurrentCoreSubject] = useState<string | null>(null);
  const [currentVisualPrompt, setCurrentVisualPrompt] = useState<string | null>(null);
  const [currentMusicInfo, setCurrentMusicInfo] = useState<{ source: string; title: string } | null>(null);
  const [currentSource, setCurrentSource] = useState<'VIRAL' | 'BREAKING' | 'NARRATIVE' | 'MANUAL'>('MANUAL');
  const [currentSimilarityScore, setCurrentSimilarityScore] = useState<number | undefined>(undefined);
  const isExportingRef = useRef(false);

  // Helper function to update production steps
  const updateProductionStep = useCallback((stepId: string, status: ProductionStep['status'], details?: string) => {
    setState(prev => {
      const existingStepIndex = prev.productionSteps.findIndex(s => s.id === stepId);

      if (existingStepIndex >= 0) {
        // Update existing step
        const updatedSteps = [...prev.productionSteps];
        updatedSteps[existingStepIndex] = {
          ...updatedSteps[existingStepIndex],
          status,
          details: details || updatedSteps[existingStepIndex].details,
        };
        return { ...prev, productionSteps: updatedSteps };
      } else {
        // Add new step
        return {
          ...prev,
          productionSteps: [
            ...prev.productionSteps,
            { id: stepId, label: stepId, status, details },
          ],
        };
      }
    });
  }, []);

  // Initialize production steps
  const initializeProductionSteps = useCallback(() => {
    const steps: ProductionStep[] = [
      { id: '📊 SCAN', label: 'انتخاب نوع محتوا', status: 'pending' },
      { id: '🔊 SOUND FX', label: 'تصادفی‌سازی افکت‌های صوتی', status: 'pending' },
      { id: '🎭 VARIETY', label: 'تصادفی‌سازی پارامترهای بصری', status: 'pending' },
      { id: '🔍 VALIDATION', label: 'بررسی تشابه محتوا', status: 'pending' },
      { id: '🎵 MUSIC', label: 'انتخاب موسیقی', status: 'pending' },
      { id: '🎨 GENERATE', label: 'تولید تصویر و داستان', status: 'pending' },
      { id: '📝 METADATA', label: 'تولید متادیتا', status: 'pending' },
      { id: '🖼️ THUMBNAIL', label: 'آماده‌سازی تامبنیل', status: 'pending' },
      { id: '🎬 ANIMATE', label: 'شروع انیمیشن پازل', status: 'pending' },
      { id: '🎥 RECORD', label: 'ضبط ویدئو', status: 'pending' },
      { id: '📦 PACKAGE', label: 'ذخیره و دانلود', status: 'pending' },
    ];
    setState(prev => ({ ...prev, productionSteps: steps }));
  }, []);

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

  const fetchAudioBlob = async (url: string): Promise<string | null> => {
    const proxies = [
      { url: `${CLOUDFLARE_WORKER_URL}?url=${encodeURIComponent(url)}` },
      { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` },
    ];
    for (const p of proxies) {
      try {
        const res = await fetch(p.url);
        if (res.ok) {
          let blob = await res.blob();
          // Ensure blob has correct MIME type
          if (!blob.type || blob.type === 'application/octet-stream') {
            blob = new Blob([blob], { type: 'audio/mpeg' });
            console.log(`🎵 [fetchAudioBlob] Fixed blob MIME type to audio/mpeg`);
          }
          const blobUrl = URL.createObjectURL(blob);
          console.log(`✅ [fetchAudioBlob] Created blob URL: ${blobUrl.substring(0, 50)}...`);
          return blobUrl;
        }
      } catch (e) {
        console.warn("Proxy fail:", p.url);
      }
    }
    console.error(`❌ [fetchAudioBlob] All proxies failed for: ${url}`);
    return null;
  };

  const executePackaging = useCallback(
    async (videoBlob: Blob) => {
      console.log(`📦 [Packaging] executePackaging called`);
      console.log(`   isExportingRef: ${isExportingRef.current}`);
      console.log(`   videoBlob size: ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB`);

      if (isExportingRef.current) {
        console.log(`⏸️ [Packaging] Already exporting, skipping...`);
        return;
      }
      isExportingRef.current = true;

      const jalali = getJalaliDate();
      const cleanTitle = (metadata?.title || "Studio_Project").replace(/[\\/:*?"<>|]/g, "").slice(0, 50);
      const baseFileName = `${jalali}_${cleanTitle}`;

      // Step 9: PACKAGE - Export and save
      updateProductionStep('📦 PACKAGE', 'in_progress', 'شروع دانلود و ذخیره‌سازی...');
      console.log(`📥 [Packaging] Starting downloads with base filename: ${baseFileName}`);

      try {
        console.log(`   1️⃣ Downloading video...`);
        downloadFile(`${baseFileName}_Video.${videoBlob.type.includes("mp4") ? "mp4" : "webm"}`, videoBlob);

        if (metadata) {
          console.log(`   2️⃣ Downloading metadata...`);
          await new Promise((r) => setTimeout(r, 1500));
          downloadFile(
            `${baseFileName}_Metadata.txt`,
            new Blob([`TITLE: ${metadata.title}\n\nDESC: ${metadata.description}`], { type: "text/plain" })
          );
        }

        if (thumbnailDataUrl) {
          console.log(`   3️⃣ Downloading thumbnail...`);
          await new Promise((r) => setTimeout(r, 1500));
          const res = await fetch(thumbnailDataUrl);
          downloadFile(`${baseFileName}_Thumbnail.jpg`, await res.blob());
        }

        console.log(`✅ [Packaging] All downloads completed!`);

        // Save content to backend database after successful download
        console.log(`🔍 [Packaging] Checking requirements for database save...`);
        console.log(`   currentCoreSubject: ${currentCoreSubject ? "✅ EXISTS" : "❌ MISSING"}`);
        console.log(`   currentVisualPrompt: ${currentVisualPrompt ? "✅ EXISTS" : "❌ MISSING"}`);
        console.log(`   metadata: ${metadata ? "✅ EXISTS" : "❌ MISSING"}`);

        if (currentCoreSubject && currentVisualPrompt && metadata) {
          console.log(`💾 [API] All requirements met! Saving content to database...`);

          const payload: ContentPayload = {
            jalaliDate: jalali,
            puzzleCard: {
              source: currentSource,
              category: preferences.topicCategory || "Unknown",
              narrativeLens: preferences.narrativeLens,
              musicMood: state.storyArc?.musicMood,
              musicTrack: currentMusicInfo?.title,
              musicSource: currentMusicInfo?.source,
              artStyle: preferences.style,
              pieceCount: preferences.pieceCount,
              duration: preferences.durationMinutes,
              shape: preferences.shape,
              material: preferences.material,
              movement: preferences.movement,
              soundEffects: {
                snap: 'randomized',
                move: 'randomized',
                wave: 'randomized',
                destruct: 'randomized'
              }
            },
            story: {
              coreSubject: currentCoreSubject,
              visualPrompt: currentVisualPrompt,
              hook: state.storyArc?.hook,
              buildup: state.storyArc?.buildup,
              climax: state.storyArc?.climax,
              reveal: state.storyArc?.reveal,
            },
            metadata: {
              title: metadata.title,
              description: metadata.description,
              tags: metadata.tags,
              hashtags: metadata.hashtags,
            },
            files: {
              videoFilename: `${baseFileName}_Video.${videoBlob.type.includes("mp4") ? "mp4" : "webm"}`,
              thumbnailFilename: thumbnailDataUrl ? `${baseFileName}_Thumbnail.jpg` : undefined,
              videoSizeMB: Number((videoBlob.size / 1024 / 1024).toFixed(2)),
            },
            analysis: {
              similarityScore: currentSimilarityScore,
              isUnique: currentSimilarityScore !== undefined ? currentSimilarityScore < 0.85 : true,
              generationAttempts: 1,
            },
          };

          const saveResult = await contentApi.saveContent(payload);

          if (saveResult.success) {
            console.log(`✅ [API] Content saved to database successfully!`);
            console.log(`   Database ID: ${saveResult.data?._id}`);
            console.log(`📦 [PACKAGE] Saved: ${payload.files.videoFilename}, DB ID: ${saveResult.data?._id}`);
            updateProductionStep('📦 PACKAGE', 'completed', `ذخیره شد - DB ID: ${saveResult.data?._id?.substring(0, 8)}...`);
          } else {
            console.error(`❌ [API] Failed to save content: ${saveResult.error}`);
            console.warn(`⚠️ [API] Content was downloaded but not saved to database`);
            updateProductionStep('📦 PACKAGE', 'completed', 'دانلود انجام شد - خطا در ذخیره دیتابیس');
          }

          // Clear after recording
          setCurrentCoreSubject(null);
          setCurrentVisualPrompt(null);
          setCurrentMusicInfo(null);
          setCurrentSource('MANUAL');
          setCurrentSimilarityScore(undefined);
        } else {
          console.log(`⏭️ [API] Skipping database save (missing required data)`);
          updateProductionStep('📦 PACKAGE', 'completed', 'دانلود انجام شد - بدون ذخیره دیتابیس');
        }
      } finally {
        setLastVideoBlob(null);
        isExportingRef.current = false;

        // Log completion
        const currentIdx = state.currentQueueIdx;
        console.log(`✅ [COMPLETE] Video ${currentIdx + 1} finished successfully`);

        setTimeout(() => {
          setState((prev) => {
            const nextIdx = prev.currentQueueIdx + 1;
            const hasNext = prev.isFullPackage && nextIdx < prev.queue.length;

            if (hasNext) {
              console.log(`\n➡️  [AutoPilot] Moving to next video (${nextIdx + 1}/${prev.queue.length})\n`);
            } else {
              console.log(`\n🏁 [AutoPilot] All videos completed! Auto-Pilot finished.\n`);
            }

            return {
              ...prev,
              currentQueueIdx: hasNext ? nextIdx : -1,
              pipelineStep: "IDLE",
              isAutoMode: hasNext,
              isFullPackage: hasNext,
              isSolving: false,
              isRecording: false,
              progress: 0,
              imageUrl: hasNext ? prev.imageUrl : null,
            };
          });
        }, 2500);
      }
    },
    [metadata, thumbnailDataUrl]
  );

  useEffect(() => {
    if (state.pipelineStep === "PACKAGING" && lastVideoBlob && !isExportingRef.current) {
      executePackaging(lastVideoBlob);
    }
  }, [state.pipelineStep, lastVideoBlob, executePackaging]);

  const processPipelineItem = useCallback(
    async (item: QueueItem, isManualOverride: boolean = false) => {
      setState((s) => ({
        ...s,
        pipelineStep: "SCAN",
        isGenerating: true,
        error: null,
        imageUrl: isManualOverride ? s.imageUrl : null,
        progress: 0,
        storyArc: null,
      }));

      setLastVideoBlob(null);
      setMetadata(null);
      setThumbnailDataUrl(null);

      try {
        let sourceSubject = preferences.subject;
        let activeTopicType = TopicType.MANUAL;
        let categoryLabel = "Custom";

        if (!isManualOverride && state.isAutoMode) {
          // 🎬 [AutoPilot] Starting video logging
          console.log(`🎬 [AutoPilot] Starting video ${state.currentQueueIdx + 1}/${state.queue.length}`);

          // Initialize production steps for this video
          initializeProductionSteps();

          // Step 1: SCAN
          updateProductionStep('📊 SCAN', 'in_progress');
          console.log(`📊 [SCAN] Content Type: ${item.source}`);
          updateProductionStep('📊 SCAN', 'completed', `نوع: ${item.source}, مدت: ${item.duration * 60}s, قطعات: ${item.pieceCount}`);

          // Step 2: Sound FX
          updateProductionStep('🔊 SOUND FX', 'in_progress');
          console.log(`🔊 [SOUND FX] Randomizing all sound effects...`);
          const { soundRandomizer } = await import('../services/soundRandomizer');
          const { useBackendMode } = await import('../contexts/BackendModeContext');
          // We can't use the hook here, so we check smartFetcher's mode instead
          const { smartFetcher } = await import('../services/smartFetcher');
          const preferBackend = smartFetcher.isBackendEnabled();
          await soundRandomizer.randomizeAllSounds(preferBackend);
          console.log(`🔊 [SOUND FX] Randomized: SNAP, MOVE, WAVE, DESTRUCT`);
          updateProductionStep('🔊 SOUND FX', 'completed', 'SNAP, MOVE, WAVE, DESTRUCT');

          if (item.source === "VIRAL") {
            let contentPackage;
            let coreSubject;
            let attempts = 0;
            const maxAttempts = 5;

            // Step 3: VALIDATION - Uniqueness check
            updateProductionStep('🔍 VALIDATION', 'in_progress');

            // Validation loop: Keep generating until we find unique content
            while (attempts < maxAttempts) {
              attempts++;

              // Select a fresh category that hasn't been used recently
              const randomNiche = selectFreshCategory(VIRAL_CATEGORIES, 5);

              // Add unique variation to prevent repetitive prompts
              const variedTopic = addTopicVariation(randomNiche.topic);

              console.log(
                `\n🎯 Attempt ${attempts}/${maxAttempts}: Generating content for "${randomNiche.label}"`
              );
              console.log(`🎨 Variation: ${variedTopic.substring(0, 100)}...`);

              // Generate content package
              contentPackage = await generateCoherentContentPackage(variedTopic, randomNiche.label);

              // Extract core subject for similarity checking
              coreSubject = await extractCoreSubject(
                contentPackage.visualPrompt,
                contentPackage.storyArc,
                randomNiche.label
              );

              // Check similarity via backend API
              console.log(`🔍 [API] Checking content similarity with backend...`);
              const similarityResult = await contentApi.checkSimilarity(coreSubject);

              if (similarityResult.success && similarityResult.data) {
                const isSimilar = similarityResult.data.isSimilar;
                const score = similarityResult.data.similarityScore !== undefined
                  ? similarityResult.data.similarityScore
                  : 0;

                if (!isSimilar) {
                  console.log(`✅ Content approved as unique! Proceeding with generation.`);
                  console.log(`🔍 [VALIDATION] Similarity Score: ${score} (UNIQUE)`);
                  const scoreText = score.toFixed(2);
                  updateProductionStep('🔍 VALIDATION', 'completed', `امتیاز: ${scoreText} - محتوای منحصربه‌فرد`);
                  setCurrentSimilarityScore(score);
                  break; // Content is unique, exit loop
                } else {
                  console.log(`❌ Content rejected as too similar (score: ${score})`);
                  console.log(`🔍 [VALIDATION] Similarity Score: ${score} (DUPLICATE)`);
                  if (similarityResult.data.matchedContents?.length > 0) {
                    console.log(`   Matched: ${similarityResult.data.matchedContents.map((m: any) => m.title).join(", ")}`);
                  }

                  if (attempts < maxAttempts) {
                    console.log(`   🔄 Regenerating with different parameters...\n`);
                    const scoreText = score.toFixed(2);
                    updateProductionStep('🔍 VALIDATION', 'in_progress', `امتیاز: ${scoreText} - تلاش ${attempts}/${maxAttempts}`);
                  }
                }
              } else {
                // If API check fails, log warning but continue (don't crash the pipeline)
                console.warn(`⚠️ [API] Similarity check failed: ${similarityResult.error}`);
                console.log(`   Proceeding with content generation (assuming unique)...`);
                updateProductionStep('🔍 VALIDATION', 'completed', 'خطا در بررسی - ادامه با فرض منحصربه‌فرد بودن');
                break;
              }
            }

            if (attempts >= maxAttempts) {
              console.warn(`⚠️ Max attempts reached. Using last generated content despite similarity.`);
              updateProductionStep('🔍 VALIDATION', 'completed', `حداکثر تلاش - استفاده از آخرین محتوا`);
            }

            // Store core subject and visual prompt for later recording
            setCurrentCoreSubject(coreSubject);
            setCurrentVisualPrompt(contentPackage.visualPrompt);
            setCurrentSource('VIRAL');

            sourceSubject = contentPackage.visualPrompt;
            activeTopicType = TopicType.VIRAL;
            categoryLabel = contentPackage.theme.category;

            // Step 3: VARIETY - Randomize Visual Parameters
            updateProductionStep('🎭 VARIETY', 'in_progress');
            const { randomStyle, randomMovement, randomMaterial, randomShape } = randomizeVisualParameters();
            console.log(`🎭 [VARIETY] Style: ${randomStyle}, Movement: ${randomMovement}, Material: ${randomMaterial}, Shape: ${randomShape}`);
            updateProductionStep('🎭 VARIETY', 'completed', `سبک: ${randomStyle}, حرکت: ${randomMovement}, ماده: ${randomMaterial}, شکل: ${randomShape}`);

            // Step 4: MUSIC - Smart Music Selection
            setState((s) => ({ ...s, pipelineStep: "MUSIC" }));
            updateProductionStep('🎵 MUSIC', 'in_progress');
            const musicResult = await selectSmartMusic({
              musicTracks,
              queueIndex: state.currentQueueIdx,
              musicMood: contentPackage.theme.musicMood,
              topic: sourceSubject,
              fetchAudioBlob,
              onAddCloudTrack,
              setActiveTrackName,
              audioRef,
            });
            if (musicResult) {
              console.log(`🎵 [MUSIC] Selected: ${musicResult.title} from ${musicResult.source}`);
              const titlePreview = musicResult.title.length > 40 ? musicResult.title.substring(0, 40) + '...' : musicResult.title;
              updateProductionStep('🎵 MUSIC', 'completed', `منبع: ${musicResult.source}, قطعه: ${titlePreview}`);
              setCurrentMusicInfo(musicResult);
            } else {
              updateProductionStep('🎵 MUSIC', 'completed', 'موسیقی انتخاب نشد - ادامه بدون موسیقی');
              setCurrentMusicInfo(null);
            }

            // Step 5: GENERATE - Create Visual Content
            setState((s) => ({ ...s, pipelineStep: "SYNTH" }));
            updateProductionStep('🎨 GENERATE', 'in_progress');
            const art = await generateArtImage(randomStyle, contentPackage.visualPrompt);
            console.log(`🎨 [GENERATE] Image: ${art.imageUrl?.substring(0, 50)}..., Story: ${contentPackage.storyArc.hook}`);
            const hookPreview = contentPackage.storyArc.hook.length > 50 ? contentPackage.storyArc.hook.substring(0, 50) + '...' : contentPackage.storyArc.hook;
            updateProductionStep('🎨 GENERATE', 'completed', `تصویر تولید شد - داستان: ${hookPreview}`);

            setPreferences((p) => ({
              ...p,
              subject: sourceSubject,
              style: randomStyle,
              movement: randomMovement,
              material: randomMaterial,
              shape: randomShape,
              pieceCount: item.pieceCount,
              durationMinutes: item.duration,
              topicType: activeTopicType,
              topicCategory: categoryLabel,
              narrativeLens: contentPackage.theme.narrativeLens,
            }));

            setState((s) => ({
              ...s,
              imageUrl: art.imageUrl,
              storyArc: contentPackage.storyArc,
              docSnippets: [],
              isGenerating: false,
              pipelineStep: "METADATA",
            }));

            // Step 6: METADATA - Generate metadata
            updateProductionStep('📋 METADATA', 'in_progress');
            setIsMetadataLoading(true);
            setMetadata(contentPackage.metadata);
            setIsMetadataLoading(false);
            console.log(`📋 [METADATA] Title: ${contentPackage.metadata?.title}`);
            const metadataTitle = contentPackage.metadata?.title || 'نامشخص';
            const titlePreview = metadataTitle.length > 50 ? metadataTitle.substring(0, 50) + '...' : metadataTitle;
            updateProductionStep('📋 METADATA', 'completed', `عنوان: ${titlePreview}`);

            // Step 7: THUMBNAIL - Prepare thumbnail
            setState((s) => ({ ...s, pipelineStep: "THUMBNAIL" }));
            updateProductionStep('🖼️ THUMBNAIL', 'in_progress');
            console.log(`🖼️ [THUMBNAIL] Preparing thumbnail generation...`);
            updateProductionStep('🖼️ THUMBNAIL', 'completed', 'آماده برای تولید تامبنیل');

            if (state.isAutoMode) {
              // Step 8: ANIMATE - Start animation
              updateProductionStep('🎬 ANIMATE', 'in_progress', 'انتظار 10 ثانیه برای آمادگی کامل مرورگر...');
              console.log(`⏸️ [AutoPilot] Waiting 10 seconds for browser to prepare...`);
              setTimeout(
                () => {
                  setState((s) => ({ ...s, isSolving: true, isRecording: true, pipelineStep: "RECORDING" }));
                  updateProductionStep('🎬 ANIMATE', 'completed', 'انیمیشن آغاز شد');
                  updateProductionStep('🎥 RECORD', 'in_progress', 'در حال ضبط ویدئو...');
                },
                10000
              );
            } else {
              setState((s) => ({ ...s, pipelineStep: "IDLE" }));
            }
          } else if (item.source === "NARRATIVE") {
            // Use new Coherent Content Package for NARRATIVE mode too
            const randomNiche = VIRAL_CATEGORIES[Math.floor(Math.random() * VIRAL_CATEGORIES.length)];

            console.log(`🎯 NARRATIVE Mode: Generating coherent package for "${randomNiche.label}"`);
            const contentPackage = await generateCoherentContentPackage(randomNiche.topic, randomNiche.label);

            // Extract core subject for database save
            const coreSubject = await extractCoreSubject(
              contentPackage.visualPrompt,
              contentPackage.storyArc,
              randomNiche.label
            );

            // Store for later database save
            setCurrentCoreSubject(coreSubject);
            setCurrentVisualPrompt(contentPackage.visualPrompt);
            setCurrentSource('NARRATIVE');

            sourceSubject = contentPackage.visualPrompt;
            activeTopicType = TopicType.NARRATIVE;
            categoryLabel = contentPackage.theme.category;

            // NARRATIVE skips VALIDATION step (no similarity check needed for historical content)
            updateProductionStep('🔍 VALIDATION', 'completed', 'بدون نیاز به اعتبارسنجی - محتوای تاریخی');
            setCurrentSimilarityScore(undefined);

            // Step 3: VARIETY - Randomize Visual Parameters
            updateProductionStep('🎭 VARIETY', 'in_progress');
            const narrativeVisual = randomizeVisualParameters();
            console.log(`🎭 [VARIETY] Style: ${narrativeVisual.randomStyle}, Movement: ${narrativeVisual.randomMovement}`);
            updateProductionStep('🎭 VARIETY', 'completed', `سبک: ${narrativeVisual.randomStyle}, حرکت: ${narrativeVisual.randomMovement}, ماده: ${narrativeVisual.randomMaterial}, شکل: ${narrativeVisual.randomShape}`);

            // Step 4: MUSIC - Smart Music Selection
            setState((s) => ({ ...s, pipelineStep: "MUSIC" }));
            updateProductionStep('🎵 MUSIC', 'in_progress');
            const narrativeMusicResult = await selectSmartMusic({
              musicTracks,
              queueIndex: state.currentQueueIdx,
              musicMood: contentPackage.theme.musicMood,
              topic: sourceSubject,
              fetchAudioBlob,
              onAddCloudTrack,
              setActiveTrackName,
              audioRef,
            });
            if (narrativeMusicResult) {
              console.log(`🎵 [MUSIC] Selected: ${narrativeMusicResult.title} from ${narrativeMusicResult.source}`);
              const musicTitlePreview = narrativeMusicResult.title.length > 40 ? narrativeMusicResult.title.substring(0, 40) + '...' : narrativeMusicResult.title;
              updateProductionStep('🎵 MUSIC', 'completed', `منبع: ${narrativeMusicResult.source}, قطعه: ${musicTitlePreview}`);
              setCurrentMusicInfo(narrativeMusicResult);
            } else {
              updateProductionStep('🎵 MUSIC', 'completed', 'موسیقی انتخاب نشد - ادامه بدون موسیقی');
              setCurrentMusicInfo(null);
            }

            // Step 5: GENERATE - Create Visual Content
            setState((s) => ({ ...s, pipelineStep: "SYNTH" }));
            updateProductionStep('🎨 GENERATE', 'in_progress');
            const art = await generateArtImage(narrativeVisual.randomStyle, contentPackage.visualPrompt);
            console.log(`🎨 [GENERATE] Image: ${art.imageUrl?.substring(0, 50)}..., Story: ${contentPackage.storyArc.hook}`);
            const narrativeHookPreview = contentPackage.storyArc.hook.length > 50 ? contentPackage.storyArc.hook.substring(0, 50) + '...' : contentPackage.storyArc.hook;
            updateProductionStep('🎨 GENERATE', 'completed', `تصویر تولید شد - داستان: ${narrativeHookPreview}`);

            setPreferences((p) => ({
              ...p,
              subject: sourceSubject,
              style: narrativeVisual.randomStyle,
              movement: narrativeVisual.randomMovement,
              material: narrativeVisual.randomMaterial,
              shape: narrativeVisual.randomShape,
              pieceCount: item.pieceCount,
              durationMinutes: item.duration,
              topicType: activeTopicType,
              topicCategory: categoryLabel,
              narrativeLens: contentPackage.theme.narrativeLens,
            }));

            setState((s) => ({
              ...s,
              imageUrl: art.imageUrl,
              storyArc: contentPackage.storyArc,
              docSnippets: [],
              isGenerating: false,
              pipelineStep: "METADATA",
            }));

            // Step 6: METADATA - Generate metadata
            updateProductionStep('📋 METADATA', 'in_progress');
            setIsMetadataLoading(true);
            setMetadata(contentPackage.metadata);
            setIsMetadataLoading(false);
            console.log(`📋 [METADATA] Title: ${contentPackage.metadata?.title}`);
            const metadataTitle = contentPackage.metadata?.title || 'نامشخص';
            const titlePreview = metadataTitle.length > 50 ? metadataTitle.substring(0, 50) + '...' : metadataTitle;
            updateProductionStep('📋 METADATA', 'completed', `عنوان: ${titlePreview}`);

            // Step 7: THUMBNAIL - Prepare thumbnail
            setState((s) => ({ ...s, pipelineStep: "THUMBNAIL" }));
            updateProductionStep('🖼️ THUMBNAIL', 'in_progress');
            console.log(`🖼️ [THUMBNAIL] Preparing thumbnail generation...`);
            updateProductionStep('🖼️ THUMBNAIL', 'completed', 'آماده برای تولید تامبنیل');

            if (state.isAutoMode) {
              // Step 8: ANIMATE - Start animation
              updateProductionStep('🎬 ANIMATE', 'in_progress', 'انتظار 10 ثانیه برای آمادگی کامل مرورگر...');
              console.log(`⏸️ [AutoPilot] Waiting 10 seconds for browser to prepare...`);
              setTimeout(
                () => {
                  setState((s) => ({ ...s, isSolving: true, isRecording: true, pipelineStep: "RECORDING" }));
                  updateProductionStep('🎬 ANIMATE', 'completed', 'انیمیشن آغاز شد');
                  updateProductionStep('🎥 RECORD', 'in_progress', 'در حال ضبط ویدئو...');
                },
                10000
              );
            } else {
              setState((s) => ({ ...s, pipelineStep: "IDLE" }));
            }
          } else if (item.source === "BREAKING") {
            // Breaking News Mode: AI Search for trending topics
            console.log(`🎯 BREAKING Mode: Fetching trending topics via AI Search...`);

            let contentPackage;
            let coreSubject;
            let attempts = 0;
            const maxAttempts = 5;

            // Step 3: VALIDATION - Uniqueness check with trending topics
            updateProductionStep('🔍 VALIDATION', 'in_progress');

            // Validation loop with trending topics
            while (attempts < maxAttempts) {
              attempts++;

              // Fetch trending topics
              const trendingTopics = await getTrendingTopics();
              const randomTopic = trendingTopics[Math.floor(Math.random() * trendingTopics.length)];

              console.log(
                `\n🎯 Attempt ${attempts}/${maxAttempts}: Generating breaking news content`
              );
              console.log(`📰 Topic: ${randomTopic}`);

              // Generate content package
              contentPackage = await generateCoherentContentPackage(randomTopic, "Breaking News");

              // Extract core subject for similarity checking
              coreSubject = await extractCoreSubject(
                contentPackage.visualPrompt,
                contentPackage.storyArc,
                "Breaking News"
              );

              // Check similarity via backend API
              console.log(`🔍 [API] Checking content similarity with backend...`);
              const similarityResult = await contentApi.checkSimilarity(coreSubject);

              if (similarityResult.success && similarityResult.data) {
                const isSimilar = similarityResult.data.isSimilar;
                const score = similarityResult.data.similarityScore !== undefined
                  ? similarityResult.data.similarityScore
                  : 0;

                if (!isSimilar) {
                  console.log(`✅ Content approved as unique! Proceeding with generation.`);
                  console.log(`🔍 [VALIDATION] Similarity Score: ${score} (UNIQUE)`);
                  const scoreText = score.toFixed(2);
                  updateProductionStep('🔍 VALIDATION', 'completed', `امتیاز: ${scoreText} - خبر منحصربه‌فرد`);
                  setCurrentSimilarityScore(score);
                  break;
                } else {
                  console.log(`❌ Content rejected as too similar (score: ${score})`);
                  if (attempts < maxAttempts) {
                    console.log(`   🔄 Regenerating with different topic...\n`);
                    const scoreText = score.toFixed(2);
                    updateProductionStep('🔍 VALIDATION', 'in_progress', `امتیاز: ${scoreText} - تلاش ${attempts}/${maxAttempts}`);
                  }
                }
              } else {
                console.warn(`⚠️ [API] Similarity check failed: ${similarityResult.error}`);
                console.log(`   Proceeding with content generation (assuming unique)...`);
                updateProductionStep('🔍 VALIDATION', 'completed', 'خطا در بررسی - ادامه با فرض منحصربه‌فرد بودن');
                break;
              }
            }

            if (attempts >= maxAttempts) {
              console.warn(`⚠️ Max attempts reached. Using last generated content despite similarity.`);
              updateProductionStep('🔍 VALIDATION', 'completed', `حداکثر تلاش - استفاده از آخرین خبر`);
            }

            // Store core subject and visual prompt
            setCurrentCoreSubject(coreSubject);
            setCurrentVisualPrompt(contentPackage.visualPrompt);
            setCurrentSource('BREAKING');

            sourceSubject = contentPackage.visualPrompt;
            activeTopicType = TopicType.BREAKING;
            categoryLabel = "Breaking News";

            // Step 3: VARIETY - Randomize Visual Parameters
            updateProductionStep('🎭 VARIETY', 'in_progress');
            const breakingVisual = randomizeVisualParameters();
            console.log(`🎭 [VARIETY] Style: ${breakingVisual.randomStyle}, Movement: ${breakingVisual.randomMovement}`);
            updateProductionStep('🎭 VARIETY', 'completed', `سبک: ${breakingVisual.randomStyle}, حرکت: ${breakingVisual.randomMovement}, ماده: ${breakingVisual.randomMaterial}, شکل: ${breakingVisual.randomShape}`);

            // Step 4: MUSIC - Smart Music Selection
            setState((s) => ({ ...s, pipelineStep: "MUSIC" }));
            updateProductionStep('🎵 MUSIC', 'in_progress');
            const breakingMusicResult = await selectSmartMusic({
              musicTracks,
              queueIndex: state.currentQueueIdx,
              musicMood: contentPackage.theme.musicMood,
              topic: sourceSubject,
              fetchAudioBlob,
              onAddCloudTrack,
              setActiveTrackName,
              audioRef,
            });
            if (breakingMusicResult) {
              console.log(`🎵 [MUSIC] Selected: ${breakingMusicResult.title} from ${breakingMusicResult.source}`);
              const breakingMusicTitlePreview = breakingMusicResult.title.length > 40 ? breakingMusicResult.title.substring(0, 40) + '...' : breakingMusicResult.title;
              updateProductionStep('🎵 MUSIC', 'completed', `منبع: ${breakingMusicResult.source}, قطعه: ${breakingMusicTitlePreview}`);
              setCurrentMusicInfo(breakingMusicResult);
            } else {
              updateProductionStep('🎵 MUSIC', 'completed', 'موسیقی انتخاب نشد - ادامه بدون موسیقی');
              setCurrentMusicInfo(null);
            }

            // Step 5: GENERATE - Create Visual Content
            setState((s) => ({ ...s, pipelineStep: "SYNTH" }));
            updateProductionStep('🎨 GENERATE', 'in_progress');
            const art = await generateArtImage(breakingVisual.randomStyle, contentPackage.visualPrompt);
            console.log(`🎨 [GENERATE] Image: ${art.imageUrl?.substring(0, 50)}..., Story: ${contentPackage.storyArc.hook}`);
            const breakingHookPreview = contentPackage.storyArc.hook.length > 50 ? contentPackage.storyArc.hook.substring(0, 50) + '...' : contentPackage.storyArc.hook;
            updateProductionStep('🎨 GENERATE', 'completed', `تصویر تولید شد - خبر: ${breakingHookPreview}`);

            setPreferences((p) => ({
              ...p,
              subject: sourceSubject,
              style: breakingVisual.randomStyle,
              movement: breakingVisual.randomMovement,
              material: breakingVisual.randomMaterial,
              shape: breakingVisual.randomShape,
              pieceCount: item.pieceCount,
              durationMinutes: item.duration,
              topicType: activeTopicType,
              topicCategory: categoryLabel,
              narrativeLens: contentPackage.theme.narrativeLens,
            }));

            setState((s) => ({
              ...s,
              imageUrl: art.imageUrl,
              storyArc: contentPackage.storyArc,
              docSnippets: [],
              isGenerating: false,
              pipelineStep: "METADATA",
            }));

            // Step 6: METADATA - Generate metadata
            updateProductionStep('📋 METADATA', 'in_progress');
            setIsMetadataLoading(true);
            setMetadata(contentPackage.metadata);
            setIsMetadataLoading(false);
            console.log(`📋 [METADATA] Title: ${contentPackage.metadata?.title}`);
            const metadataTitle = contentPackage.metadata?.title || 'نامشخص';
            const titlePreview = metadataTitle.length > 50 ? metadataTitle.substring(0, 50) + '...' : metadataTitle;
            updateProductionStep('📋 METADATA', 'completed', `عنوان: ${titlePreview}`);

            // Step 7: THUMBNAIL - Prepare thumbnail
            setState((s) => ({ ...s, pipelineStep: "THUMBNAIL" }));
            updateProductionStep('🖼️ THUMBNAIL', 'in_progress');
            console.log(`🖼️ [THUMBNAIL] Preparing thumbnail generation...`);
            updateProductionStep('🖼️ THUMBNAIL', 'completed', 'آماده برای تولید تامبنیل');

            if (state.isAutoMode) {
              // Step 8: ANIMATE - Start animation
              updateProductionStep('🎬 ANIMATE', 'in_progress', 'انتظار 10 ثانیه برای آمادگی کامل مرورگر...');
              console.log(`⏸️ [AutoPilot] Waiting 10 seconds for browser to prepare...`);
              setTimeout(
                () => {
                  setState((s) => ({ ...s, isSolving: true, isRecording: true, pipelineStep: "RECORDING" }));
                  updateProductionStep('🎬 ANIMATE', 'completed', 'انیمیشن آغاز شد');
                  updateProductionStep('🎥 RECORD', 'in_progress', 'در حال ضبط ویدئو...');
                },
                10000
              );
            } else {
              setState((s) => ({ ...s, pipelineStep: "IDLE" }));
            }
          }
        } else {
          // MANUAL mode - use Coherent Content Package for consistency
          const randomNiche = VIRAL_CATEGORIES[Math.floor(Math.random() * VIRAL_CATEGORIES.length)];

          console.log(`🎯 MANUAL Mode: Generating coherent package for "${randomNiche.label}"`);
          const contentPackage = await generateCoherentContentPackage(sourceSubject, randomNiche.label);

          // Extract core subject for database save
          const coreSubject = await extractCoreSubject(
            contentPackage.visualPrompt,
            contentPackage.storyArc,
            randomNiche.label
          );

          // Store for later database save
          setCurrentCoreSubject(coreSubject);
          setCurrentVisualPrompt(contentPackage.visualPrompt);
          setCurrentSource('MANUAL');
          setCurrentSimilarityScore(undefined);

          setState((s) => ({ ...s, pipelineStep: "MUSIC" }));
          // 🎵 Smart Music Selection with Priority (Manual Mode doesn't use queue)
          const manualMusicResult = await selectSmartMusic({
            musicTracks,
            queueIndex: 0, // Manual mode doesn't track queue index
            musicMood: contentPackage.theme.musicMood,
            topic: sourceSubject,
            fetchAudioBlob,
            onAddCloudTrack,
            setActiveTrackName,
            audioRef,
          });
          setCurrentMusicInfo(manualMusicResult);

          setState((s) => ({ ...s, pipelineStep: "SYNTH" }));
          const finalStyle = preferences.style;
          const art = await generateArtImage(finalStyle, contentPackage.visualPrompt);

          setPreferences((p) => ({
            ...p,
            subject: contentPackage.visualPrompt,
            narrativeLens: contentPackage.theme.narrativeLens,
          }));

          setState((s) => ({
            ...s,
            imageUrl: art.imageUrl,
            storyArc: contentPackage.storyArc,
            docSnippets: [],
            isGenerating: false,
            pipelineStep: "METADATA",
          }));

          setIsMetadataLoading(true);
          setMetadata(contentPackage.metadata);
          setIsMetadataLoading(false);

          setState((s) => ({ ...s, pipelineStep: "THUMBNAIL" }));
          setState((s) => ({ ...s, pipelineStep: "IDLE" }));
        }
      } catch (e) {
        console.error("Pipeline error:", e);
        setState((s) => ({
          ...s,
          isAutoMode: false,
          isGenerating: false,
          pipelineStep: "IDLE",
          error: "Neural Engine Sync Error",
        }));
      }
    },
    [preferences, state.isAutoMode, onAddCloudTrack, setActiveTrackName, setPreferences, fetchAudioBlob]
  );

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
              // Queue mطابق AUTO_PILOT_STRATEGY.md v6.0
              { duration: 0.5, source: "VIRAL", pieceCount: 100 },    // 30s - Hook & Fast Reveal
              { duration: 0.75, source: "VIRAL", pieceCount: 300 },   // 45s - Retention Test
              { duration: 1.0, source: "VIRAL", pieceCount: 500 },    // 60s - Full Engagement
              { duration: 1.5, source: "VIRAL", pieceCount: 2000 },   // 90s - Deep Dive
              { duration: 1.0, source: "BREAKING", pieceCount: 500 }, // 60s - Trending & Timely
              { duration: 1.0, source: "NARRATIVE", pieceCount: 900 },// 60s - High Detail Finale
            ]
          : s.queue,
        currentQueueIdx: active ? 0 : s.currentQueueIdx,
      };
    });
  }, []);

  useEffect(() => {
    if (state.isAutoMode && state.pipelineStep === "IDLE" && state.currentQueueIdx !== -1) {
      processPipelineItem(state.queue[state.currentQueueIdx], false);
    }
  }, [state.isAutoMode, state.pipelineStep, state.currentQueueIdx, processPipelineItem]);

  return {
    state,
    setState,
    metadata,
    isMetadataLoading,
    thumbnailDataUrl,
    setThumbnailDataUrl,
    setLastVideoBlob,
    processPipelineItem,
    toggleAutoMode,
  };
};
