import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { PieceShape, PieceMaterial, MovementType, PuzzleBackground } from "../types";
import { usePuzzleLogic } from "../hooks/usePuzzleLogic";
import { renderPuzzleFrame } from "../utils/puzzleRenderer";
import {
  FINALE_PAUSE,
  WAVE_DURATION,
  TOTAL_FINALE_DURATION,
  COLLAPSE_START_TIME,
  logFinaleTimeline,
} from "../utils/finaleManager";
import { sonicEngine } from "../services/proceduralAudio";
import { clearAllTrails } from "../utils/trailEffects";
import PuzzleOverlay from "./puzzle/PuzzleOverlay";
import { transitionEngine } from "../utils/transitions/transitionEngine";
import { renderTransition } from "../utils/transitions/transitionRenderer";

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
  isPaused: boolean; // ✅ NEW: for 1.5s pause after completion
  onFinished: () => void;
  onFinaleComplete: () => void; // ✅ NEW: callback بعد از اتمام کامل finale
  onTransitionComplete: () => void;
  onToggleSolve: () => void;
  narrativeText: string;
  showDocumentaryTips?: boolean;
  isLastChapter: boolean;
  isTransitioning: boolean;
  totalDurationMinutes?: number;
  currentChapterIndex?: number;
  completedPuzzleSnapshots?: HTMLImageElement[];
}

export interface CanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

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
      isPaused,
      onFinished,
      onFinaleComplete,
      onTransitionComplete,
      onToggleSolve,
      narrativeText,
      showDocumentaryTips = false,
      isLastChapter,
      isTransitioning,
      completedPuzzleSnapshots,
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [buildProgress, setBuildProgress] = useState(0);

    const vWidth = 1080;
    const vHeight = 2280;

    const { piecesRef, imageRef, createPieces } = usePuzzleLogic();
    const animationRef = useRef<number>(0);
    const startTimeRef = useRef<number | null>(null);
    const lastElapsedRef = useRef<number>(0); // ✅ Track elapsed time for pause/resume

    // Transition
    const transitionCleanupRef = useRef<(() => void) | null>(null);
    const isTransitioningRef = useRef(false);
    const transitionCallbackFiredRef = useRef(false);

    // Physics (last chapter only)
    const engineRef = useRef<any>(null);
    const bodiesRef = useRef<Map<number, any>>(new Map());
    const isPhysicsActiveRef = useRef(false);

    // Audio
    const wavePlayedRef = useRef(false);
    const destructionPlayedRef = useRef(false);
    const lastIntervalRef = useRef<number>(-1);
    const snapTimeoutRef = useRef<number | null>(null);

    // Flags
    const puzzleFinishedCalledRef = useRef(false);
    const finaleCompleteCalledRef = useRef(false); // ✅ NEW: track finale complete callback
    const physicsActivatedRef = useRef(false); // ✅ NEW: track physics activation for collapse
    const warmupCompleteRef = useRef(false);
    const logoImgRef = useRef<HTMLImageElement | null>(null);

    useImperativeHandle(ref, () => ({ getCanvas: () => canvasRef.current }));
    const getMatter = useCallback(() => (window as any).Matter, []);

    // ─── CANVAS MOUNT DETECTION ─────────────────────────────────────
    useEffect(() => {
      if (canvasRef.current) {
        console.log(`🎨 [PuzzleCanvas] Canvas element mounted! (${vWidth}x${vHeight})`);
      } else {
        console.log(`⚠️ [PuzzleCanvas] Canvas element is null on mount!`);
      }
    }, []); // Run once on mount

    // ─── LOGO ───────────────────────────────────────────────────────
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

    // ─── PHYSICS INIT ───────────────────────────────────────────────
    const initPhysics = useCallback(() => {
      const Matter = getMatter();
      if (!Matter) return;

      if (engineRef.current) {
        Matter.World.clear(engineRef.current.world, false);
        Matter.Engine.clear(engineRef.current);
        engineRef.current = null;
      }

      const engine = Matter.Engine.create({ gravity: { x: 0, y: 0 } });

      if (isLastChapter) {
        engine.world.gravity.y = 2.0;
        const ground = Matter.Bodies.rectangle(vWidth / 2, vHeight + 500, vWidth * 10, 1000, {
          isStatic: true,
        });
        Matter.World.add(engine.world, [ground]);
      }

      engineRef.current = engine;
      console.log(`✅ [Canvas] Physics initialized (isLastChapter: ${isLastChapter})`);
    }, [getMatter, vWidth, vHeight, isLastChapter]);

    // ─── PHYSICS ACTIVATE (last chapter only) ───────────────────────
    const activatePhysics = useCallback(() => {
      const Matter = getMatter();
      if (!engineRef.current || isPhysicsActiveRef.current || !Matter) return;

      isPhysicsActiveRef.current = true;

      // 💥 Play explosion sound for dramatic effect
      if (!destructionPlayedRef.current) {
        sonicEngine.play("DESTRUCT", 1.5); // Louder for explosion
        destructionPlayedRef.current = true;
      }

      // ✅ Use ALL pieces for realistic collapse
      const allPieces = piecesRef.current;

      const bodies: any[] = [];
      allPieces.forEach((p) => {
        // Create physics body for each piece
        const body = Matter.Bodies.rectangle(p.tx + p.pw / 2, p.ty + p.ph / 2, p.pw, p.ph, {
          restitution: 0.3, // ✅ کاهش bouncy برای collapse واقعی‌تر
          friction: 0.5, // ✅ افزایش friction برای سقوط ملایم‌تر
          density: 0.0008, // ✅ قطعات سبک‌تر
          angle: (Math.random() - 0.5) * 0.5, // ✅ چرخش ملایم‌تر
        });

        // 💥 GENTLE COLLAPSE: نیروی خفیف برای جدا کردن قطعات
        const dx = p.tx + p.pw / 2 - vWidth / 2;
        const dy = p.ty + p.ph / 2 - vHeight / 2;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // ✅ انفجار بسیار ملایم - فقط برای جدا کردن قطعات
        const explosionStrength = 0.08 + Math.random() * 0.06; // ✅ کاهش از 0.35-0.6 به 0.08-0.14
        Matter.Body.applyForce(body, body.position, {
          x: (dx / dist) * explosionStrength,
          y: (dy / dist) * explosionStrength + 0.02, // ✅ فقط کمی به پایین
        });

        // ✅ چرخش خیلی ملایم در حین سقوط
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.12);

        bodies.push(body);
        bodiesRef.current.set(p.id, body);
      });

      Matter.World.add(engineRef.current.world, bodies);
      console.log(`💥 [Physics] ${bodies.length} pieces exploding and collapsing to ground`);
    }, [piecesRef, getMatter, vWidth, vHeight]);

    // ─── CLEANUP ────────────────────────────────────────────────────
    const cleanupChapter = useCallback(() => {
      const Matter = getMatter();
      console.log("🧹 [Canvas] Cleanup");

      clearAllTrails();

      if (transitionCleanupRef.current) {
        transitionCleanupRef.current();
        transitionCleanupRef.current = null;
      }
      transitionEngine.cleanup();
      isTransitioningRef.current = false;
      transitionCallbackFiredRef.current = false;
      puzzleFinishedCalledRef.current = false;
      finaleCompleteCalledRef.current = false; // ✅ reset finale complete callback flag
      physicsActivatedRef.current = false; // ✅ reset physics activation flag

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

    // ─── IMAGE LOADER ───────────────────────────────────────────────
    useEffect(() => {
      if (!imageUrl) return;

      console.log(`🔄 [Canvas] Loading: ${imageUrl.substring(0, 40)}...`);

      cleanupChapter();
      setIsReady(false);
      setBuildProgress(0);
      startTimeRef.current = null;
      wavePlayedRef.current = false;
      destructionPlayedRef.current = false;
      lastIntervalRef.current = -1;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = async () => {
        console.log(`🖼️ [Canvas] Creating pieces...`);
        await createPieces(img, pieceCount, shape, material, (p) => setBuildProgress(Math.floor(p * 100)));
        setIsReady(true);
        initPhysics();
        console.log(`✅ [Canvas] Ready`);
      };
      img.src = imageUrl;

      return cleanupChapter;
    }, [imageUrl, pieceCount, shape, material, createPieces, initPhysics, cleanupChapter]);

    // ─── WARMUP ─────────────────────────────────────────────────────
    useEffect(() => {
      if (isReady && !warmupCompleteRef.current && piecesRef.current.length > 0) {
        piecesRef.current.sort((a, b) => a.zOrder - b.zOrder);
        warmupCompleteRef.current = true;
        console.log(`🎨 [Canvas] Warmup done`);
      }
    }, [isReady, piecesRef]);

    // ─── ✅ WATCH TRANSITION STATE ──────────────────────────────────
    useEffect(() => {
      console.log(`🎬 [Canvas] isTransitioning changed to: ${isTransitioning}`);

      // ✅ وقتی App میگه ترنزیشن شروع شده
      if (isTransitioning && !isTransitioningRef.current) {
        console.log(`🚀 [Canvas] Starting transition effect...`);
        isTransitioningRef.current = true;
        transitionCallbackFiredRef.current = false;

        // 🔊 پخش صدای ترنزیشن
        if (sonicEngine.hasSound("TRANSITION")) {
          sonicEngine.play("TRANSITION", 0.6);
          console.log(`🔊 [Canvas] Playing TRANSITION sound`);
        }

        if (engineRef.current) {
          const effect = transitionEngine.getRandomEffect();

          transitionCleanupRef.current = transitionEngine.applyTransition(
            piecesRef.current,
            engineRef.current,
            vWidth,
            vHeight,
            effect,
            () => {
              if (transitionCallbackFiredRef.current) {
                console.warn(`⚠️ [Canvas] Callback already fired`);
                return;
              }

              transitionCallbackFiredRef.current = true;
              console.log(`✅ [Canvas] Transition done - calling onTransitionComplete`);

              // ✅ کمی تاخیر برای اطمینان از render آخر
              setTimeout(() => {
                isTransitioningRef.current = false;
                onTransitionComplete();
              }, 100);
            },
          );
        }
      }
    }, [isTransitioning, vWidth, vHeight, onTransitionComplete, piecesRef]);

    // ─── RENDER LOOP ────────────────────────────────────────────────
    const loop = useCallback(
      (now: number) => {
        if (!isSolving || !isReady || !imageRef.current) {
          if (!isSolving) startTimeRef.current = null;
          return;
        }

        if (startTimeRef.current === null) {
          startTimeRef.current = now;
          console.log(`⏱️ [Canvas] Timer started`);
        }

        // ✅ PAUSE HANDLING: Freeze time when isPaused is true
        if (isPaused) {
          // Move startTime forward to freeze elapsed time
          startTimeRef.current = now - (lastElapsedRef.current || 0);
          animationRef.current = requestAnimationFrame(loop);
          return; // Skip this frame but keep loop running
        }

        const totalDuration = durationMinutes * 60 * 1000;
        const elapsed = now - startTimeRef.current;
        lastElapsedRef.current = elapsed; // Track for pause resume

        // Audio (before transition)
        if (elapsed < totalDuration && !isTransitioningRef.current) {
          const interval = 4000;
          const current = Math.floor(elapsed / interval);
          if (current > lastIntervalRef.current) {
            lastIntervalRef.current = current;
            sonicEngine.play("MOVE", 1.0);
            if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
            snapTimeoutRef.current = window.setTimeout(() => sonicEngine.play("SNAP", 2.0), 600);
          }
        }

        // ✅ PUZZLE COMPLETE → onFinished (فقط یک بار)
        // For last chapter: call onFinished IMMEDIATELY to capture snapshot
        // Then finale sequence will continue automatically
        if (elapsed >= totalDuration && !puzzleFinishedCalledRef.current) {
          puzzleFinishedCalledRef.current = true;
          console.log(`🏁 [Canvas] Puzzle finished - calling onFinished (isLastChapter: ${isLastChapter})`);
          onFinished();
        }

        // ✅ Last chapter finale - Simple wave + collapse + slideshow + outro
        if (isLastChapter) {
          const afterFinish = Math.max(0, elapsed - totalDuration);

          // Log finale timeline on first entry
          if (afterFinish === 0 && !wavePlayedRef.current) {
            console.log(`🎬 [Canvas] Starting finale sequence`);
            logFinaleTimeline();
          }

          // ✅ WAVE: starts after FINALE_PAUSE
          if (afterFinish > FINALE_PAUSE && !wavePlayedRef.current) {
            sonicEngine.play("WAVE", 2.5);
            wavePlayedRef.current = true;
            console.log(`🌊 [Canvas] Wave sound triggered at ${afterFinish.toFixed(0)}ms`);
          }

          // 💥 PHYSICS COLLAPSE: starts after wave ends
          if (afterFinish >= COLLAPSE_START_TIME && !physicsActivatedRef.current) {
            physicsActivatedRef.current = true;
            activatePhysics();
            sonicEngine.play("DESTRUCT", 1.5);
            console.log(`💥 [Canvas] Physics collapse activated at ${afterFinish.toFixed(0)}ms`);
          }

          // Continue rendering - slideshow & outro handled in renderer
        }

        // Physics update
        let physicsPieces = new Map();
        const Matter = getMatter();

        if (isPhysicsActiveRef.current && engineRef.current && Matter) {
          Matter.Engine.update(engineRef.current, 16.666);
          bodiesRef.current.forEach((body: any, id: number) => {
            physicsPieces.set(id, {
              x: body.position.x,
              y: body.position.y,
              angle: body.angle,
            });
          });
        }

        // Transition progress
        let transProgress = 0;
        let transType: string | null = null;
        if (isTransitioningRef.current) {
          transProgress = transitionEngine.getTransitionProgress();
          transType = transitionEngine.getTransitionType();
        }

        // ✅ RENDER
        const ctx = canvasRef.current?.getContext("2d", { alpha: false });
        if (ctx) {
          if (isTransitioningRef.current && transType) {
            // ✅ TRANSITION RENDER با قطعات کامل
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, vWidth, vHeight);

            // ✅ آماده‌سازی داده قطعات برای renderer
            const piecesWithImage = piecesRef.current.map((p) => ({
              ...p,
              img: imageRef.current, // ✅ اضافه کردن reference به تصویر اصلی
            }));

            renderTransition(
              ctx,
              transType,
              transProgress,
              vWidth,
              vHeight,
              engineRef.current,
              piecesWithImage, // ✅ پاس دادن قطعات با تصویر
            );
          } else {
            // Normal render
            renderPuzzleFrame({
              ctx,
              img: imageRef.current,
              pieces: piecesRef.current,
              elapsed,
              totalDuration,
              shape,
              movement,
              background,
              particles: [],
              physicsPieces: physicsPieces.size > 0 ? physicsPieces : undefined,
              narrativeText: showDocumentaryTips ? narrativeText : "",
              channelLogo: logoImgRef.current || undefined,
              completedPuzzleSnapshots: isLastChapter ? completedPuzzleSnapshots : undefined,
            });
          }

          // Progress
          if (!isTransitioningRef.current) {
            const prog = (Math.min(elapsed, totalDuration) / totalDuration) * 100;
            onProgress(prog);
          }
        }

        // ✅ CHECK FINALE COMPLETION (AFTER render to allow slideshow & outro to display)
        if (isLastChapter) {
          const afterFinish = Math.max(0, elapsed - totalDuration);

          if (afterFinish >= TOTAL_FINALE_DURATION) {
            // ✅ Call onFinaleComplete to stop recording and trigger video save
            if (!finaleCompleteCalledRef.current) {
              finaleCompleteCalledRef.current = true;
              console.log(
                `🎬🏁 [Canvas] FINALE FULLY COMPLETE at ${afterFinish}ms - calling onFinaleComplete to stop recording`,
              );
              console.log(`   Total finale duration: ${TOTAL_FINALE_DURATION}ms`);
              onFinaleComplete();
            }

            // ✅ Stop loop after callback is called
            if (finaleCompleteCalledRef.current) {
              console.log(`🛑 [Canvas] Stopping render loop after finale completion`);
              return; // Stop loop AFTER callback is called
            }
          }
        }

        animationRef.current = requestAnimationFrame(loop);
      },
      [
        isSolving,
        isPaused,
        isReady,
        durationMinutes,
        shape,
        movement,
        background,
        onProgress,
        onFinished,
        onFinaleComplete,
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
      ],
    );

    // ─── LOOP LIFECYCLE ─────────────────────────────────────────────
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

    // ─── RENDER ─────────────────────────────────────────────────────
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
  },
);

PuzzleCanvas.displayName = "PuzzleCanvas";
export default PuzzleCanvas;
