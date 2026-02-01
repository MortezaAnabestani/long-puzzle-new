import React from 'react';
import { LayoutGrid, Shapes, Box, Zap } from 'lucide-react';
import { PieceShape, PieceMaterial, MovementType } from '../../types';
import SectionLabel from '../ui/SectionLabel';

interface ComplexityConfigProps {
  pieceCount: number;
  shape: PieceShape;
  material: PieceMaterial;
  movement: MovementType;
  onCountChange: (c: number) => void;
  onShapeChange: (s: PieceShape) => void;
  onMaterialChange: (m: PieceMaterial) => void;
  onMovementChange: (m: MovementType) => void;
  disabled?: boolean;
}

const ComplexityConfig: React.FC<ComplexityConfigProps> = ({ 
  pieceCount, shape, material, movement,
  onCountChange, onShapeChange, onMaterialChange, onMovementChange, 
  disabled 
}) => {
  const counts = [100, 500, 900, 1500, 3000];
  const shapes = Object.values(PieceShape);
  const materials = Object.values(PieceMaterial);
  const movements = Object.values(MovementType);

  // Helper for consistent button styling within the Engineering Design System
  const getButtonClass = (isActive: boolean) => `
    relative flex items-center justify-center py-2 px-3 rounded-md border transition-all duration-200
    text-[11px] font-medium uppercase tracking-wide
    ${isActive 
      ? 'bg-[#007acc] border-[#007acc] text-white shadow-sm' 
      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 hover:bg-zinc-800'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Movement Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-zinc-500 mb-1">
          <Zap className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Kinetic Movement</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {movements.map(m => (
            <button
              key={m}
              disabled={disabled}
              onClick={() => onMovementChange(m)}
              className={getButtonClass(movement === m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Material Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-zinc-500 mb-1">
          <Box className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Tactile Material</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {materials.map(m => (
            <button
              key={m}
              disabled={disabled}
              onClick={() => onMaterialChange(m)}
              className={getButtonClass(material === m)}
            >
              {m.replace('Classic ', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Density Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-zinc-500 mb-1">
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Grid Density</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {counts.map(c => (
            <button
              key={c}
              disabled={disabled}
              onClick={() => onCountChange(c)}
              className={`
                h-8 rounded-md border text-[10px] font-mono transition-all
                ${pieceCount === c 
                  ? 'bg-[#007acc]/10 border-[#007acc] text-[#007acc] font-bold' 
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                }
              `}
            >
              {c >= 1000 ? `${(c/1000).toFixed(1)}k` : c}
            </button>
          ))}
        </div>
      </div>

      {/* Geometry Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-zinc-500 mb-1">
          <Shapes className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Geometry</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {shapes.map(s => (
            <button
              key={s}
              disabled={disabled}
              onClick={() => onShapeChange(s)}
              className={getButtonClass(shape === s)}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComplexityConfig;