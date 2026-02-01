import React from 'react';
import { Zap } from 'lucide-react';

interface SpeedSliderProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

const SpeedSlider: React.FC<SpeedSliderProps> = ({ value, onChange, disabled }) => {
  // فرمت‌دهی مقدار برای نمایش دقیق مهندسی
  const formattedValue = value < 1 
    ? `${Math.round(value * 60)}s` 
    : `${value.toFixed(1)}m`;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-md p-3 shadow-sm">
      {/* Header Row: Label & Value */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-slate-100 rounded text-slate-500">
            <Zap className="w-3 h-3" />
          </div>
          <label className="text-[11px] font-medium text-slate-600 uppercase tracking-wide select-none">
            Assembly Duration
          </label>
        </div>
        <div className="flex items-center">
          <span className="font-mono text-[12px] font-semibold text-[#007acc] bg-blue-50 px-2 py-0.5 rounded border border-blue-100/50 min-w-[40px] text-center">
            {formattedValue}
          </span>
        </div>
      </div>

      {/* Input Row */}
      <div className="flex items-center gap-3 pt-1">
        <span className="text-[10px] font-mono text-slate-400 w-4 text-right">0.1</span>
        
        <div className="relative flex-1 h-4 flex items-center">
          {/* Custom Track Background */}
          <div className="absolute w-full h-1 bg-slate-100 rounded-full overflow-hidden">
             <div 
               className="h-full bg-[#007acc]/20" 
               style={{ width: `${(value / 8) * 100}%` }}
             />
          </div>
          
          {/* Native Range Input */}
          <input
            type="range"
            min="0.1"
            max="8.0"
            step="0.1"
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="relative w-full h-1 appearance-none bg-transparent cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#007acc] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-transparent"
          />
        </div>

        <span className="text-[10px] font-mono text-slate-400 w-4">8.0</span>
      </div>

      {/* Footer / Legend */}
      <div className="flex justify-between mt-2 px-0.5 border-t border-slate-100 pt-2">
        <span className="text-[9px] text-slate-400 font-medium">FAST_MODE</span>
        <span className="text-[9px] text-slate-400 font-medium">EXTENDED</span>
      </div>
    </div>
  );
};

export default SpeedSlider;