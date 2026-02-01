
import React from 'react';
import { Search, ImageIcon, FileText, LayoutTemplate, Zap, Video, Package, Check, Loader2, CircleDashed, Music } from 'lucide-react';
import { PipelineStep } from '../../hooks/useProductionPipeline';

interface ProductionFlowProps {
  step: PipelineStep;
}

const ProductionFlow: React.FC<ProductionFlowProps> = ({ step }) => {
  const steps: { id: PipelineStep; label: string; icon: React.ReactNode }[] = [
    { id: 'SCAN', label: 'NEURAL_INTEL', icon: <Search className="w-3.5 h-3.5" /> },
    { id: 'MUSIC', label: 'SONIC_RHYTHM', icon: <Music className="w-3.5 h-3.5" /> },
    { id: 'SYNTH', label: 'STYLE_SYNTH', icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: 'METADATA', label: 'SEO_CALIB', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'THUMBNAIL', label: 'ASSET_RENDER', icon: <LayoutTemplate className="w-3.5 h-3.5" /> },
    { id: 'RECORDING', label: 'ENCRYPT_REC', icon: <Video className="w-3.5 h-3.5" /> },
    { id: 'PACKAGING', label: 'FACTORY_EXP', icon: <Package className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-full font-mono text-[11px]">
      <div className="flex items-center justify-between px-2 py-3 border-b border-slate-200/10 mb-2">
         <span className="text-slate-500 uppercase tracking-tight font-medium">Pipeline Sequence</span>
         <span className="text-[#007acc] bg-[#007acc]/10 px-1.5 py-0.5 rounded text-[10px]">v2.5.0</span>
      </div>

      <div className="flex flex-col gap-1">
        {steps.map((s, idx) => {
          const currentStepIdx = steps.findIndex(x => x.id === step);
          const isComplete = currentStepIdx > idx;
          const isActive = step === s.id;
          
          return (
            <div 
              key={s.id} 
              className={`group flex items-center justify-between px-3 py-2 rounded-md border transition-all duration-200 ${isActive ? 'bg-[#007acc]/5 border-[#007acc]/30 text-[#007acc]' : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-800/30'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-5 h-5 rounded-sm ${isActive ? 'text-[#007acc]' : isComplete ? 'text-slate-400' : 'text-slate-700'}`}>
                  {isComplete ? <Check className="w-3.5 h-3.5" /> : isActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span className="text-[10px] opacity-50">{(idx + 1).toString().padStart(2, '0')}</span>}
                </div>
                <span className={`uppercase tracking-wide font-medium ${isComplete ? 'text-slate-400 line-through decoration-slate-600/50' : ''}`}>{s.label}</span>
              </div>
              <div className="flex items-center">
                {isActive && <div className="flex items-center gap-2"><span className="text-[9px] opacity-70 animate-pulse">PROCESSING</span><div className="w-1.5 h-1.5 bg-[#007acc] rounded-full animate-pulse shadow-[0_0_8px_#007acc]" /></div>}
                {!isActive && !isComplete && <CircleDashed className="w-3 h-3 text-slate-700" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductionFlow;
