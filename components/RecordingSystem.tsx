import React, { useEffect, useRef } from "react";
import { YouTubeMetadata } from "../services/geminiService";
import { sonicEngine } from "../services/proceduralAudio";

interface RecordingSystemProps {
  isRecording: boolean;
  getCanvas: () => HTMLCanvasElement | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  musicBufferRef: React.RefObject<AudioBuffer | null>;
  metadata: YouTubeMetadata | null;
  durationMinutes: number;
  onRecordingComplete: (blob: Blob) => void;
}

const RecordingSystem: React.FC<RecordingSystemProps> = ({
  isRecording,
  getCanvas,
  audioRef,
  musicBufferRef,
  metadata,
  durationMinutes,
  onRecordingComplete,
}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const musicBufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const streamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const currentMimeType = useRef<string>("");

  /** پخش موسیقی از طریق Web Audio API — بدون وابستگی به HTMLAudioElement.play() (مناسب AI Studio و محیط‌های بدون user gesture) */
  const getAudioStreamFromBuffer = (): MediaStream | null => {
    const buffer = musicBufferRef?.current;
    if (!buffer) return null;
    const ctx = sonicEngine.getContext();
    if (!ctx) return null;
    try {
      if (!streamDestRef.current) streamDestRef.current = ctx.createMediaStreamDestination();
      if (!musicGainRef.current) musicGainRef.current = ctx.createGain();
      const dest = streamDestRef.current;
      const musicGain = musicGainRef.current;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(musicGain);
      musicGain.connect(ctx.destination);
      musicGain.connect(dest);
      musicBufferSourceRef.current = source;
      const sfxGain = sonicEngine.getMasterGain();
      if (sfxGain) {
        try {
          sfxGain.disconnect(dest);
        } catch (_) {}
        sfxGain.connect(dest);
      }
      source.start(0);
      console.log(`🎵 [AudioGraph] Music playing via AudioBufferSourceNode (Web Audio API)`);
      return dest.stream;
    } catch (e) {
      console.error("AudioBufferSourceNode Error:", e);
      return streamDestRef.current?.stream || null;
    }
  };

  const initAudioGraph = (): MediaStream | null => {
    const audioEl = audioRef.current;
    if (!audioEl) return null;

    const ctx = sonicEngine.getContext();
    if (!ctx) return null;

    try {
      if (!audioEl.src && !audioEl.currentSrc) {
        console.warn(`⚠️ [AudioGraph] No audio source available, skipping audio graph setup`);
        return ctx.createMediaStreamDestination().stream;
      }

      if (!sourceNodeRef.current) {
        console.log(`🔊 [AudioGraph] Creating MediaElementAudioSourceNode...`);
        try {
          sourceNodeRef.current = ctx.createMediaElementSource(audioEl);
        } catch (e) {
          console.error(`❌ [AudioGraph] Failed to create source node:`, e);
          return ctx.createMediaStreamDestination().stream;
        }
      }

      if (!streamDestRef.current) streamDestRef.current = ctx.createMediaStreamDestination();
      if (!musicGainRef.current) musicGainRef.current = ctx.createGain();

      const musicSource = sourceNodeRef.current;
      const musicGain = musicGainRef.current;
      const dest = streamDestRef.current;

      try {
        musicSource.disconnect();
      } catch (_) {}
      musicSource.connect(musicGain);
      musicGain.connect(ctx.destination);
      musicGain.connect(dest);

      const sfxGain = sonicEngine.getMasterGain();
      if (sfxGain) {
        try {
          sfxGain.disconnect(dest);
        } catch (_) {}
        sfxGain.connect(dest);
      }

      console.log(`🎵 [AudioGraph] Audio routing complete: audio → gain → [speakers + recorder]`);
      return dest.stream;
    } catch (e) {
      console.error("Critical Audio Graph Error:", e);
      return streamDestRef.current?.stream || null;
    }
  };

  // NOTE: Do NOT reset MediaElementAudioSourceNode when audio src changes.
  // Web Audio API allows only ONE MediaElementAudioSourceNode per HTMLMediaElement.
  // Creating a second one (after disconnecting the first) breaks playback/recording from video 2 onwards.
  // The same source node continues to output the new audio when the element's src is updated.

  // ✅ Start recording immediately with smart canvas polling
  useEffect(() => {
    if (isRecording) {
      console.log(`🎬 [RecordingSystem] isRecording=true, starting recording process...`);

      // ✅ Use polling to check for canvas availability
      let attempts = 0;
      const maxAttempts = 50; // 50 attempts * 100ms = 5 seconds max wait
      let pollInterval: number | null = null;

      const pollForCanvas = () => {
        const canvas = getCanvas();
        attempts++;

        if (canvas) {
          console.log(`✅ [RecordingSystem] Canvas found after ${attempts} attempts (${attempts * 100}ms)`);
          console.log(`   Canvas size: ${canvas.width}x${canvas.height}`);
          if (pollInterval) clearInterval(pollInterval);
          startRecording();
        } else if (attempts < maxAttempts) {
          if (attempts % 10 === 0 || attempts <= 3) {
            console.log(`⏳ [RecordingSystem] Canvas not ready, attempt ${attempts}/${maxAttempts}...`);
          }
        } else {
          console.error(
            `❌ [RecordingSystem] Canvas not found after ${maxAttempts} attempts (${maxAttempts * 100}ms = 5 seconds)!`,
          );
          console.error(`   Possible reasons:`);
          console.error(`   1. PuzzleCanvas component never mounted (check if imageUrl is set in App.tsx)`);
          console.error(`   2. canvasRef.current is null (check PuzzleCanvas implementation)`);
          console.error(`   3. getCanvas() function is not returning the canvas element`);
          console.error(`   📍 Check CanvasArea.tsx line 108: {imageUrl ? <PuzzleCanvas /> : <Loading />}`);
          if (pollInterval) clearInterval(pollInterval);
        }
      };

      // Try immediately first
      console.log(`🔍 [RecordingSystem] Checking for canvas immediately...`);
      pollForCanvas();

      // If not found, poll every 100ms
      if (!getCanvas()) {
        console.log(`⏳ [RecordingSystem] Canvas not found immediately, starting polling every 100ms...`);
        pollInterval = window.setInterval(pollForCanvas, 100);
      }

      // Cleanup function
      return () => {
        if (pollInterval) {
          console.log(`🧹 [RecordingSystem] Cleanup: Stopping poll interval`);
          clearInterval(pollInterval);
        }
        console.log(`🧹 [RecordingSystem] Cleanup for isRecording=true`);
      };
    } else {
      console.log(`🛑 [RecordingSystem] isRecording=false, stopping...`);
      stopRecording();
    }
  }, [isRecording]);

  const startRecording = async () => {
    // ✅ Prevent starting if already recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log(`⚠️ [RecordingSystem] Already recording, skipping start`);
      return;
    }

    const canvas = getCanvas();
    const audioEl = audioRef.current;
    const useBuffer = !!musicBufferRef?.current;

    console.log(`🎬 [RecordingSystem] Starting recording...`);
    console.log(`   Canvas: ${canvas ? "OK" : "NULL (will record blank until ready)"}`);
    console.log(`   Music source: ${useBuffer ? "AudioBuffer (Web Audio API)" : "HTMLAudioElement"}`);

    // ✅ FIX: Don't fail if canvas is null - it will become available soon
    // MediaRecorder will just record blank frames until canvas starts rendering
    if (!canvas) {
      console.warn(`⚠️ [RecordingSystem] Canvas is null, but continuing anyway...`);
      console.warn(`   Recording will capture blank frames until canvas becomes ready`);
      // We could wait a bit more, but let's proceed - the canvas should exist in DOM
      const retryCanvas = getCanvas();
      if (!retryCanvas) {
        console.error(`❌ [RecordingSystem] Canvas still null after retry, aborting`);
        return;
      }
    }

    if (!useBuffer && !audioEl) {
      console.error(`❌ [RecordingSystem] Cannot start - missing audio element and no music buffer`);
      return;
    }

    try {
      await sonicEngine.unlock();
      const ctx = sonicEngine.getContext();
      if (!ctx) throw new Error("No AudioContext");

      let audioStream: MediaStream | null = null;
      if (useBuffer) {
        audioStream = getAudioStreamFromBuffer();
        console.log(`   🎵 Using pre-decoded AudioBuffer — no HTMLAudioElement.play() needed`);
      } else {
        const hasValidSource =
          audioEl &&
          (audioEl.src || audioEl.currentSrc) &&
          audioEl.src !== "" &&
          audioEl.src !== "about:blank";
        if (hasValidSource) {
          if (audioEl.readyState < 3) {
            await new Promise<void>((resolve) => {
              const t = setTimeout(() => resolve(), 5000);
              const done = () => {
                clearTimeout(t);
                audioEl.removeEventListener("canplay", done);
                audioEl.removeEventListener("error", done);
                resolve();
              };
              audioEl.addEventListener("canplay", done);
              audioEl.addEventListener("error", done);
              if (audioEl.readyState >= 2) resolve();
            });
          }
          try {
            await audioEl.play();
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            if (!msg.includes("supported sources") && !msg.includes("no supported sources")) {
              console.warn(`⚠️ [RecordingSystem] HTMLAudioElement.play() failed:`, e);
            }
          }
          await new Promise((r) => setTimeout(r, 100));
        } else {
          console.log(`   🎵 No valid audio element source — using video-only or buffer path next time`);
        }
        audioStream = initAudioGraph();
      }

      if (!audioStream) {
        console.error(`❌ [RecordingSystem] Could not initialize audio stream`);
        throw new Error("Could not initialize audio stream");
      }

      console.log(`   Audio stream tracks: ${audioStream.getAudioTracks().length}`);

      if (musicGainRef.current && ctx) {
        musicGainRef.current.gain.setValueAtTime(0, ctx.currentTime);
        musicGainRef.current.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 1.0);
      }

      const videoStream = (canvas as any).captureStream(60);
      const audioTracks = audioStream.getAudioTracks();

      const tracks = [...videoStream.getVideoTracks()];
      if (audioTracks.length > 0) tracks.push(audioTracks[0]);

      const combinedStream = new MediaStream(tracks);

      const mimeType =
        ["video/mp4;codecs=avc1", "video/webm;codecs=vp9", "video/webm"].find((t) =>
          MediaRecorder.isTypeSupported(t),
        ) || "video/webm";
      currentMimeType.current = mimeType;

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 25000000,
      });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log(`📦 [RecordingSystem] Chunk received: ${(e.data.size / 1024).toFixed(2)}KB`);
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: currentMimeType.current });
        console.log(
          `📹 [RecordingSystem] Recording stopped! Blob size: ${(finalBlob.size / 1024 / 1024).toFixed(2)}MB`,
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

      // FIX: Request data every 100ms to ensure all data is captured
      // Without timeslice, data is only collected when stop() is called
      recorder.start(100);
      mediaRecorderRef.current = recorder;
    } catch (e) {
      console.error("Recording Engine Failure:", e);
    }
  };

  const stopRecording = () => {
    if (musicBufferSourceRef.current) {
      try {
        musicBufferSourceRef.current.stop();
      } catch (_) {}
      musicBufferSourceRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      const ctx = sonicEngine.getContext();
      if (musicGainRef.current && ctx) {
        musicGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      }

      // Request any remaining data before stopping
      try {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.requestData();
        }
      } catch (e) {
        console.warn("⚠️ [RecordingSystem] requestData failed:", e);
      }

      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          console.log(`🛑 [RecordingSystem] Stopping MediaRecorder...`);
          mediaRecorderRef.current.stop();
        }
      }, 500);
    }
  };

  return null;
};

export default RecordingSystem;
