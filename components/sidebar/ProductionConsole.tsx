
import React from 'react';
import { PipelineStep } from '../../hooks/useProductionPipeline';
import { UserPreferences } from '../../types';
import IdentityCard from './IdentityCard';
import ProductionFlow from './ProductionFlow';

interface ProductionConsoleProps {
  step: PipelineStep;
  isAutoMode: boolean;
  isFullPackage: boolean;
  currentIndex: number;
  total: number;
  preferences: UserPreferences;
  channelLogoUrl?: string | null;
}

const ProductionConsole: React.FC<ProductionConsoleProps> = ({ 
  step, isAutoMode, isFullPackage, currentIndex, total, preferences, channelLogoUrl
}) => {
  const showFlow = isAutoMode || step !== 'IDLE';

  return (
    <div className="flex flex-col gap-3">
      {/* نمایش شناسنامه فنی به صورت فشرده */}
      <IdentityCard preferences={preferences} channelLogoUrl={channelLogoUrl} />

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
