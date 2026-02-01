import React from 'react';
import { Check, Loader2, Circle } from 'lucide-react';

interface ProductionStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  details?: string;
}

interface ProductionProgressProps {
  currentVideo: number;
  totalVideos: number;
  steps: ProductionStep[];
}

const ProductionProgress: React.FC<ProductionProgressProps> = ({ currentVideo, totalVideos, steps }) => {
  if (steps.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 w-96 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-sm">🎬 Auto-Pilot Production</span>
          <span className="text-white/90 text-xs font-mono">
            Video {currentVideo}/{totalVideos}
          </span>
        </div>
        <div className="mt-2 w-full bg-white/20 rounded-full h-1.5">
          <div
            className="bg-white h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(currentVideo / totalVideos) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
              step.status === 'in_progress'
                ? 'bg-blue-500/10 border border-blue-500/30'
                : step.status === 'completed'
                ? 'bg-emerald-500/10 border border-emerald-500/20'
                : step.status === 'error'
                ? 'bg-red-500/10 border border-red-500/30'
                : 'bg-slate-800/30 border border-slate-700/30'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {step.status === 'completed' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : step.status === 'in_progress' ? (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              ) : step.status === 'error' ? (
                <Circle className="w-4 h-4 text-red-400" />
              ) : (
                <Circle className="w-4 h-4 text-slate-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-xs font-medium ${
                    step.status === 'in_progress'
                      ? 'text-blue-300'
                      : step.status === 'completed'
                      ? 'text-emerald-300'
                      : step.status === 'error'
                      ? 'text-red-300'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
              </div>
              {step.details && (
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{step.details}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductionProgress;
