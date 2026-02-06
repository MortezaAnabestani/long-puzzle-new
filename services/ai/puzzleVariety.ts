/**
 * 🔥 PHASE C: Puzzle Variety Generator
 * Location: src/services/ai/puzzleVariety.ts
 *
 * Creates diverse puzzle configurations for each chapter
 */

import { PieceShape, PieceMaterial, MovementType, ChapterRole, ChapterPuzzleConfig } from "../../types";

// ─── VARIETY POOLS ────────────────────────────────────────────────────

const ALL_SHAPES = [
  PieceShape.SQUARE,
  PieceShape.TRIANGLE,
  PieceShape.HEXAGON,
  PieceShape.DIAMOND,
  PieceShape.BRICK,
  PieceShape.JIGSAW,
];

const ALL_MATERIALS = [
  PieceMaterial.CARDBOARD,
  PieceMaterial.WOOD,
  PieceMaterial.GLASS,
  PieceMaterial.CARBON,
];

const ALL_MOVEMENTS = [
  MovementType.STANDARD,
  MovementType.FLIGHT,
  MovementType.WAVE,
  MovementType.PLAYFUL,
  MovementType.VORTEX,
  MovementType.ELASTIC,
];

// ─── COMPLEXITY-BASED PIECE COUNT ────────────────────────────────────

const PIECE_COUNT_RANGES = {
  easy: { min: 350, max: 450 },
  medium: { min: 450, max: 600 },
  hard: { min: 600, max: 800 },
};

const getPieceCountForComplexity = (complexity: "easy" | "medium" | "hard"): number => {
  const range = PIECE_COUNT_RANGES[complexity];
  return Math.floor(Math.random() * (range.max - range.min + 1) + range.min);
};

// ─── ROLE-BASED COMPLEXITY ────────────────────────────────────────────

const getComplexityForRole = (role: ChapterRole): "easy" | "medium" | "hard" => {
  switch (role) {
    case ChapterRole.HOOK:
      return "easy";
    case ChapterRole.RISING_ACTION:
      return "medium";
    case ChapterRole.CLIMAX:
      return "hard";
    case ChapterRole.REVEAL:
      return "medium";
    case ChapterRole.CONCLUSION:
      return "easy";
  }
};

// ─── SMART VARIETY ALGORITHM ──────────────────────────────────────────

interface VarietyState {
  usedShapes: Set<PieceShape>;
  usedMaterials: Set<PieceMaterial>;
  usedMovements: Set<MovementType>;
  lastShape: PieceShape | null;
  lastMaterial: PieceMaterial | null;
  lastMovement: MovementType | null;
}

const pickRandom = <T>(array: T[], avoid?: T): T => {
  if (array.length === 1) return array[0];

  let filtered = array;
  if (avoid !== undefined) {
    filtered = array.filter((item) => item !== avoid);
    if (filtered.length === 0) filtered = array;
  }

  return filtered[Math.floor(Math.random() * filtered.length)];
};

export const generatePuzzleVariety = (
  role: ChapterRole,
  chapterIndex: number,
  totalChapters: number,
  state?: VarietyState
): { config: ChapterPuzzleConfig; state: VarietyState } => {
  const varietyState: VarietyState = state || {
    usedShapes: new Set(),
    usedMaterials: new Set(),
    usedMovements: new Set(),
    lastShape: null,
    lastMaterial: null,
    lastMovement: null,
  };

  const complexity = getComplexityForRole(role);
  const pieceCount = getPieceCountForComplexity(complexity);

  // Pick shape (avoid last, prefer unused)
  let shape: PieceShape;
  const unusedShapes = ALL_SHAPES.filter((s) => !varietyState.usedShapes.has(s));
  if (unusedShapes.length > 0 && Math.random() > 0.3) {
    shape = pickRandom(unusedShapes);
  } else {
    shape = pickRandom(ALL_SHAPES, varietyState.lastShape || undefined);
  }

  // Pick material (avoid last, prefer unused)
  let material: PieceMaterial;
  const unusedMaterials = ALL_MATERIALS.filter((m) => !varietyState.usedMaterials.has(m));
  if (unusedMaterials.length > 0 && Math.random() > 0.3) {
    material = pickRandom(unusedMaterials);
  } else {
    material = pickRandom(ALL_MATERIALS, varietyState.lastMaterial || undefined);
  }

  // Pick movement (avoid last, prefer unused)
  let movement: MovementType;
  const unusedMovements = ALL_MOVEMENTS.filter((m) => !varietyState.usedMovements.has(m));
  if (unusedMovements.length > 0 && Math.random() > 0.3) {
    movement = pickRandom(unusedMovements);
  } else {
    movement = pickRandom(ALL_MOVEMENTS, varietyState.lastMovement || undefined);
  }

  // Update state
  varietyState.usedShapes.add(shape);
  varietyState.usedMaterials.add(material);
  varietyState.usedMovements.add(movement);
  varietyState.lastShape = shape;
  varietyState.lastMaterial = material;
  varietyState.lastMovement = movement;

  // Reset halfway through
  const halfwayPoint = Math.floor(totalChapters / 2);
  if (chapterIndex === halfwayPoint) {
    varietyState.usedShapes.clear();
    varietyState.usedMaterials.clear();
    varietyState.usedMovements.clear();
  }

  return {
    config: {
      pieceCount,
      shape,
      material,
      movement,
      complexityLevel: complexity,
    },
    state: varietyState,
  };
};

export const generateAllChapterPuzzles = (
  roles: ChapterRole[],
  totalChapters: number
): ChapterPuzzleConfig[] => {
  let state: VarietyState | undefined = undefined;
  const configs: ChapterPuzzleConfig[] = [];

  for (let i = 0; i < roles.length; i++) {
    const result = generatePuzzleVariety(roles[i], i, totalChapters, state);
    configs.push(result.config);
    state = result.state;
  }

  return configs;
};

export const validateVariety = (configs: ChapterPuzzleConfig[]): boolean => {
  for (let i = 1; i < configs.length; i++) {
    const prev = configs[i - 1];
    const curr = configs[i];

    if (prev.shape === curr.shape && prev.material === curr.material && prev.movement === curr.movement) {
      console.warn(`⚠️ Chapters ${i - 1} and ${i} have identical puzzle configs`);
      return false;
    }
  }
  return true;
};
