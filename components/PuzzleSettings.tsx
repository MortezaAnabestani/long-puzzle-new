import React from 'react';
import { UserPreferences, PieceShape, ArtStyle } from '../types';
import { LayoutGrid, Shapes, Palette } from 'lucide-react';

interface PuzzleSettingsProps {
  preferences: UserPreferences;
  setPreferences: (p: UserPreferences) => void;
  disabled?: boolean;
}

const PuzzleSettings: React.FC<PuzzleSettingsProps> = ({ preferences, setPreferences, disabled }) => {
  const counts = [100, 200, 500, 1000];
  const shapes = Object.values(PieceShape);
  const styles = Object.values(ArtStyle);

  // Helper for consistent button styling
  const getButtonClass = (isActive: boolean) => `
    relative flex items-center justify-center w-full py-2 px-3 
    text-[11px] font-medium transition-all duration-200 border rounded-md
    ${isActive 
      ? 'bg-[#007acc] border-[#007acc] text-white shadow-sm' 
      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-800'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  `;

  return (
    <div className="w-full p-4 border rounded-md border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      <div className="space-y-6">
        
        {/* Art Style Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              <Palette className="w-3.5 h-3.5 text-slate-500" /> 
              Art Style
            </label>
            <span className="text-[10px] font-mono text-slate-500">{preferences.style}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {styles.map(style => (
              <button
                key={style}
                disabled={disabled}
                onClick={() => setPreferences({ ...preferences, style })}
                className={`${getButtonClass(preferences.style === style)} justify-start`}
              >
                <span className="truncate">{style}</span>
                {preferences.style === style && (
                  <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white/20" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-slate-800/80 w-full" />

        {/* Complexity Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              <LayoutGrid className="w-3.5 h-3.5 text-slate-500" /> 
              Complexity
            </label>
            <span className="text-[10px] font-mono text-slate-500">PCS</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {counts.map(count => (
              <button
                key={count}
                disabled={disabled}
                onClick={() => setPreferences({ ...preferences, pieceCount: count })}
                className={`${getButtonClass(preferences.pieceCount === count)} font-mono`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-slate-800/80 w-full" />

        {/* Shape Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              <Shapes className="w-3.5 h-3.5 text-slate-500" /> 
              Geometry
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {shapes.map(shape => (
              <button
                key={shape}
                disabled={disabled}
                onClick={() => setPreferences({ ...preferences, shape })}
                className={getButtonClass(preferences.shape === shape)}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PuzzleSettings;