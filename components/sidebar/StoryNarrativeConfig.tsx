
import React from 'react';
import { History, Search, FileText, Info, ArrowRight, BookOpen, Sparkles, Wand2 } from 'lucide-react';
import { StorySource } from '../../types';
import SectionLabel from '../ui/SectionLabel';

interface StoryNarrativeConfigProps {
  source: StorySource;
  detail: string;
  onSourceChange: (s: StorySource) => void;
  onDetailChange: (d: string) => void;
  disabled?: boolean;
}

const StoryNarrativeConfig: React.FC<StoryNarrativeConfigProps> = ({
  source, detail, onSourceChange, onDetailChange, disabled
}) => {
  const steps = [
    { id: 1, label: 'تنظیم روایت', icon: <BookOpen className="w-3 h-3" />, active: true },
    { id: 2, label: 'سنتز پازل', icon: <Sparkles className="w-3 h-3" />, active: false },
    { id: 3, label: 'نمایش سینمایی', icon: <Wand2 className="w-3 h-3" />, active: false },
  ];

  const methods = [
    { 
      id: StorySource.AI_DISCOVERY, 
      label: 'کشف هوشمند روایت', 
      desc: 'هوش مصنوعی یک واقعه تاریخی/علمی جذاب را انتخاب و به ۱۶ بخش تقسیم می‌کند.',
      icon: <History className="w-4 h-4" />
    },
    { 
      id: StorySource.TOPIC_GUIDE, 
      label: 'روایت بر اساس موضوع', 
      desc: 'موضوع را بنویسید (مثلاً: سفر به ماه) تا AI مستندات آن را استخراج کند.',
      icon: <Search className="w-4 h-4" />
    },
    { 
      id: StorySource.DIRECT_PROMPT, 
      label: 'روایت مستقیم (پرامپت)', 
      desc: 'داستان یا سناریوی خود را مستقیماً وارد کنید تا به تصویر تبدیل شود.',
      icon: <FileText className="w-4 h-4" />
    }
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      {/* Visual Workflow Steps */}
      <div className="flex items-center justify-between px-2">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${step.active ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-white/5 text-slate-600'}`}>
                {step.icon}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest ${step.active ? 'text-emerald-500' : 'text-slate-700'}`}>{step.label}</span>
            </div>
            {idx < steps.length - 1 && <ArrowRight className="w-4 h-4 text-slate-800 mb-5" />}
          </React.Fragment>
        ))}
      </div>

      <div className="space-y-6">
        <SectionLabel icon={<Info className="w-4 h-4 text-emerald-500" />}>
          گام ۱: انتخاب منبع داستان
        </SectionLabel>

        <div className="space-y-3">
          {methods.map((m) => (
            <button
              key={m.id}
              disabled={disabled}
              onClick={() => onSourceChange(m.id)}
              className={`w-full p-4 rounded-3xl border transition-all text-right group ${
                source === m.id 
                ? 'bg-emerald-600/10 border-emerald-500/40 text-white shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${source === m.id ? 'bg-emerald-600 shadow-lg' : 'bg-white/5'}`}>
                  {m.icon}
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider">{m.label}</span>
              </div>
              <p className="text-[9px] font-medium leading-relaxed opacity-60 pr-1">
                {m.desc}
              </p>
            </button>
          ))}
        </div>

        {(source === StorySource.TOPIC_GUIDE || source === StorySource.DIRECT_PROMPT) && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col gap-1 px-1">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {source === StorySource.TOPIC_GUIDE ? 'موضوع مستندات تاریخی/علمی' : 'متن سناریوی ۱۶ مرحله‌ای'}
              </label>
              <span className="text-[8px] text-slate-700 font-bold uppercase">AI بر اساس این ورودی ۱۶ قطعه تصویر پازل را می‌سازد.</span>
            </div>
            <textarea
              value={detail}
              onChange={(e) => onDetailChange(e.target.value)}
              disabled={disabled}
              className="w-full bg-black border border-white/10 rounded-3xl p-5 text-xs h-32 outline-none focus:border-emerald-500/50 transition-all text-emerald-100 placeholder:text-slate-800 resize-none shadow-inner"
              placeholder={source === StorySource.TOPIC_GUIDE ? "مثلاً: نظریه نسبیت انیشتین یا نبرد ماراتن..." : "بخش اول: ... \nبخش دوم: ..."}
            />
          </div>
        )}
      </div>

      <div className="p-4 bg-emerald-600/5 border border-emerald-500/10 rounded-2xl">
         <p className="text-[9px] text-emerald-500/60 font-bold leading-relaxed text-right">
          پس از تکمیل این مرحله، دکمه <span className="text-white">«سنتز پازل روایتی»</span> در پایین نوار کناری را بزنید تا هوش مصنوعی شروع به طراحی پازل ۱۶ قطعه‌ای کند.
         </p>
      </div>
    </div>
  );
};

export default StoryNarrativeConfig;
