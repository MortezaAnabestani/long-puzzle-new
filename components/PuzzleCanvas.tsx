import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { PieceShape, PieceMaterial, MovementType, PuzzleBackground } from "../types";
import { usePuzzleLogic } from "../hooks/usePuzzleLogic";
import { renderPuzzleFrame } from "../utils/puzzleRenderer";
import { FINALE_PAUSE, WAVE_DURATION } from "../utils/finaleManager";
import { sonicEngine } from "../services/proceduralAudio";
import { clearAllTrails } from "../utils/trailEffects";
import PuzzleOverlay from "./puzzle/PuzzleOverlay";
import { transitionEngine } from "../utils/transitions/transitionEngine";
import { renderTransition } from "../utils/transitions/transitionRenderer";

// ─── PROPS ────────────────────────────────────────────────────────────

interface PuzzleCanvasProps {
  imageUrl: string | null;
  durationMinutes: number;
  pieceCount: number;
  shape: PieceShape;
  material: PieceMaterial;
  movement: MovementType;
  background: PuzzleBackground;
  topicCategory?: string;
  engagementGifUrl: string | null;
  channelLogoUrl: string | null;
  onProgress: (p: number) => void;
  isSolving: boolean;
  onFinished: () => void;
  onToggleSolve: () => void;
  narrativeText: string;
  showDocumentaryTips?: boolean;
  isLastChapter: boolean;
  totalDurationMinutes?: number;
  currentChapterIndex?: number;
  completedPuzzleSnapshots?: HTMLImageElement[];
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
      narrativeText,
      showDocumentaryTips = false,
      isLastChapter,
      completedPuzzleSnapshots,
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

    // ─── TRANSITION SYSTEM REFS ───────────────────────────────────────
    const transitionCleanupRef = useRef<(() => void) | null>(null);
    const isTransitioningRef = useRef(false);

    // ─── physics (فقط آخرین فصل) ─────────────────────────────────────
    const engineRef = useRef<any>(null);
    const bodiesRef = useRef<Map<number, any>>(new Map());
    const isPhysicsActiveRef = useRef(false);

    // ─── صدا و timing refs ───────────────────────────────────────────
    const wavePlayedRef = useRef(false);
    const destructionPlayedRef = useRef(false);
    const lastIntervalRef = useRef<number>(-1);
    const snapTimeoutRef = useRef<number | null>(null);

    // ─── فصل میانی: فلگ برای اینکه ترنزیشن شروع شده
    const transitionStartedRef = useRef(false);

    // ─── Warm-up flag ─────────────────────────────────────────────────
    const warmupCompleteRef = useRef(false);

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

    // ─── PHYSICS INIT (برای هر دو نوع فصل نیاز هست) ───────────────────
    const initPhysics = useCallback(() => {
      const Matter = getMatter();
      if (!Matter) {
        console.warn("⚠️ Matter.js not loaded!");
        return;
      }

      if (engineRef.current) {
        Matter.World.clear(engineRef.current.world, false);
        Matter.Engine.clear(engineRef.current);
        engineRef.current = null;
      }

      // ساخت engine ساده (بدون gravity برای فصل میانی)
      const engine = Matter.Engine.create({
        gravity: { x: 0, y: 0 },
      });

      // فقط برای فصل آخر ground اضافه می‌کنیم
      if (isLastChapter) {
        engine.world.gravity.y = 2.0;
        const ground = Matter.Bodies.rectangle(vWidth / 2, vHeight + 500, vWidth * 10, 1000, {
          isStatic: true,
        });
        Matter.World.add(engine.world, [ground]);
      }

      engineRef.current = engine;
      console.log(`✅ Physics engine initialized (isLastChapter: ${isLastChapter})`);
    }, [getMatter, vWidth, vHeight, isLastChapter]);

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

    // ─── COMPLETE CLEANUP ON CHAPTER CHANGE ──────────────────────────
    const cleanupChapter = useCallback(() => {
      const Matter = getMatter();

      console.log("🧹 Cleaning up chapter...");

      clearAllTrails();

      // ✅ CLEANUP TRANSITION SYSTEM
      if (transitionCleanupRef.current) {
        transitionCleanupRef.current();
        transitionCleanupRef.current = null;
      }
      transitionEngine.cleanup();
      isTransitioningRef.current = false;
      transitionStartedRef.current = false;

      // ✅ CLEANUP PHYSICS ENGINE
      if (engineRef.current && Matter) {
        Matter.World.clear(engineRef.current.world, false);
        Matter.Engine.clear(engineRef.current);
        engineRef.current = null;
      }

      bodiesRef.current.clear();
      isPhysicsActiveRef.current = false;
      warmupCompleteRef.current = false;

      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
        snapTimeoutRef.current = null;
      }
    }, [getMatter]);

    // ─── IMAGE LOADER + PIECE BUILDER ─────────────────────────────────
    useEffect(() => {
      if (!imageUrl) return;

      cleanupChapter();

      setIsReady(false);
      setBuildProgress(0);
      startTimeRef.current = null;
      wavePlayedRef.current = false;
      destructionPlayedRef.current = false;
      lastIntervalRef.current = -1;
      transitionStartedRef.current = false;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = async () => {
        await createPieces(img, pieceCount, shape, material, (p) => setBuildProgress(Math.floor(p * 100)));
        setIsReady(true);

        // ✅ همیشه engine را initialize می‌کنیم (برای transition و physics)
        initPhysics();
      };
      img.src = imageUrl;

      return () => {
        cleanupChapter();
      };
    }, [imageUrl, pieceCount, shape, material, createPieces, initPhysics, cleanupChapter]);

    // ─── WARM-UP PHASE ────────────────────────────────────────────────
    useEffect(() => {
      if (isReady && !warmupCompleteRef.current) {
        if (piecesRef.current.length > 0) {
          piecesRef.current.sort((a, b) => a.zOrder - b.zOrder);
          warmupCompleteRef.current = true;
        }
      }
    }, [isReady, piecesRef]);

    // ─── RENDER LOOP ──────────────────────────────────────────────────
    const loop = useCallback(
      (now: number) => {
        if (!isSolving || !isReady || !imageRef.current) {
          if (!isSolving) startTimeRef.current = null;
          return;
        }

        if (startTimeRef.current === null) startTimeRef.current = now;

        const totalDuration = durationMinutes * 60 * 1000;
        const elapsedSinceStart = now - startTimeRef.current;

        // ─── MOVE + SNAP صدا (هر فصل) ────────────────────────────────
        if (elapsedSinceStart < totalDuration && !isTransitioningRef.current) {
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

        // ─── 🎬 فصل میانی: ترنزیشن حرفه‌ای بدون تأخیر ──────────────────
        if (!isLastChapter) {
          // ✅ بلافاصله پس از رسیدن به 100% ترنزیشن شروع می‌شود
          if (elapsedSinceStart >= totalDuration && !transitionStartedRef.current) {
            transitionStartedRef.current = true;
            isTransitioningRef.current = true;
            onProgress(100);

            console.log("🎬 [PuzzleCanvas] Starting transition immediately...");

            if (engineRef.current) {
              const randomEffect = transitionEngine.getRandomEffect();

              transitionCleanupRef.current = transitionEngine.applyTransition(
                piecesRef.current,
                engineRef.current,
                vWidth,
                vHeight,
                randomEffect,
                () => {
                  console.log("✅ [PuzzleCanvas] Transition complete - loading next puzzle");
                  isTransitioningRef.current = false;
                  onFinished();
                }
              );
            }
          }
        }

        // ─── آخرین فصل: FINALE timeline ───────────────────────────────
        if (isLastChapter) {
          const elapsedAfterFinish = Math.max(0, elapsedSinceStart - totalDuration);

          // ✅ WAVE صدا فقط برای آخرین فصل
          if (elapsedAfterFinish > FINALE_PAUSE && !wavePlayedRef.current) {
            sonicEngine.play("WAVE", 2.5);
            wavePlayedRef.current = true;
          }

          const explosionTriggerTime = totalDuration + FINALE_PAUSE + WAVE_DURATION + 1500;
          if (elapsedSinceStart >= explosionTriggerTime && !isPhysicsActiveRef.current) {
            activatePhysics();
          }

          if (isPhysicsActiveRef.current && elapsedSinceStart >= explosionTriggerTime + 10000) {
            onFinished();
            return;
          }
        }

        // ─── UPDATE PHYSICS & TRANSITION ──────────────────────────────
        let physicsPiecesData = new Map();
        const Matter = getMatter();

        let transitionProgress = 0;
        let transitionType: string | null = null;

        if (isTransitioningRef.current) {
          transitionProgress = transitionEngine.getTransitionProgress();
          transitionType = transitionEngine.getTransitionType();
        } else if (isPhysicsActiveRef.current && engineRef.current && Matter) {
          // Physics فقط برای فصل آخر
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
          // ✅ اگر در حال ترنزیشن: فقط رندر ترنزیشن
          if (isTransitioningRef.current && transitionType && transitionProgress < 1) {
            // پس‌زمینه مشکی
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, vWidth, vHeight);

            // رندر ترنزیشن
            renderTransition(
              ctx,
              transitionType,
              transitionProgress,
              vWidth,
              vHeight,
              engineRef.current,
              piecesRef.current
            );
          } else if (!isTransitioningRef.current) {
            // ✅ رندر عادی پازل (فقط وقتی ترنزیشن فعال نیست)
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
              physicsPieces: physicsPiecesData.size > 0 ? physicsPiecesData : undefined,
              narrativeText: showDocumentaryTips ? narrativeText : "",
              channelLogo: logoImgRef.current || undefined,
              // ✅ فقط فصل آخر اسلایدشو دارد
              completedPuzzleSnapshots: isLastChapter ? completedPuzzleSnapshots : undefined,
            });
          }

          // ✅ Progress فقط قبل از ترنزیشن
          if (!isTransitioningRef.current) {
            const progressPercent = (Math.min(elapsedSinceStart, totalDuration) / totalDuration) * 100;
            onProgress(progressPercent);
          }
        }

        // ✅ همیشه loop ادامه پیدا کند
        animationRef.current = requestAnimationFrame(loop);
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
        narrativeText,
        showDocumentaryTips,
        isLastChapter,
        vWidth,
        vHeight,
        completedPuzzleSnapshots,
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
