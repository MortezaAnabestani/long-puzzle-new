import React, { useRef, useState, useCallback } from "react";

export const useMediaRecorder = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  audioRef: React.RefObject<HTMLAudioElement | null>,
) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Get Video Stream
    const videoStream = (canvas as any).captureStream(60);
    const tracks = [...videoStream.getVideoTracks()];

    // 2. Get Audio Stream from Audio Element
    if (audioRef.current && audioRef.current.src) {
      try {
        // Try to capture audio stream from the audio element
        const audioStream = (audioRef.current as any).captureStream
          ? (audioRef.current as any).captureStream()
          : (audioRef.current as any).mozCaptureStream
            ? (audioRef.current as any).mozCaptureStream()
            : null;

        if (audioStream) {
          const audioTracks = audioStream.getAudioTracks();
          if (audioTracks.length > 0) {
            tracks.push(audioTracks[0]);
            console.log("✅ [Recording] Audio track captured successfully");
          } else {
            console.warn("⚠️ [Recording] No audio tracks found in captured stream");
          }
        } else {
          console.warn("⚠️ [Recording] captureStream not supported, audio will not be recorded");
        }
      } catch (e) {
        console.error("❌ [Recording] Could not capture audio stream:", e);
        console.warn("⚠️ [Recording] This is likely due to CORS. Audio will not be included in recording.");
      }
    } else {
      console.warn("⚠️ [Recording] No audio source available or audio element not loaded");
    }

    // 3. Create Combined Stream
    const combinedStream = new MediaStream(tracks);

    // 4. Select Best Supported MIME Type (Prioritizing MP4/H264/AAC)
    const mimeTypes = [
      "video/mp4;codecs=avc1,mp4a.40.2", // H.264 + AAC (Standard MP4)
      "video/mp4;codecs=avc1", // H.264 only
      "video/mp4", // MP4 Container
      "video/webm;codecs=vp9,opus", // Fallback to WebM
    ];

    const selectedMimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: selectedMimeType,
      videoBitsPerSecond: 50000000, // 50Mbps for High Quality
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        console.log(`📦 [MediaRecorder] Chunk received: ${(e.data.size / 1024).toFixed(2)}KB`);
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const isMp4 = selectedMimeType.includes("mp4");
      const extension = isMp4 ? "mp4" : "webm";
      const blob = new Blob(chunksRef.current, { type: selectedMimeType });
      console.log(
        `📹 [MediaRecorder] Recording complete! Total size: ${(blob.size / 1024 / 1024).toFixed(2)}MB, Chunks: ${chunksRef.current.length}`,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `ShortPuzzleMaker-Studio-${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      chunksRef.current = [];
    };

    // Request data every 100ms for better capture reliability
    recorder.start(100);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  }, [canvasRef, audioRef]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      // Request any remaining data before stopping
      try {
        if (mediaRecorderRef.current.state === "recording") {
          console.log(`🛑 [MediaRecorder] Requesting final data before stop...`);
          mediaRecorderRef.current.requestData();
        }
      } catch (e) {
        console.warn("⚠️ [MediaRecorder] requestData failed:", e);
      }

      // Give a small delay to ensure data is collected
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          console.log(`🛑 [MediaRecorder] Stopping recorder...`);
          mediaRecorderRef.current.stop();
        }
      }, 200);
    }
    setIsRecording(false);
  }, []);

  return { isRecording, startRecording, stopRecording };
};
