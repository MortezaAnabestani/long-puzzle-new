import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { PieceShape, PieceMaterial, MovementType, PuzzleBackground, Chapter } from "../types";
import { Piece } from "../hooks/usePuzzleLogic";
import { renderPuzzleFrame } from "../utils/puzzleRenderer";
import { renderOutroCard } from "../utils/outroRenderer";
import { createPiecesForPanel } from "../utils/gridPuzzleCreator";
import { FINALE_PAUSE, WAVE_DURATION } from "../utils/finaleManager";
import { sonicEngine } from "../services/proceduralAudio";
import { clearAllTrails } from "../utils/trailEffects";
import PuzzleOverlay from "./puzzle/PuzzleOverlay";

interface PuzzleCanvasGridProps {
  chapters: Chapter[];
  durationPerChapterSeconds: number;
  pieceCount: number;
  shape: PieceShape;
  material: PieceMaterial;
  movement: MovementType;
  background: PuzzleBackground;
  topicCategory?: string;
  channelLogoUrl: string | null;
  onProgress: (p: number) => void;
  onChapterChange?: (chapterNum: number) => void; // ✅ برای chapter counter
  isSolving: boolean;
  onFinished: () => void;
  showDocumentaryTips?: boolean;
}

export interface CanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const GRID_COLS = 3;
const GRID_ROWS = 3;

// ✅ HIGH RESOLUTION panels برای quality بهتر
const PANEL_WIDTH = 1280; // بجای 640 (2x resolution)
const PANEL_HEIGHT = 720; // بجای 360 (2x resolution)
const PANEL_DISPLAY_WIDTH = CANVAS_WIDTH / GRID_COLS; // 640
const PANEL_DISPLAY_HEIGHT = CANVAS_HEIGHT / GRID_ROWS; // 360

const CAMERA_PATH = [
  0,
  1,
  2, // ردیف 1: چپ→راست
  5,
  4,
  3, // ردیف 2: راست←چپ
  6,
  7,
  8, // ردیف 3: چپ→راست
];

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

const PuzzleCanvasGrid = forwardRef<CanvasHandle, PuzzleCanvasGridProps>(
  (
    {
      chapters,
      durationPerChapterSeconds,
      pieceCount,
      shape,
      material,
      movement,
      background,
      topicCategory,
      channelLogoUrl,
      onProgress,
      onChapterChange,
      isSolving,
      onFinished,
      showDocumentaryTips = false,
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [buildProgress, setBuildProgress] = useState(0);

    // Data برای هر panel: {image, pieces, chapter}
    const panelDataRef = useRef<
      Array<{
        image: HTMLImageElement;
        pieces: Piece[];
        chapter: Chapter;
      }>
    >([]);

    const animationRef = useRef<number>(0);
    const startTimeRef = useRef<number | null>(null);
    const logoImgRef = useRef<HTMLImageElement | null>(null);

    // ─── CAMERA STATE ──────────────────────────────────────────────
    const currentPanelRef = useRef(0);
    const panelStartTimeRef = useRef(0);
    const cameraStateRef = useRef<"active" | "waiting" | "transitioning">("active");
    const transitionStartRef = useRef(0);

    // ✅ Completion tracking برای جلوگیری از پرش زودهنگام
    const panelCompletionRef = useRef<boolean[]>(new Array(9).fill(false));

    // ✅ Camera lerp برای smooth movement
    const currentCamPosRef = useRef({ x: 960, y: 540, zoom: 2.7 });

    // Audio
    const lastIntervalRef = useRef(-1);
    const snapTimeoutRef = useRef<number | null>(null);
    const wavePlayedRef = useRef(false);
    const destructionPlayedRef = useRef(false);

    // Physics
    const engineRef = useRef<any>(null);
    const bodiesRef = useRef<Map<number, any>>(new Map());
    const isPhysicsActiveRef = useRef(false);

    useImperativeHandle(ref, () => ({ getCanvas: () => canvasRef.current }));
    const getMatter = useCallback(() => (window as any).Matter, []);

    // ─── LOGO ──────────────────────────────────────────────────────
    useEffect(() => {
      if (channelLogoUrl) {
        const img = new Image();
        img.src = channelLogoUrl;
        img.onload = () => (logoImgRef.current = img);
      } else {
        logoImgRef.current = null;
      }
    }, [channelLogoUrl]);

    // ─── LOAD 9 PANELS با تمام جزئیات اصلی ────────────────────────
    useEffect(() => {
      if (chapters.length !== 9) {
        console.error("❌ Grid needs exactly 9 chapters");
        return;
      }

      console.log("🔄 Loading 9 panels with FULL features...");

      setIsReady(false);
      setBuildProgress(0);

      let loaded = 0;
      const tempData: Array<{ image: HTMLImageElement; pieces: Piece[]; chapter: Chapter }> = new Array(9);

      chapters.forEach((ch, idx) => {
        if (!ch.imageUrl) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = async () => {
          console.log(`🖼️ Panel ${idx} loading...`);
          console.log(`   - Shape: ${ch.puzzleConfig.shape}`);
          console.log(`   - Material: ${ch.puzzleConfig.material}`);
          console.log(`   - Movement: ${ch.puzzleConfig.movement}`);
          console.log(`   - Pieces: ${ch.puzzleConfig.pieceCount}`);

          // ✅ استفاده از تنظیمات مخصوص این chapter
          const pieces = await createPiecesForPanel(
            img,
            ch.puzzleConfig.pieceCount, // از chapter
            ch.puzzleConfig.shape, // از chapter
            ch.puzzleConfig.material, // از chapter
            PANEL_WIDTH,
            PANEL_HEIGHT,
            (p) => {
              const totalProgress = ((loaded + p) / 9) * 100;
              setBuildProgress(Math.floor(totalProgress));
            },
          );

          tempData[idx] = { image: img, pieces, chapter: ch };
          loaded++;
          console.log(`✅ Panel ${idx} ready: ${pieces.length} pieces`);

          if (loaded === 9) {
            panelDataRef.current = tempData;
            setIsReady(true);
            console.log("🎉 All 9 panels ready with FULL features!");
          }
        };
        img.src = ch.imageUrl;
      });

      return () => {
        clearAllTrails();
      };
    }, [chapters]);

    // ─── PHYSICS INIT ──────────────────────────────────────────────
    const initPhysics = useCallback(() => {
      const Matter = getMatter();
      if (!Matter) return;

      if (engineRef.current) {
        Matter.World.clear(engineRef.current.world, false);
        Matter.Engine.clear(engineRef.current);
      }

      const engine = Matter.Engine.create({ gravity: { x: 0, y: 0 } });
      engine.world.gravity.y = 2.0;

      const ground = Matter.Bodies.rectangle(
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT - 50, // ✅ درست در پایین صفحه
        CANVAS_WIDTH * 3,
        100,
        { isStatic: true },
      );
      Matter.World.add(engine.world, [ground]);
      engineRef.current = engine;
      console.log("✅ Physics ready");
    }, [getMatter]);

    // ─── PHYSICS ACTIVATE ──────────────────────────────────────────
    const activatePhysics = useCallback(() => {
      const Matter = getMatter();
      if (!engineRef.current || isPhysicsActiveRef.current || !Matter) return;

      isPhysicsActiveRef.current = true;
      if (!destructionPlayedRef.current) {
        sonicEngine.play("DESTRUCT", 1.0);
        destructionPlayedRef.current = true;
      }

      const allPieces: Piece[] = [];
      panelDataRef.current.forEach((panel, panelIdx) => {
        const actualIdx = CAMERA_PATH[panelIdx];
        const row = Math.floor(actualIdx / GRID_COLS);
        const col = actualIdx % GRID_COLS;
        const offsetX = col * PANEL_WIDTH;
        const offsetY = row * PANEL_HEIGHT;

        panel.pieces.forEach((p) => {
          allPieces.push({
            ...p,
            tx: p.tx + offsetX,
            ty: p.ty + offsetY,
          });
        });
      });

      const selection = allPieces
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(allPieces.length * 0.7));

      const bodies: any[] = [];
      selection.forEach((p) => {
        const body = Matter.Bodies.rectangle(p.tx + p.pw / 2, p.ty + p.ph / 2, p.pw, p.ph, {
          restitution: 0.6,
          friction: 0.1,
          angle: (Math.random() - 0.5) * 0.5,
        });
        const dx = p.tx + p.pw / 2 - CANVAS_WIDTH / 2;
        const dy = p.ty + p.ph / 2 - CANVAS_HEIGHT / 2;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        Matter.Body.applyForce(body, body.position, {
          x: (dx / dist) * 0.03 * Math.random(), // کاهش از 0.16
          y: (dy / dist) * 0.03 * Math.random() - 0.02, // کاهش از 0.16 و 0.08
        });
        bodies.push(body);
        bodiesRef.current.set(p.id, body);
      });

      Matter.World.add(engineRef.current.world, bodies);
      console.log(`💥 Physics activated: ${bodies.length} pieces`);
    }, [getMatter]);

    // ─── CAMERA STATE MACHINE ──────────────────────────────────────
    const ACTIVE_ZOOM = 2.7; // 1 panel + 10% اطراف
    const TRANSITION_ZOOM = 1.2; // overview برای transition
    const FINAL_ZOOM = 0.95; // کل grid 3×3 (تقریباً تمام صفحه)

    // ✅ Lerp helpers برای smooth movement
    const lerp = useCallback((a: number, b: number, t: number) => a + (b - a) * t, []);
    const easeInOutCubic = useCallback(
      (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
      [],
    );

    const getCameraState = useCallback((elapsed: number, panelDur: number) => {
      const totalDur = panelDur * 9;

      // Final zoom out (بعد از panel 9)
      if (elapsed >= totalDur) {
        const afterComplete = elapsed - totalDur;
        if (afterComplete < 2000) {
          // Wait 2s
          return { x: 960, y: 540, zoom: ACTIVE_ZOOM, panelIdx: 8, state: "waiting" };
        } else if (afterComplete < 5000) {
          // Zoom out to show full grid
          const t = (afterComplete - 2000) / 3000;
          const zoom = ACTIVE_ZOOM - t * (ACTIVE_ZOOM - FINAL_ZOOM); // 0.9 → 0.4
          return { x: 960, y: 540, zoom, panelIdx: 8, state: "final_zoom_out" };
        } else {
          // Hold full grid view
          return { x: 960, y: 540, zoom: FINAL_ZOOM, panelIdx: 8, state: "final_view" };
        }
      }

      const panelIdx = Math.floor(elapsed / panelDur);
      const panelElapsed = elapsed % panelDur;

      if (panelIdx >= 9) {
        return { x: 960, y: 540, zoom: ACTIVE_ZOOM, panelIdx: 8, state: "active" };
      }

      // محاسبه position این panel در grid
      const actualIdx = CAMERA_PATH[panelIdx];
      const col = actualIdx % GRID_COLS;
      const row = Math.floor(actualIdx / GRID_COLS);
      const targetX = col * PANEL_DISPLAY_WIDTH + PANEL_DISPLAY_WIDTH / 2;
      const targetY = row * PANEL_DISPLAY_HEIGHT + PANEL_DISPLAY_HEIGHT / 2;

      // States:
      // 0-45000ms: active (zoom 90%)
      // 45000-47000ms: waiting (zoom 90%, hold)
      // 47000-48000ms: zoom out (90% → 70%)
      // 48000-48500ms: pan to next
      // 48500-49000ms: zoom in (70% → 90%)

      if (panelElapsed < 45000) {
        // Active state
        return { x: targetX, y: targetY, zoom: ACTIVE_ZOOM, panelIdx, state: "active" };
      } else if (panelElapsed < 47000) {
        // Wait 2s
        return { x: targetX, y: targetY, zoom: ACTIVE_ZOOM, panelIdx, state: "waiting" };
      } else if (panelElapsed < 48000) {
        // Zoom out
        const t = (panelElapsed - 47000) / 1000;
        const zoom = ACTIVE_ZOOM - t * (ACTIVE_ZOOM - TRANSITION_ZOOM); // 0.9 → 0.7
        return { x: targetX, y: targetY, zoom, panelIdx, state: "zoom_out" };
      } else if (panelElapsed < 48500) {
        // Pan to next panel
        const nextIdx = Math.min(panelIdx + 1, 8);
        const nextActualIdx = CAMERA_PATH[nextIdx];
        const nextCol = nextActualIdx % GRID_COLS;
        const nextRow = Math.floor(nextActualIdx / GRID_COLS);
        const nextX = nextCol * PANEL_WIDTH + PANEL_WIDTH / 2;
        const nextY = nextRow * PANEL_HEIGHT + PANEL_HEIGHT / 2;

        const t = (panelElapsed - 48000) / 500;
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        return {
          x: targetX + (nextX - targetX) * ease,
          y: targetY + (nextY - targetY) * ease,
          zoom: TRANSITION_ZOOM,
          panelIdx,
          state: "panning",
        };
      } else {
        // Zoom in
        const nextIdx = Math.min(panelIdx + 1, 8);
        const nextActualIdx = CAMERA_PATH[nextIdx];
        const nextCol = nextActualIdx % GRID_COLS;
        const nextRow = Math.floor(nextActualIdx / GRID_COLS);
        const nextX = nextCol * PANEL_WIDTH + PANEL_WIDTH / 2;
        const nextY = nextRow * PANEL_HEIGHT + PANEL_HEIGHT / 2;

        const t = (panelElapsed - 48500) / 500;
        const zoom = TRANSITION_ZOOM + t * (ACTIVE_ZOOM - TRANSITION_ZOOM); // 0.7 → 0.9

        return { x: nextX, y: nextY, zoom, panelIdx, state: "zoom_in" };
      }
    }, []);

    // ═══════════════════════════════════════════════════════════════
    // RENDER LOOP - استفاده از renderPuzzleFrame اصلی
    // ═══════════════════════════════════════════════════════════════
    const loop = useCallback(
      (now: number) => {
        if (!isSolving || !isReady) {
          if (!isSolving) startTimeRef.current = null;
          return;
        }

        if (!startTimeRef.current) {
          startTimeRef.current = now;
          initPhysics();
          console.log("⏱️ Started");
        }

        const elapsed = now - startTimeRef.current;
        const panelDur = durationPerChapterSeconds * 1000;
        const totalDur = panelDur * 9;

        // ─── AUDIO ─────────────────────────────────────────────────
        if (elapsed < totalDur) {
          const interval = 4000;
          const current = Math.floor(elapsed / interval);
          if (current > lastIntervalRef.current) {
            lastIntervalRef.current = current;
            sonicEngine.play("MOVE", 1.0);
            if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
            snapTimeoutRef.current = window.setTimeout(() => sonicEngine.play("SNAP", 2.0), 600);
          }
        }

        // ─── CAMERA ────────────────────────────────────────────────
        const cam = getCameraState(elapsed, panelDur);

        // ✅ Chapter counter update
        const currentChapter = Math.min(cam.panelIdx + 1, 9);
        if (onChapterChange) {
          onChapterChange(currentChapter);
        }

        // ✅ Smooth camera interpolation با lerp
        const LERP_SPEED = 0.12;
        currentCamPosRef.current.x = lerp(currentCamPosRef.current.x, cam.x, LERP_SPEED);
        currentCamPosRef.current.y = lerp(currentCamPosRef.current.y, cam.y, LERP_SPEED);
        currentCamPosRef.current.zoom = lerp(currentCamPosRef.current.zoom, cam.zoom, LERP_SPEED);

        // ─── FINALE ────────────────────────────────────────────────
        const afterFinish = Math.max(0, elapsed - totalDur);
        if (afterFinish > FINALE_PAUSE && !wavePlayedRef.current) {
          sonicEngine.play("WAVE", 2.5);
          wavePlayedRef.current = true;
        }

        const explodeTime = totalDur + FINALE_PAUSE + WAVE_DURATION + 1500;
        if (elapsed >= explodeTime && !isPhysicsActiveRef.current) {
          activatePhysics();
        }

        // ✅ FINISH با debug logging
        const finishTime = explodeTime + 15000; // 15s بعد از physics

        // Debug every 5 seconds
        if (Math.floor(elapsed / 5000) > Math.floor((elapsed - 16.666) / 5000)) {
          console.log(
            `⏱️ Timing: elapsed=${Math.floor(elapsed / 1000)}s, totalDur=${Math.floor(totalDur / 1000)}s, explodeTime=${Math.floor(explodeTime / 1000)}s, finishTime=${Math.floor(finishTime / 1000)}s, isPhysics=${isPhysicsActiveRef.current}`,
          );
        }

        if (isPhysicsActiveRef.current && elapsed >= finishTime) {
          console.log(`🎬 FINISHING VIDEO! elapsed=${elapsed}, finishTime=${finishTime}`);
          onFinished();
          return;
        }

        // ─── PHYSICS ───────────────────────────────────────────────
        const Matter = getMatter();
        const physicsMap = new Map<number, { x: number; y: number; angle: number }>();
        if (isPhysicsActiveRef.current && engineRef.current && Matter) {
          Matter.Engine.update(engineRef.current, 16.666);
          bodiesRef.current.forEach((body, id) => {
            physicsMap.set(id, { x: body.position.x, y: body.position.y, angle: body.angle });
          });
        }

        // ═══════════════════════════════════════════════════════════
        // RENDER با renderPuzzleFrame واقعی
        // ═══════════════════════════════════════════════════════════
        const ctx = canvasRef.current?.getContext("2d", { alpha: false });
        if (!ctx) return;

        // ✅ CLEAR main canvas
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Safety check
        if (!panelDataRef.current || panelDataRef.current.length === 0) {
          console.error("❌ panelDataRef is empty");
          return;
        }

        // رندر panels مرتبط (برای performance)
        const activePanel = cam.panelIdx;

        // ✅ Optimization: فقط active + همسایه‌ها + completed panels
        const shouldRenderPanel = (idx: number) => {
          if (idx < activePanel) return true; // completed panels
          if (idx === activePanel) return true; // active
          if (idx === activePanel + 1) return true; // next (برای smooth transition)
          return false;
        };

        panelDataRef.current.forEach((panel, panelIdx) => {
          if (!panel || !panel.image || !panel.pieces || !panel.chapter) {
            return;
          }

          if (!shouldRenderPanel(panelIdx)) {
            return; // skip این panel
          }

          const actualIdx = CAMERA_PATH[panelIdx];
          const col = actualIdx % GRID_COLS;
          const row = Math.floor(actualIdx / GRID_COLS);
          const offsetX = col * PANEL_DISPLAY_WIDTH; // برای positioning در grid
          const offsetY = row * PANEL_DISPLAY_HEIGHT;

          // محاسبه elapsed برای این panel
          // panel فعلی: از 0 تا totalDuration
          // panels دیگر: 0 (شروع نشده) یا totalDuration (تمام شده)
          let panelElapsed: number;
          if (panelIdx < activePanel) {
            panelElapsed = panelDur; // تمام شده - نمایش completed state
          } else if (panelIdx === activePanel) {
            // محاسبه elapsed واقعی
            const panelStartTime = panelIdx * panelDur; // ✅ استفاده از panelDur
            panelElapsed = Math.max(0, Math.min(elapsed - panelStartTime, panelDur));
          } else {
            panelElapsed = 0; // شروع نشده
          }

          const isActive = panelIdx === activePanel;

          // 🐛 DEBUG: log panel info
          if (panelIdx === 0 || panelIdx === 1) {
            console.log(
              `Panel ${panelIdx}: pieces=${panel.pieces.length}, elapsed=${Math.floor(panelElapsed)}, offsetX=${offsetX}, offsetY=${offsetY}`,
            );
          }

          // Canvas موقت برای panel با HIGH RESOLUTION
          const panelCanvas = document.createElement("canvas");
          panelCanvas.width = PANEL_WIDTH; // 1280 (high res)
          panelCanvas.height = PANEL_HEIGHT; // 720 (high res)
          const panelCtx = panelCanvas.getContext("2d", { alpha: false })!;

          // ✅ High quality rendering
          panelCtx.imageSmoothingEnabled = true;
          panelCtx.imageSmoothingQuality = "high";

          // 🔥 استفاده کامل از renderPuzzleFrame با تمام features
          renderPuzzleFrame({
            ctx: panelCtx,
            img: panel.image,
            pieces: panel.pieces,
            elapsed: panelElapsed,
            totalDuration: panelDur,
            shape: panel.chapter.puzzleConfig.shape,
            movement: panel.chapter.puzzleConfig.movement,
            background,
            particles: [],
            physicsPieces: isPhysicsActiveRef.current ? physicsMap : undefined,
            narrativeText: isActive && showDocumentaryTips ? panel.chapter.narrativeText : "",
            channelLogo: logoImgRef.current || undefined,
            canvasWidth: PANEL_WIDTH,
            canvasHeight: PANEL_HEIGHT,
          });

          // 🐛 DEBUG: بررسی اینکه piece position ها درست هستند
          if (panelIdx <= 1 && Math.random() < 0.01) {
            // فقط 1% frames
            const samplePiece = panel.pieces[0];
            console.log(
              `Panel ${panelIdx}, Piece 0: tx=${samplePiece.tx}, ty=${samplePiece.ty}, cx=${samplePiece.cx}, cy=${samplePiece.cy}`,
            );
          }

          // ✅ Scale down with high quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(
            panelCanvas,
            0,
            0,
            PANEL_WIDTH,
            PANEL_HEIGHT, // source (high res)
            offsetX,
            offsetY,
            PANEL_DISPLAY_WIDTH,
            PANEL_DISPLAY_HEIGHT, // dest (display size)
          );
        });

        // Camera Viewport
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = CANVAS_WIDTH;
        tempCanvas.height = CANVAS_HEIGHT;
        const tempCtx = tempCanvas.getContext("2d")!;
        tempCtx.drawImage(canvasRef.current!, 0, 0);

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.save();
        ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.scale(currentCamPosRef.current.zoom, currentCamPosRef.current.zoom);
        ctx.translate(-currentCamPosRef.current.x, -currentCamPosRef.current.y);
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();

        // ─── OUTRO CARD (فقط در انتهای واقعی) ──────────────────────────
        const showOutro = isPhysicsActiveRef.current && elapsed >= finishTime - 2000; // 2s قبل از finish
        if (showOutro) {
          renderOutroCard({
            ctx,
            vWidth: CANVAS_WIDTH,
            vHeight: CANVAS_HEIGHT,
            elapsedAfterFinish: elapsed - totalDur,
            channelLogo: logoImgRef.current || undefined,
          });
        }

        onProgress((Math.min(elapsed, totalDur) / totalDur) * 100);

        animationRef.current = requestAnimationFrame(loop);
      },
      [
        isSolving,
        isReady,
        durationPerChapterSeconds,
        background,
        onProgress,
        onFinished,
        getCameraState,
        activatePhysics,
        getMatter,
        showDocumentaryTips,
        initPhysics,
      ],
    );

    // ─── LIFECYCLE ─────────────────────────────────────────────────
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

    // ─── RENDER ────────────────────────────────────────────────────
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        <PuzzleOverlay
          isLoading={!isReady}
          error={null}
          topicCategory={topicCategory}
          buildProgress={buildProgress}
        />
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block w-full h-full object-contain bg-black"
        />
      </div>
    );
  },
);

PuzzleCanvasGrid.displayName = "PuzzleCanvasGrid";
export default PuzzleCanvasGrid;
