import React from 'react';
import { Heart, Bell, Activity, Terminal } from 'lucide-react';

interface EngagementCTAProps {
  isVisible: boolean;
  isShorts: boolean;
  bellActive: boolean;
}

const EngagementCTA: React.FC<EngagementCTAProps> = ({ isVisible, isShorts, bellActive }) => {
  // Brand Color: #007acc
  
  return (
    <div 
      className={`absolute left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out font-mono
      ${isShorts ? 'bottom-[15%] w-[90%] max-w-[320px]' : 'bottom-8 w-auto min-w-[400px]'} 
      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
    >
      {/* Main Engineering Container */}
      <div className="bg-[#09090b] border border-slate-800 rounded-md shadow-sm overflow-hidden">
        
        {/* Header Bar: System Status */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/50 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              ENGAGEMENT_PROTOCOL
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isVisible ? 'bg-[#007acc] animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-[10px] text-slate-500">LIVE</span>
          </div>
        </div>

        {/* Content Grid */}
        <div className={`grid ${isShorts ? 'grid-cols-1 gap-2' : 'grid-cols-12 gap-0 divide-x divide-slate-800'} p-0`}>
          
          {/* Section 1: Metrics / Info */}
          <div className={`${isShorts ? 'col-span-1 p-2 border-b border-slate-800' : 'col-span-7 p-3'} flex flex-col justify-center`}>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3 h-3 text-[#007acc]" />
              <span className="text-[11px] font-semibold text-slate-200">
                CONTENT_EVALUATION
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              User interaction required to proceed. Confirm satisfaction level.
            </p>
          </div>

          {/* Section 2: Actions */}
          <div className={`${isShorts ? 'col-span-1 p-2 pt-0' : 'col-span-5 p-3'} flex items-center gap-2`}>
            
            {/* Like Button - Functional Style */}
            <button className="group flex-1 flex items-center justify-center gap-2 h-8 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-md transition-colors">
              <Heart className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-500 transition-colors" />
              <span className="text-[10px] font-medium text-slate-300">ACK</span>
            </button>

            {/* Subscribe/Bell - Active State Handling */}
            <button className={`flex-1 flex items-center justify-center gap-2 h-8 border rounded-md transition-all
              ${bellActive 
                ? 'bg-[#007acc]/10 border-[#007acc] text-[#007acc]' 
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
              }`}>
              <Bell className={`w-3.5 h-3.5 ${bellActive ? 'fill-[#007acc]' : ''}`} />
              <span className="text-[10px] font-medium">
                {bellActive ? 'SUB: ON' : 'SUB: OFF'}
              </span>
            </button>

          </div>
        </div>

        {/* Footer: Technical Metadata */}
        <div className="px-3 py-1 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          <span className="text-[9px] text-slate-600">ID: 0x8F2A...91</span>
          <span className="text-[9px] text-slate-600 font-mono">v2.4.0-stable</span>
        </div>

      </div>
    </div>
  );
};

export default EngagementCTA;