import React from 'react';

interface FullPackageToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled: boolean;
}

const FullPackageToggle: React.FC<FullPackageToggleProps> = ({ checked, onChange, disabled }) => {
  return (
    <label 
      className={`
        group flex items-center justify-between w-full p-3 
        bg-slate-950 border border-slate-800 rounded-md 
        hover:border-slate-600 transition-all duration-200 cursor-pointer 
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
        ${checked ? 'border-[#007acc]/30 bg-[#007acc]/5' : ''}
      `}
    >
      {/* Data Label Section */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-slate-200 font-mono tracking-tight">
            پکیج کامل (Full Bundle)
          </span>
          {checked && (
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold text-[#007acc] bg-[#007acc]/10 rounded border border-[#007acc]/20 font-mono">
              ENABLED
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">
          7x Optimized Sequences
        </span>
      </div>

      {/* Functional Toggle Switch */}
      <div className="relative flex items-center">
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
        />
        {/* Track */}
        <div className="w-9 h-5 bg-slate-800 rounded peer-focus:ring-1 peer-focus:ring-[#007acc]/50 peer-checked:bg-[#007acc] transition-colors duration-200 border border-slate-700 peer-checked:border-[#007acc]"></div>
        
        {/* Thumb (Square-ish for engineering look) */}
        <div className="absolute left-[3px] top-[3px] bg-white w-3.5 h-3.5 rounded-[2px] transition-transform duration-200 peer-checked:translate-x-4 shadow-sm"></div>
      </div>
    </label>
  );
};

export default FullPackageToggle;