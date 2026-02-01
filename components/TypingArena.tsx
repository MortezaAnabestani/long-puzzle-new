
import React, { useState, useEffect, useRef } from 'react';
import { Keyboard, Zap, Target, RefreshCw } from 'lucide-react';

interface TypingArenaProps {
  targetText: string;
  onProgress: (progress: number) => void;
  onFinished: () => void;
  disabled?: boolean;
}

const TypingArena: React.FC<TypingArenaProps> = ({ targetText, onProgress, onFinished, disabled }) => {
  const [userInput, setUserInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const textToType = targetText || "Generating story for this image... Please wait.";

  useEffect(() => {
    if (userInput.length > 0 && !startTime) {
      setStartTime(Date.now());
    }

    if (userInput.length > 0 && startTime) {
      const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
      const wordsTyped = userInput.trim().split(/\s+/).length;
      setWpm(Math.round(wordsTyped / timeElapsed));
    }

    const progress = Math.min((userInput.length / textToType.length) * 100, 100);
    onProgress(progress);

    if (userInput.length >= textToType.length && userInput.length > 0) {
      onFinished();
    }
  }, [userInput, textToType, startTime, onProgress, onFinished]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    // Simple verification: can only type what is in the target text
    if (textToType.startsWith(val)) {
      setUserInput(val);
    }
  };

  return (
    <div className="w-full bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-4 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[12px] font-black text-white uppercase tracking-widest">Type to Reveal Color</h3>
            <p className="text-[10px] text-zinc-500 font-mono">Input matches target sequence</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">Velocity</span>
            <span className="text-lg font-black text-blue-500 font-mono">{wpm} <small className="text-[10px] opacity-50">WPM</small></span>
          </div>
          <div className="w-px h-8 bg-white/5" />
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">Accuracy</span>
            <span className="text-lg font-black text-emerald-500 font-mono">100%</span>
          </div>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-0 bg-blue-500/5 rounded-2xl blur-xl group-focus-within:bg-blue-500/10 transition-all" />
        <div className="relative bg-black/60 border border-white/10 rounded-2xl p-6 font-mono text-[14px] leading-relaxed min-h-[180px] overflow-hidden">
          {/* Background target text */}
          <div className="text-zinc-800 select-none">
            {textToType}
          </div>
          {/* Highlighted correct text */}
          <div className="absolute top-6 left-6 right-6 text-blue-400 pointer-events-none">
            {userInput}
            <span className="w-2 h-5 bg-blue-500 inline-block align-middle ml-0.5 animate-pulse" />
          </div>
          
          <textarea
            ref={inputRef}
            value={userInput}
            onChange={handleInputChange}
            disabled={disabled}
            className="absolute inset-0 w-full h-full bg-transparent p-6 text-transparent caret-transparent resize-none outline-none z-10"
            autoFocus
            spellCheck={false}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-zinc-600 text-[10px] font-black uppercase tracking-widest px-2">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-blue-500" />
          <span>Syncing strokes to rendering engine</span>
        </div>
        <button 
          onClick={() => { setUserInput(""); setStartTime(null); setWpm(0); }}
          className="hover:text-white transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Challenge
        </button>
      </div>
    </div>
  );
};

export default TypingArena;
