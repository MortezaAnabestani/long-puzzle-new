
import React, { useRef, useState, useCallback } from 'react';

export const useMediaRecorder = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  audioRef: React.RefObject<HTMLAudioElement | null>
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
        const audioStream = (audioRef.current as any).captureStream ?
                           (audioRef.current as any).captureStream() :
                           (audioRef.current as any).mozCaptureStream ?
                           (audioRef.current as any).mozCaptureStream() : null;

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
      'video/mp4;codecs=avc1,mp4a.40.2', // H.264 + AAC (Standard MP4)
      'video/mp4;codecs=avc1',           // H.264 only
      'video/mp4',                       // MP4 Container
      'video/webm;codecs=vp9,opus'       // Fallback to WebM
    ];

    const selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: selectedMimeType,
      videoBitsPerSecond: 50000000 // 50Mbps for High Quality
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const isMp4 = selectedMimeType.includes('mp4');
      const extension = isMp4 ? 'mp4' : 'webm';
      const blob = new Blob(chunksRef.current, { type: selectedMimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `ShortPuzzleMaker-Studio-${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      chunksRef.current = [];
    };

    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  }, [canvasRef, audioRef]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  return { isRecording, startRecording, stopRecording };
};
