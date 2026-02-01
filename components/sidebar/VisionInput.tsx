
import React, { useState } from 'react';
import {
  Radio, Zap, ChevronRight, X, Loader2, LayoutGrid, Sparkles,
  Heart, Flame, User, Star, Camera, BookOpen, Waves, Terminal,
  ArrowRight, Hash, Globe, Landmark, Shirt, Users
} from 'lucide-react';
import { getTrendingTopics, generateVisualPromptFromTopic, fetchFactNarrative } from '../../services/geminiService';
import { TopicType, NarrativeLens } from '../../types';

export const VIRAL_CATEGORIES = [
  { id: 'ancient', label: 'Ancient Wonders', icon: <Landmark className="w-3.5 h-3.5" />, topic: 'Grand cinematic reconstructions of lost ancient wonders, pyramids, or temples with epic lighting and atmospheric historical accuracy.' },
  { id: 'ocean', label: 'Ocean Mysteries', icon: <Waves className="w-3.5 h-3.5" />, topic: 'Deep sea creatures, coral reefs, mysterious marine phenomena, bioluminescent organisms, and unexplored ocean depths with dramatic underwater lighting.' },
  { id: 'space', label: 'Space Exploration', icon: <Star className="w-3.5 h-3.5" />, topic: 'Nebulae, galaxies, black holes, exoplanets, space missions, astronomical phenomena with cinematic cosmic scale and scientific accuracy.' },
  { id: 'nature', label: 'Nature Wonders', icon: <Sparkles className="w-3.5 h-3.5" />, topic: 'Breathtaking natural phenomena like auroras, volcanic eruptions, rare weather events, exotic wildlife in pristine habitats with documentary quality.' },
  { id: 'science', label: 'Science Breakthroughs', icon: <Zap className="w-3.5 h-3.5" />, topic: 'Cutting-edge scientific discoveries, quantum physics, DNA structures, nanotechnology, artificial intelligence with educational visual representations.' },
  { id: 'architecture', label: 'Architecture Marvels', icon: <Landmark className="w-3.5 h-3.5" />, topic: 'Modern architectural masterpieces, futuristic city designs, sustainable buildings, iconic structures with dramatic perspectives and golden hour lighting.' },
  { id: 'wildlife', label: 'Wildlife Behavior', icon: <Heart className="w-3.5 h-3.5" />, topic: 'Rare animal behaviors, predator-prey dynamics, migration patterns, endangered species in their natural habitats with National Geographic quality.' },
  { id: 'tech', label: 'Future Technology', icon: <Terminal className="w-3.5 h-3.5" />, topic: 'Revolutionary gadgets, robotics, quantum computers, neural interfaces, green energy innovations with sleek futuristic aesthetics.' },
  { id: 'medical', label: 'Medical Marvels', icon: <Heart className="w-3.5 h-3.5" />, topic: 'Human anatomy, medical breakthroughs, surgical innovations, cellular biology, brain science with detailed anatomical accuracy and clinical precision.' },
  { id: 'geology', label: 'Earth Secrets', icon: <Globe className="w-3.5 h-3.5" />, topic: 'Geological formations, crystal caves, mineral deposits, tectonic phenomena, rare gemstones with macro photography detail and natural color.' },
  { id: 'cyber', label: 'Cyberpunk Future', icon: <Zap className="w-3.5 h-3.5" />, topic: 'Vivid futuristic cityscapes and advanced technological worlds, exploring the high-tech neon aesthetic.' },
  { id: 'myth', label: 'Mythical Legends', icon: <Sparkles className="w-3.5 h-3.5" />, topic: 'Epic visual interpretations of ancient legends, cosmic deities, and celestial beings in grand environments.' },
  { id: 'history', label: 'Lost History', icon: <BookOpen className="w-3.5 h-3.5" />, topic: 'Forgotten civilizations, archaeological discoveries, historical mysteries, ancient artifacts with historically accurate reconstruction.' },
  { id: 'portrait', label: 'Human Stories', icon: <Camera className="w-3.5 h-3.5" />, topic: 'Diverse cultural portraits, emotional expressions, human connection, traditional costumes with documentary storytelling depth.' },
  { id: 'climate', label: 'Climate Phenomena', icon: <Waves className="w-3.5 h-3.5" />, topic: 'Climate change effects, melting glaciers, extreme weather, ecosystem transformations with scientific documentation and environmental awareness.' },
  { id: 'micro', label: 'Microscopic World', icon: <Sparkles className="w-3.5 h-3.5" />, topic: 'Cellular structures, bacteria, viruses, microorganisms, crystalline patterns with extreme macro photography and scientific detail.' },
  { id: 'celebrity', label: 'Celebrity Moments', icon: <Star className="w-3.5 h-3.5" />, topic: 'Iconic celebrity moments, red carpet glamour, legendary performers, cultural icons with dramatic lighting and magazine-quality cinematography.' },
  { id: 'fashion', label: 'Fashion & Style', icon: <Shirt className="w-3.5 h-3.5" />, topic: 'High fashion runway shows, couture designs, style evolution, iconic fashion moments with elegant composition and luxurious aesthetics.' },
  { id: 'beauty', label: 'Beauty & Elegance', icon: <Sparkles className="w-3.5 h-3.5" />, topic: 'Stunning beauty portraits, elegant poses, graceful expressions, artistic makeup and styling with soft lighting and refined aesthetics.' },
  { id: 'allure', label: 'Feminine Allure', icon: <Heart className="w-3.5 h-3.5" />, topic: 'Captivating feminine beauty, sexy body, elegant silhouettes, sensual poses, artistic portraits with sophisticated lighting and cinematic appeal.' },
];

interface VisionInputProps {
  value: string;
  onChange: (value: string, topicType?: TopicType, topicCategory?: string) => void;
  disabled?: boolean;
}

const VisionInput: React.FC<VisionInputProps> = ({ value, onChange, disabled }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const handleFetchTrends = async () => {
    setIsSearching(true);
    setTopics([]);
    setShowCategories(false);
    try {
      const trending = await getTrendingTopics();
      setTopics(trending);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFetchNarrative = async () => {
    setIsSearching(true);
    setShowCategories(false);
    setTopics([]);
    try {
      const narrative = await fetchFactNarrative();
      const visualPrompt = await generateVisualPromptFromTopic(narrative, NarrativeLens.HIDDEN_DISCOVERY);
      onChange(visualPrompt, TopicType.NARRATIVE, 'Historical Discovery');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTopic = async (topic: string, isFromViralCategories: boolean = false, categoryLabel?: string) => {
    setIsGeneratingScene(true);
    setTopics([]);
    setShowCategories(false);
    try {
      const visualPrompt = await generateVisualPromptFromTopic(topic, NarrativeLens.HIDDEN_DISCOVERY);
      if (isFromViralCategories) {
        onChange(visualPrompt, TopicType.VIRAL, categoryLabel);
      } else {
        onChange(visualPrompt, TopicType.BREAKING);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingScene(false);
    }
  };

  return (
    <div className="w-full flex flex-col border border-white/5 bg-zinc-900/50 rounded-2xl overflow-hidden shadow-xl transition-all focus-within:border-blue-500/30">
      {/* Header Toolbar - Dynamic Signal Selection */}
      <div className="flex flex-col border-b border-white/5 bg-zinc-950/40">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
          <div className="flex items-center gap-2 text-zinc-400">
            <Terminal className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Signal Terminal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1 h-1 rounded-full ${isSearching ? 'bg-blue-500 animate-pulse' : 'bg-zinc-800'}`} />
            <span className="text-[8px] font-mono text-zinc-600 uppercase">Uplink Status</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 p-2 overflow-x-auto no-scrollbar">
          <button 
            onClick={handleFetchNarrative}
            disabled={disabled || isSearching || isGeneratingScene}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 transition-all whitespace-nowrap"
          >
            <BookOpen className="w-3 h-3" />
            <span>NARRATIVE</span>
          </button>

          <button 
            onClick={handleFetchTrends}
            disabled={disabled || isSearching || isGeneratingScene}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 transition-all whitespace-nowrap"
          >
            <Zap className="w-3 h-3" />
            <span>BREAKING</span>
          </button>

          <button 
            onClick={() => setShowCategories(!showCategories)}
            disabled={disabled || isSearching || isGeneratingScene}
            className={`
              flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-all border whitespace-nowrap
              ${showCategories 
                ? 'bg-blue-600 border-blue-400 text-white shadow-lg' 
                : 'bg-zinc-800 border-white/5 text-zinc-400 hover:bg-zinc-700'}
            `}
          >
            <LayoutGrid className="w-3 h-3" />
            <span>VIRAL</span>
          </button>
        </div>
      </div>

      {/* Main Input Area */}
      <div className="relative group">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value, TopicType.MANUAL)}
          className={`
            w-full h-44 bg-transparent p-5 text-[14px] font-mono leading-relaxed text-zinc-200 
            placeholder:text-zinc-700 resize-none outline-none custom-scrollbar
            ${isGeneratingScene ? 'opacity-20 blur-[1px]' : ''}
          `}
          placeholder="// INPUT NARRATIVE SEED OR SELECT SIGNAL SOURCE..."
          disabled={disabled || isSearching || isGeneratingScene}
          spellCheck={false}
        />

        {/* Overlay: Categories (Full Height Panel) */}
        {showCategories && (
          <div className="absolute inset-0 z-[100] bg-zinc-950 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-black">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <Hash className="w-3.5 h-3.5" /> SELECT VIRAL NICHE
              </span>
              <button onClick={() => setShowCategories(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar grid grid-cols-1 gap-2">
              {VIRAL_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectTopic(cat.topic, true, cat.label)}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-white/5 transition-all group text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-all shrink-0">
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-300 group-hover:text-white tracking-wide">
                        {cat.label}
                      </span>
                      <ArrowRight className="w-4 h-4 text-zinc-800 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                    <p className="text-[10px] text-zinc-600 line-clamp-2 mt-1 group-hover:text-zinc-400 italic">
                      {cat.topic}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Overlay: Trending Topics */}
        {topics.length > 0 && (
          <div className="absolute inset-0 z-[100] bg-zinc-950 flex flex-col animate-in fade-in duration-300">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-black">
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                <Radio className="w-3.5 h-3.5" /> LIVE GLOBAL SIGNALS
              </span>
              <button onClick={() => setTopics([])} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
              {topics.map((topic, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectTopic(topic)}
                  className="w-full text-left p-5 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all flex items-center justify-between group"
                >
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-white leading-relaxed">
                    {topic}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-blue-500 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isGeneratingScene && (
          <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-[0.3em] animate-pulse">
              Generating Visual Narrative...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default VisionInput;
    