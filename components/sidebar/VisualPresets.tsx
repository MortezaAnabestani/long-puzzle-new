import React from 'react';
import { Palette, Check } from 'lucide-react';
import { ArtStyle } from '../../types';

interface VisualPresetsProps {
  currentStyle: ArtStyle;
  onStyleChange: (s: ArtStyle) => void;
  disabled?: boolean;
}

const VisualPresets: React.FC<VisualPresetsProps> = ({ 
  currentStyle, onStyleChange, disabled 
}) => {
  const styles = Object.values(ArtStyle);

  return (
    <div className="w-full border border-slate-200 bg-slate-50/50 rounded-md p-3">
      {/* Header Section: Technical Labeling */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 text-slate-600">
          <Palette className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wide">Style Configuration</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
          {styles.length} PRESETS
        </span>
      </div>

      {/* Grid Layout: High Density */}
      <div className="grid grid-cols-2 gap-2">
        {styles.map(s => {
          const isActive = currentStyle === s;
          return (
            <button
              key={s}
              disabled={disabled}
              onClick={() => onStyleChange(s)}
              className={`
                group relative flex items-center justify-between px-3 py-2.5 rounded-md border text-[11px] font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-[#007acc]/5 border-[#007acc] text-[#007acc] shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <span className="truncate mr-2">{s}</span>
              
              {/* Status Indicator: Engineering Style */}
              <div className={`
                flex items-center justify-center w-3.5 h-3.5 rounded-full border transition-colors
                ${isActive 
                  ? 'bg-[#007acc] border-[#007acc]' 
                  : 'bg-slate-100 border-slate-300 group-hover:border-slate-400'
                }
              `}>
                {isActive && <Check className="w-2 h-2 text-white" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VisualPresets;