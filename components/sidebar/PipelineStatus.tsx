import React from 'react';
import { Search, Image as ImageIcon, Video, Package, CheckCircle2, Loader2, Activity } from 'lucide-react';
import { PipelineStep } from '../../hooks/useProductionPipeline';

interface PipelineStatusProps {
  step: PipelineStep;
  isAutoMode: boolean;
  isFullPackage: boolean;
  currentIndex: number;
  total: number;
}

const PipelineStatus: React.FC<PipelineStatusProps> = ({ step, isAutoMode, isFullPackage, currentIndex, total }) => {
  const steps = [
    { id: 'SCAN', label: 'Neural Trend Scan', icon: <Search className="w-3.5 h-3.5" /> },
    { id: 'SYNTH', label: 'Image Synthesis', icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: 'RECORD', label: 'Kinetic Recording', icon: <Video className="w-3.5 h-3.5" /> },
    { id: 'EXPORT', label: 'Asset Packaging', icon: <Package className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-full border border-slate-200 bg-white rounded-md overflow-hidden mb-4">
      {/* Header Section - Engineering Style */}
      <div className="flex justify-between items-center px-3 py-2 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px] font-mono font-medium text-slate-700 uppercase tracking-tight">
            PIPELINE_EXECUTION_LOG
          </span>
        </div>
        
        {isFullPackage && isAutoMode && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono">BATCH_PROCESS:</span>
            <span className="px-1.5 py-0.5 bg-[#007acc]/10 text-[#007acc] border border-[#007acc]/20 text-[10px] font-mono font-medium rounded">
              {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* Status Rows - Table Layout */}
      <div className="flex flex-col divide-y divide-slate-100">
        {steps.map((s, idx) => {
          const isComplete = steps.findIndex(x => x.id === step) > idx;
          const isActive = step === s.id;
          
          return (
            <div 
              key={s.id} 
              className={`
                flex items-center justify-between px-3 py-2.5 transition-colors duration-200
                ${isActive ? 'bg-[#007acc]/5' : 'bg-white'}
                ${!isAutoMode && !isActive ? 'opacity-50 grayscale' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                {/* Status Indicator Box */}
                <div className={`
                  w-6 h-6 rounded flex items-center justify-center border
                  ${isComplete 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                    : isActive 
                      ? 'bg-white border-[#007acc] text-[#007acc] shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-400'}
                `}>
                  {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : isActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : s.icon}
                </div>

                <div className="flex flex-col">
                  <span className={`text-[12px] font-medium leading-none ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                    {s.label}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 mt-1">
                    ID: {s.id}
                  </span>
                </div>
              </div>

              {/* Status Text Badge */}
              <div className="flex items-center">
                {isActive && (
                  <span className="text-[10px] font-mono text-[#007acc] animate-pulse">
                    PROCESSING...
                  </span>
                )}
                {isComplete && (
                  <span className="text-[10px] font-mono text-emerald-600">
                    [DONE]
                  </span>
                )}
                {!isActive && !isComplete && (
                  <span className="text-[10px] font-mono text-slate-300">
                    WAITING
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Footer / Meta Info */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
        <span className="text-[10px] text-slate-400 font-mono">SYS_MODE: {isAutoMode ? 'AUTO_SEQUENCE' : 'MANUAL_OVERRIDE'}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${isAutoMode ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
      </div>
    </div>
  );
};

export default PipelineStatus;