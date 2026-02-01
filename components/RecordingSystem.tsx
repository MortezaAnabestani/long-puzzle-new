import React, { useEffect, useRef } from "react";
import { YouTubeMetadata } from "../services/geminiService";
import { sonicEngine } from "../services/proceduralAudio";

interface RecordingSystemProps {
  isRecording: boolean;
  getCanvas: () => HTMLCanvasElement | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  metadata: YouTubeMetadata | null;
  durationMinutes: number;
  onRecordingComplete: (blob: Blob) => void;
}

const RecordingSystem: React.FC<RecordingSystemProps> = ({
  isRecording,
  getCanvas,
  audioRef,
  metadata,
  durationMinutes,
  onRecordingComplete,
}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const streamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const currentMimeType = useRef<string>("");

  const initAudioGraph = () => {
    const audioEl = audioRef.current;
    if (!audioEl) return null;

    const ctx = sonicEngine.getContext();
    if (!ctx) return null;

    try {
      // CRITICAL FIX: Check if audio element has a valid source before creating source node
      if (!audioEl.src && !audioEl.currentSrc) {
        console.warn(`⚠️ [AudioGraph] No audio source available, skipping audio graph setup`);
        // Return empty audio stream instead of null to avoid breaking the recorder
        const emptyDest = ctx.createMediaStreamDestination();
        return emptyDest.stream;
      }

      // ایجاد سورس صوتی (فقط یکبار برای هر المنت در طول چرخه حیات)
      if (!sourceNodeRef.current) {
        console.log(`🔊 [AudioGraph] Creating MediaElementAudioSourceNode...`);
        try {
          sourceNodeRef.current = ctx.createMediaElementSource(audioEl);
          console.log(`✅ [AudioGraph] Source node created successfully`);
        } catch (e) {
          console.error(`❌ [AudioGraph] Failed to create source node:`, e);
          // If we can't create source node, return empty stream
          const emptyDest = ctx.createMediaStreamDestination();
          return emptyDest.stream;
        }
      }

      // ایجاد مقصد استریم برای ضبط
      if (!streamDestRef.current) {
        streamDestRef.current = ctx.createMediaStreamDestination();
      }

      // ایجاد کنترلر ولوم (Gain)
      if (!musicGainRef.current) {
        musicGainRef.current = ctx.createGain();
      }

      const musicSource = sourceNodeRef.current;
      const musicGain = musicGainRef.current;
      const dest = streamDestRef.current;

      // قطع اتصالات قبلی به صورت ایمن (جلوگیری از خطای Not Connected)
      try {
        musicSource.disconnect();
      } catch (e) {
        // اگر متصل نباشد، نادیده می‌گیریم
      }

      // برقراری اتصالات گراف صوتی
      musicSource.connect(musicGain);
      musicGain.connect(ctx.destination); // برای شنیدن صدا از اسپیکر
      musicGain.connect(dest); // برای ارسال به ریکوردر

      console.log(`🎵 [AudioGraph] Audio routing complete: audio → gain → [speakers + recorder]`);

      // اتصال افکت‌های صوتی سیستم (SFX) به ضبط
      const sfxGain = sonicEngine.getMasterGain();
      if (sfxGain) {
        try {
          sfxGain.disconnect(dest);
        } catch (e) {}
        sfxGain.connect(dest);
        console.log(`🔊 [AudioGraph] SFX routing complete: sfx → recorder`);
      }

      return dest.stream;
    } catch (e) {
      console.error("Critical Audio Graph Error:", e);
      // در صورت بروز خطا، حداقل استریم مقصد را برمی‌گردانیم تا ریکورد کلا متوقف نشود
      return streamDestRef.current?.stream || null;
    }
  };

  // Reset audio source node when audio source changes (important for Auto Mode with different tracks)
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const handleLoadStart = () => {
      console.log(`🔄 [RecordingSystem] Audio source changing, resetting source node...`);
      // Disconnect old source node safely
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
        sourceNodeRef.current = null;
        console.log(`✅ [RecordingSystem] Source node reset complete`);
      }
    };

    audioEl.addEventListener('loadstart', handleLoadStart);
    return () => {
      audioEl.removeEventListener('loadstart', handleLoadStart);
    };
  }, [audioRef]);

  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isRecording]);

  const startRecording = async () => {
    const canvas = getCanvas();
    const audioEl = audioRef.current;

    console.log(`🎬 [RecordingSystem] Starting recording...`);
    console.log(`   Canvas: ${canvas ? "OK" : "MISSING"}`);
    console.log(`   Audio Element: ${audioEl ? "OK" : "MISSING"}`);

    if (!canvas || !audioEl) {
      console.error(`❌ [RecordingSystem] Cannot start - missing ${!canvas ? "canvas" : "audio element"}`);
      return;
    }

    console.log(`   Audio src: "${audioEl.src || "EMPTY"}"`);
    console.log(`   Audio currentSrc: "${audioEl.currentSrc || "EMPTY"}"`);
    console.log(`   Audio readyState: ${audioEl.readyState}`);

    try {
      const ctx = sonicEngine.getContext();
      if (ctx && ctx.state === "suspended") {
        console.log(`   Resuming suspended audio context...`);
        await ctx.resume();
      }

      // CRITICAL FIX: Wait for audio to be ready before recording
      if (audioEl.src || audioEl.currentSrc) {
        if (audioEl.readyState < 3) {
          console.log(
            `⏳ [RecordingSystem] Waiting for audio to load (readyState: ${audioEl.readyState})...`
          );

          // Try to trigger loading by playing then pausing
          try {
            const playPromise = audioEl.play();
            if (playPromise) {
              await playPromise.catch(() => {});
              audioEl.pause();
              audioEl.currentTime = 0;
            }
          } catch (e) {
            console.warn(`⚠️ Could not pre-play audio:`, e);
          }

          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
              console.warn(`⚠️ [RecordingSystem] Audio loading timeout - proceeding anyway`);
              resolve(); // Don't reject, just proceed
            }, 5000); // Reduced timeout to 5s

            const onCanPlay = () => {
              clearTimeout(timeout);
              audioEl.removeEventListener("canplay", onCanPlay);
              audioEl.removeEventListener("error", onError);
              audioEl.removeEventListener("loadeddata", onLoadedData);
              console.log(`✅ [RecordingSystem] Audio ready! (readyState: ${audioEl.readyState})`);
              resolve();
            };

            const onLoadedData = () => {
              clearTimeout(timeout);
              audioEl.removeEventListener("canplay", onCanPlay);
              audioEl.removeEventListener("error", onError);
              audioEl.removeEventListener("loadeddata", onLoadedData);
              console.log(`✅ [RecordingSystem] Audio data loaded! (readyState: ${audioEl.readyState})`);
              resolve();
            };

            const onError = (e: Event) => {
              clearTimeout(timeout);
              audioEl.removeEventListener("canplay", onCanPlay);
              audioEl.removeEventListener("error", onError);
              audioEl.removeEventListener("loadeddata", onLoadedData);
              console.error(`❌ [RecordingSystem] Audio load error:`, e);
              console.warn(`⚠️ Proceeding with recording despite audio error`);
              resolve(); // Don't reject - proceed with video-only recording
            };

            if (audioEl.readyState >= 2) {
              clearTimeout(timeout);
              resolve();
            } else {
              audioEl.addEventListener("canplay", onCanPlay);
              audioEl.addEventListener("loadeddata", onLoadedData);
              audioEl.addEventListener("error", onError);
            }
          });
        } else {
          console.log(`✅ [RecordingSystem] Audio already ready (readyState: ${audioEl.readyState})`);
        }
      } else {
        console.warn(`⚠️ [RecordingSystem] No audio source available - recording video only`);
      }

      // CRITICAL FIX: Start playing audio BEFORE initializing audio graph
      // This ensures the audio element is actively playing when we capture its stream
      if (audioEl.src || audioEl.currentSrc) {
        console.log(`   🎵 Starting audio playback BEFORE recording...`);
        try {
          await audioEl.play();
          console.log(`   ✅ Audio playing successfully (paused: ${audioEl.paused}, volume: ${audioEl.volume})`);

          // Wait a brief moment for audio to stabilize
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) {
          console.error(`   ❌ Audio playback failed:`, e);
          console.warn(`   ⚠️ Continuing without audio...`);
        }
      } else {
        console.warn(`   ⚠️ No audio source - recording video only`);
      }

      const audioStream = initAudioGraph();
      if (!audioStream) {
        console.error(`❌ [RecordingSystem] Could not initialize audio stream`);
        throw new Error("Could not initialize audio stream");
      }

      console.log(`   Audio stream tracks: ${audioStream.getAudioTracks().length}`);

      // شروع ملایم صدا
      if (musicGainRef.current && ctx) {
        musicGainRef.current.gain.setValueAtTime(0, ctx.currentTime);
        musicGainRef.current.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 1.0);
      }

      const videoStream = (canvas as any).captureStream(60);
      const audioTracks = audioStream.getAudioTracks();

      // ترکیب ترک‌های ویدئو و صدا
      const tracks = [...videoStream.getVideoTracks()];
      if (audioTracks.length > 0) tracks.push(audioTracks[0]);

      const combinedStream = new MediaStream(tracks);

      const mimeType =
        ["video/mp4;codecs=avc1", "video/webm;codecs=vp9", "video/webm"].find((t) =>
          MediaRecorder.isTypeSupported(t)
        ) || "video/webm";
      currentMimeType.current = mimeType;

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 25000000,
      });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: currentMimeType.current });
        console.log(
          `📹 [RecordingSystem] Recording stopped! Blob size: ${(finalBlob.size / 1024 / 1024).toFixed(2)}MB`
        );
        console.log(`   Chunks collected: ${chunksRef.current.length}`);
        console.log(`   MIME type: ${currentMimeType.current}`);
        console.log(`   Calling onRecordingComplete with blob...`);

        // CRITICAL: Verify blob is valid
        if (finalBlob.size === 0) {
          console.error(`❌ [RecordingSystem] FATAL: Blob is empty! No data was recorded!`);
        } else {
          console.log(`✅ [RecordingSystem] Blob is valid, calling callback...`);
        }

        onRecordingComplete(finalBlob);
        console.log(`✅ [RecordingSystem] onRecordingComplete called successfully`);
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
    } catch (e) {
      console.error("Recording Engine Failure:", e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      const ctx = sonicEngine.getContext();

      // فید-اوت سریع صدا در انتهای ویدئو
      if (musicGainRef.current && ctx) {
        musicGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      }

      // توقف ریکوردر بعد از نیم ثانیه فید-اوت
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      }, 500);
    }
  };

  return null;
};

export default RecordingSystem;
