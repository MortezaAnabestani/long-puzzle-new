
import React from 'react';

interface SectionLabelProps {
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SectionLabel: React.FC<SectionLabelProps> = ({ icon, children }) => (
  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-3">
    <span className="text-red-500">{icon}</span>
    {children}
  </h3>
);

export default SectionLabel;
