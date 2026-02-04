import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { PieceShape, PieceMaterial, MovementType, PuzzleBackground, StoryArc } from "../types";
import { usePuzzleLogic } from "../hooks/usePuzzleLogic";
import { renderPuzzleFrame } from "../utils/puzzleRenderer";
import { FINALE_PAUSE, WAVE_DURATION } from "../utils/finaleManager";
import { sonicEngine } from "../services/proceduralAudio";
import PuzzleOverlay from "./puzzle/PuzzleOverlay";

// ─── PROPS ────────────────────────────────────────────────────────────

interface PuzzleCanvasProps {
  imageUrl: string | null;
  durationMinutes: number; // فصل فعلی: chapter.durationSeconds / 60
  pieceCount: number; // فصل فعلی: chapter.puzzleConfig.pieceCount
  shape: PieceShape;
  material: PieceMaterial;
  movement: MovementType;
  background: PuzzleBackground;
  topicCategory?: string;
  engagementGifUrl: string | null;
  channelLogoUrl: string | null;
  onProgress: (p: number) => void;
  isSolving: boolean;
  onFinished: () => void; // فصل تموم شد → صدا میشه
  onToggleSolve: () => void;
  docSnippets?: string[];
  storyArc?: StoryArc | null;
  showDocumentaryTips?: boolean;
  isLastChapter: boolean; // آخرین فصل؟ → FINALE پخش میشه یا نه
}

export interface CanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

// ─── COMPONENT ────────────────────────────────────────────────────────

const PuzzleCanvas = forwardRef<CanvasHandle, PuzzleCanvasProps>(
  (
    {
      imageUrl,
      durationMinutes,
      pieceCount,
      shape,
      material,
      movement,
      background,
      topicCategory,
      engagementGifUrl,
      channelLogoUrl,
      onProgress,
      isSolving,
      onFinished,
      onToggleSolve,
      docSnippets = [],
      storyArc = null,
      showDocumentaryTips = false,
      isLastChapter,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [buildProgress, setBuildProgress] = useState(0);

    const vWidth = 1080;
    const vHeight = 2280;

    const { piecesRef, imageRef, createPieces } = usePuzzleLogic();
    const animationRef = useRef<number>(0);
    const startTimeRef = useRef<number | null>(null);

    // ─── physics (فقط آخرین فصل) ─────────────────────────────────────
    const engineRef = useRef<any>(null);
    const bodiesRef = useRef<Map<number, any>>(new Map());
    const isPhysicsActiveRef = useRef(false);

    // ─── صدا و timing refs ───────────────────────────────────────────
    const wavePlayedRef = useRef(false);
    const destructionPlayedRef = useRef(false);
    const lastIntervalRef = useRef<number>(-1);
    const snapTimeoutRef = useRef<number | null>(null);

    // ─── فصل میانی: وقتی progress 100% شد، فوراً onFinished صدا میشه
    const midChapterFinishedRef = useRef(false);

    // ─── channel logo ─────────────────────────────────────────────────
    const logoImgRef = useRef<HTMLImageElement | null>(null);

    useImperativeHandle(ref, () => ({ getCanvas: () => canvasRef.current }));
    const getMatter = useCallback(() => (window as any).Matter, []);

    // ─── LOGO LOADER ──────────────────────────────────────────────────
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

    // ─── PHYSICS INIT (فقط آخرین فصل استفاده میکنه) ──────────────────
    const initPhysics = useCallback(() => {
      const Matter = getMatter();
      if (!Matter) return;
      if (engineRef.current) {
        Matter.World.clear(engineRef.current.world, false);
        Matter.Engine.clear(engineRef.current);
      }
      const engine = Matter.Engine.create();
      engine.world.gravity.y = 2.0;
      const ground = Matter.Bodies.rectangle(vWidth / 2, vHeight + 500, vWidth * 10, 1000, {
        isStatic: true,
      });
      Matter.World.add(engine.world, [ground]);
      engineRef.current = engine;
    }, [getMatter, vHeight]);

    // ─── PHYSICS ACTIVATE (فقط آخرین فصل) ────────────────────────────
    const activatePhysics = useCallback(() => {
      const Matter = getMatter();
      if (!engineRef.current || isPhysicsActiveRef.current || !Matter) return;

      isPhysicsActiveRef.current = true;

      if (!destructionPlayedRef.current) {
        sonicEngine.play("DESTRUCT", 1.0);
        destructionPlayedRef.current = true;
      }

      const remainingPieces = piecesRef.current
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(piecesRef.current.length * 0.7));

      const bodies: any[] = [];
      remainingPieces.forEach((p) => {
        const body = Matter.Bodies.rectangle(p.tx + p.pw / 2, p.ty + p.ph / 2, p.pw, p.ph, {
          restitution: 0.6,
          friction: 0.1,
          angle: (Math.random() - 0.5) * 0.5,
        });
        const dx = p.tx + p.pw / 2 - vWidth / 2;
        const dy = p.ty + p.ph / 2 - vHeight / 2;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        Matter.Body.applyForce(body, body.position, {
          x: (dx / dist) * 0.16 * Math.random(),
          y: (dy / dist) * 0.16 * Math.random() - 0.08,
        });
        bodies.push(body);
        bodiesRef.current.set(p.id, body);
      });
      Matter.World.add(engineRef.current.world, bodies);
      piecesRef.current = remainingPieces;
    }, [piecesRef, getMatter, vWidth, vHeight]);

    // ─── IMAGE LOADER + PIECE BUILDER ─────────────────────────────────
    // وقتی imageUrl تغییر میکنه (فصل جدید شروع شد) → سیستم reset میکنه
    useEffect(() => {
      if (!imageUrl) return;

      // ─── reset کل state فصل قبلی ──────────────────────────────────
      setIsReady(false);
      setBuildProgress(0);
      startTimeRef.current = null;
      wavePlayedRef.current = false;
      destructionPlayedRef.current = false;
      lastIntervalRef.current = -1;
      isPhysicsActiveRef.current = false;
      midChapterFinishedRef.current = false;
      bodiesRef.current.clear();

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = async () => {
        // isShorts حذف شد — فکشن: (img, pieceCount, shape, material, onProgress)
        await createPieces(img, pieceCount, shape, material, (p) => setBuildProgress(Math.floor(p * 100)));
        setIsReady(true);
        if (isLastChapter) initPhysics(); // physics فقط آخرین فصل نیاز داره
      };
      img.src = imageUrl;
    }, [imageUrl, pieceCount, shape, material, createPieces, initPhysics, isLastChapter]);

    // ─── RENDER LOOP ──────────────────────────────────────────────────
    const loop = useCallback(
      (now: number) => {
        if (!isSolving || !isReady || !imageRef.current) {
          if (!isSolving) startTimeRef.current = null;
          return;
        }

        if (startTimeRef.current === null) startTimeRef.current = now;

        const totalDuration = durationMinutes * 60 * 1000; // فصل فعلی طول
        const elapsedSinceStart = now - startTimeRef.current;

        // ─── MOVE + SNAP صدا (هر فصل، نه فقط آخرین) ────────────────
        if (elapsedSinceStart < totalDuration) {
          const intervalMs = 4000;
          const currentInterval = Math.floor(elapsedSinceStart / intervalMs);
          if (currentInterval > lastIntervalRef.current) {
            lastIntervalRef.current = currentInterval;
            sonicEngine.play("MOVE", 1.0);
            if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
            snapTimeoutRef.current = window.setTimeout(() => {
              sonicEngine.play("SNAP", 2.0);
            }, 600);
          }
        }

        // ─── فصل میانی: progress 100% → فوراً onFinished ─────────────
        if (!isLastChapter) {
          if (elapsedSinceStart >= totalDuration && !midChapterFinishedRef.current) {
            midChapterFinishedRef.current = true;
            onProgress(100);
            onFinished();
            return; // loop صدا نکنه دیگه
          }
        }

        // ─── آخرین فصل: FINALE timeline ───────────────────────────────
        if (isLastChapter) {
          const elapsedAfterFinish = Math.max(0, elapsedSinceStart - totalDuration);

          // WAVE صدا
          if (elapsedAfterFinish > FINALE_PAUSE && !wavePlayedRef.current) {
            sonicEngine.play("WAVE", 2.5);
            wavePlayedRef.current = true;
          }

          // physics شروع شه
          const explosionTriggerTime = totalDuration + FINALE_PAUSE + WAVE_DURATION + 1500;
          if (elapsedSinceStart >= explosionTriggerTime && !isPhysicsActiveRef.current) {
            activatePhysics();
          }

          // 10s بعد از physics → تموم
          if (isPhysicsActiveRef.current && elapsedSinceStart >= explosionTriggerTime + 10000) {
            onFinished();
            return;
          }
        }

        // ─── physics update (فقط آخرین فصل) ──────────────────────────
        const physicsPiecesData = new Map();
        const Matter = getMatter();
        if (isPhysicsActiveRef.current && engineRef.current && Matter) {
          Matter.Engine.update(engineRef.current, 16.666);
          bodiesRef.current.forEach((body: any, id: number) => {
            physicsPiecesData.set(id, {
              x: body.position.x,
              y: body.position.y,
              angle: body.angle,
            });
          });
        }

        // ─── DRAW ─────────────────────────────────────────────────────
        const ctx = canvasRef.current?.getContext("2d", { alpha: false });
        if (ctx) {
          renderPuzzleFrame({
            ctx,
            img: imageRef.current,
            pieces: piecesRef.current,
            elapsed: elapsedSinceStart,
            totalDuration,
            shape,
            movement,
            background,
            particles: [],
            physicsPieces: isPhysicsActiveRef.current ? physicsPiecesData : undefined,
            docSnippets: showDocumentaryTips ? docSnippets : [],
            storyArc: showDocumentaryTips ? storyArc || null : null,
            channelLogo: logoImgRef.current || undefined,
          });

          const progressPercent = (Math.min(elapsedSinceStart, totalDuration) / totalDuration) * 100;
          onProgress(progressPercent);
          animationRef.current = requestAnimationFrame(loop);
        }
      },
      [
        isSolving,
        isReady,
        durationMinutes,
        shape,
        movement,
        background,
        onProgress,
        onFinished,
        imageRef,
        piecesRef,
        activatePhysics,
        getMatter,
        docSnippets,
        showDocumentaryTips,
        storyArc,
        isLastChapter,
      ]
    );

    // ─── LOOP LIFECYCLE ───────────────────────────────────────────────
    useEffect(() => {
      if (isSolving && isReady) {
        animationRef.current = requestAnimationFrame(loop);
      } else {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      }
      return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
      };
    }, [isSolving, isReady, loop]);

    // ─── RENDER ───────────────────────────────────────────────────────
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        <PuzzleOverlay
          isLoading={!isReady && !!imageUrl}
          error={null}
          topicCategory={topicCategory}
          buildProgress={buildProgress}
        />
        <canvas
          ref={canvasRef}
          width={vWidth}
          height={vHeight}
          className="block w-full h-full object-contain bg-black"
        />
      </div>
    );
  }
);

PuzzleCanvas.displayName = "PuzzleCanvas";
export default PuzzleCanvas;
