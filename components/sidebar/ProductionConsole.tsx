import React from "react";
import { PipelineStep } from "../../hooks/useProductionPipeline";
import { UserPreferences, DocumentaryProject, ProjectStatus } from "../../types";
import IdentityCard from "./IdentityCard";
import ProductionFlow from "./ProductionFlow";

interface ProductionConsoleProps {
  step: PipelineStep;
  isAutoMode: boolean;
  isFullPackage: boolean;
  currentIndex: number;
  total: number;
  preferences: UserPreferences;
  channelLogoUrl?: string | null;
  project?: DocumentaryProject | null;
  currentChapterIndex?: number;
}

const ProductionConsole: React.FC<ProductionConsoleProps> = ({
  step,
  isAutoMode,
  isFullPackage,
  currentIndex,
  total,
  preferences,
  channelLogoUrl,
  project,
  currentChapterIndex = 0,
}) => {
  const showFlow = isAutoMode || step !== "IDLE";
  const isPlaying = project?.status === ProjectStatus.PLAYING;

  return (
    <div className="flex flex-col gap-3">
      {/* نمایش شناسنامه فنی به صورت فشرده */}
      <IdentityCard preferences={preferences} channelLogoUrl={channelLogoUrl} />

      {/* نمایش Chapter X/Y حین ضبط */}
      {isPlaying && project && (
        <div className="px-3 py-2 bg-blue-900/10 border border-blue-500/15 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider">فصل فعلی</span>
            <span className="text-[10px] font-mono text-slate-300 font-bold">
              {currentChapterIndex + 1} / {project.chapters.length}
            </span>
          </div>
        </div>
      )}

      {/* نمایش وضعیت فرآیند فقط در صورت فعال بودن */}
      {showFlow && (
        <div className="border-t border-white/5 pt-3">
          <ProductionFlow step={step} />
        </div>
      )}
    </div>
  );
};

export default ProductionConsole;
