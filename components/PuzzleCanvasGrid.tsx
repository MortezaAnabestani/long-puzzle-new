import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { PieceShape, PieceMaterial, MovementType, PuzzleBackground, Chapter } from "../types";
import { Piece } from "../hooks/usePuzzleLogic";
import { renderPuzzleFrame } from "../utils/puzzleRenderer";
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
const PANEL_WIDTH = CANVAS_WIDTH / GRID_COLS;
const PANEL_HEIGHT = CANVAS_HEIGHT / GRID_ROWS;

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
      isSolving,
      onFinished,
      showDocumentaryTips = false,
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [buildProgress, setBuildProgress] = useState(0);

    // Data برای هر panel: {image, pieces}
    const panelDataRef = useRef<
      Array<{
        image: HTMLImageElement;
        pieces: Piece[];
      }>
    >([]);

    const animationRef = useRef<number>(0);
    const startTimeRef = useRef<number | null>(null);
    const logoImgRef = useRef<HTMLImageElement | null>(null);

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
      console.log(`   - Shape: ${shape}`);
      console.log(`   - Material: ${material}`);
      console.log(`   - Movement: ${movement}`);
      console.log(`   - Piece Count: ${pieceCount}`);

      setIsReady(false);
      setBuildProgress(0);

      let loaded = 0;
      const tempData: Array<{ image: HTMLImageElement; pieces: Piece[] }> = new Array(9);

      chapters.forEach((ch, idx) => {
        if (!ch.imageUrl) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = async () => {
          console.log(`🖼️ Panel ${idx} loading...`);

          // ساخت قطعات با تمام جزئیات
          const pieces = await createPiecesForPanel(
            img,
            pieceCount,
            shape,
            material,
            PANEL_WIDTH,
            PANEL_HEIGHT,
            (p) => {
              const totalProgress = ((loaded + p) / 9) * 100;
              setBuildProgress(Math.floor(totalProgress));
            },
          );

          tempData[idx] = { image: img, pieces };
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
    }, [chapters, pieceCount, shape, material]);

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

      const ground = Matter.Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT + 500, CANVAS_WIDTH * 10, 1000, {
        isStatic: true,
      });
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
          x: (dx / dist) * 0.16 * Math.random(),
          y: (dy / dist) * 0.16 * Math.random() - 0.08,
        });
        bodies.push(body);
        bodiesRef.current.set(p.id, body);
      });

      Matter.World.add(engineRef.current.world, bodies);
      console.log(`💥 Physics activated: ${bodies.length} pieces`);
    }, [getMatter]);

    // ─── CAMERA POSITION ───────────────────────────────────────────
    const getCameraPos = useCallback((elapsedMs: number, panelDurMs: number) => {
      const panelIdx = Math.floor(elapsedMs / panelDurMs);
      const progress = (elapsedMs % panelDurMs) / panelDurMs;

      if (panelIdx >= 9) {
        const last = CAMERA_PATH[8];
        return {
          x: (last % GRID_COLS) * PANEL_WIDTH + PANEL_WIDTH / 2,
          y: Math.floor(last / GRID_COLS) * PANEL_HEIGHT + PANEL_HEIGHT / 2,
          zoom: 1.15,
          idx: 8,
        };
      }

      const curr = CAMERA_PATH[panelIdx];
      const next = CAMERA_PATH[Math.min(panelIdx + 1, 8)];
      const fromCol = curr % GRID_COLS;
      const fromRow = Math.floor(curr / GRID_COLS);
      const toCol = next % GRID_COLS;
      const toRow = Math.floor(next / GRID_COLS);

      const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
      const e = ease(progress);

      return {
        x: (fromCol + (toCol - fromCol) * e) * PANEL_WIDTH + PANEL_WIDTH / 2,
        y: (fromRow + (toRow - fromRow) * e) * PANEL_HEIGHT + PANEL_HEIGHT / 2,
        zoom: 1.15,
        idx: panelIdx,
      };
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
        const cam = getCameraPos(elapsed, panelDur);

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

        if (isPhysicsActiveRef.current && elapsed >= explodeTime + 10000) {
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

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // رندر هر panel با renderPuzzleFrame
        panelDataRef.current.forEach((panel, panelIdx) => {
          const actualIdx = CAMERA_PATH[panelIdx];
          const col = actualIdx % GRID_COLS;
          const row = Math.floor(actualIdx / GRID_COLS);
          const offsetX = col * PANEL_WIDTH;
          const offsetY = row * PANEL_HEIGHT;

          const panelElapsed = Math.max(0, elapsed - panelIdx * panelDur);
          const isActive = panelIdx === cam.idx;

          // Canvas موقت برای panel
          const panelCanvas = document.createElement("canvas");
          panelCanvas.width = PANEL_WIDTH;
          panelCanvas.height = PANEL_HEIGHT;
          const panelCtx = panelCanvas.getContext("2d", { alpha: false })!;

          // 🔥 استفاده کامل از renderPuzzleFrame با تمام features
          renderPuzzleFrame({
            ctx: panelCtx,
            img: panel.image,
            pieces: panel.pieces,
            elapsed: panelElapsed,
            totalDuration: panelDur,
            shape, // 🔥 Shape واقعی
            movement, // 🔥 Movement واقعی (FLIGHT, VORTEX, etc.)
            background, // 🔥 Background واقعی
            particles: [],
            physicsPieces: isPhysicsActiveRef.current ? physicsMap : undefined,
            narrativeText: isActive && showDocumentaryTips ? chapters[panelIdx].narrativeText : "",
            channelLogo: logoImgRef.current || undefined,
          });

          ctx.drawImage(panelCanvas, offsetX, offsetY);
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
        ctx.scale(cam.zoom, cam.zoom);
        ctx.translate(-cam.x, -cam.y);
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();

        onProgress((Math.min(elapsed, totalDur) / totalDur) * 100);

        animationRef.current = requestAnimationFrame(loop);
      },
      [
        isSolving,
        isReady,
        durationPerChapterSeconds,
        shape,
        movement,
        background,
        onProgress,
        onFinished,
        getCameraPos,
        activatePhysics,
        getMatter,
        showDocumentaryTips,
        chapters,
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
