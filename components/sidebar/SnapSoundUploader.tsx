import React, { useRef, useState, useEffect } from "react";
import { Volume2, Upload, X, CheckCircle2, FileAudio, Waves, Zap, BoxSelect, Download, RefreshCw, List } from "lucide-react";
import { sonicEngine, SoundType } from "../../services/proceduralAudio";
import { assetApi } from "../../services/api/assetApi";
import { soundRandomizer, SoundVariant } from "../../services/soundRandomizer";

interface SoundSlot {
  type: SoundType;
  label: string;
  icon: React.ReactNode;
}

const SOUND_SLOTS: SoundSlot[] = [
  { type: "MOVE", label: "صدای حرکت قطعات", icon: <Zap className="w-3.5 h-3.5" /> },
  { type: "SNAP", label: "صدای قفل شدن (Snap)", icon: <BoxSelect className="w-3.5 h-3.5" /> },
  { type: "WAVE", label: "صدای موج نهایی", icon: <Waves className="w-3.5 h-3.5" /> },
  { type: "DESTRUCT", label: "صدای انفجار/تخریب", icon: <X className="w-3.5 h-3.5" /> },
];


interface SnapSoundUploaderProps {
  disabled?: boolean;
  onRandomizeRequest?: () => void;
}

const SnapSoundUploader: React.FC<SnapSoundUploaderProps> = ({ disabled, onRandomizeRequest }) => {
  const [loadedSounds, setLoadedSounds] = useState<Set<SoundType>>(new Set());
  const [loadingFromBackend, setLoadingFromBackend] = useState(false);
  const [manualSounds, setManualSounds] = useState<Map<SoundType, SoundVariant[]>>(new Map());
  const [showManualList, setShowManualList] = useState(false);
  const fileInputs = useRef<Map<SoundType, HTMLInputElement>>(new Map());

  // Mapping بین SoundType و backend sound types
  const SOUND_TYPE_MAPPING: Record<SoundType, string> = {
    'SNAP': 'snap',     // جاخوردن پازل
    'MOVE': 'slide',    // حرکت قطعات
    'WAVE': 'wave',     // موج نهایی
    'DESTRUCT': 'fall'  // انفجار/تخریب
  };

  // بارگذاری خودکار sound effects از backend در صورت وجود
  useEffect(() => {
    const loadBackendSounds = async () => {
      setLoadingFromBackend(true);
      console.log(`🔊 [SnapSound] Attempting to load sounds from backend...`);

      let loadedCount = 0;

      try {
        // بارگذاری همه sound effects
        for (const [soundType, backendType] of Object.entries(SOUND_TYPE_MAPPING)) {
          try {
            const soundUrl = await assetApi.getSoundByType(backendType);
            if (soundUrl) {
              const response = await fetch(soundUrl, {
                headers: {
                  'ngrok-skip-browser-warning': 'true'
                }
              });

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }

              const blob = await response.blob();
              console.log(`📦 [SnapSound] Blob size for ${soundType}: ${blob.size} bytes, type: ${blob.type}`);

              const file = new File([blob], `${backendType}.mp3`, { type: 'audio/mpeg' });
              await sonicEngine.setSound(soundType as SoundType, file);
              setLoadedSounds((prev) => new Set(prev).add(soundType as SoundType));
              loadedCount++;
              console.log(`✅ [SnapSound] Loaded ${soundType} from backend`);
            }
          } catch (error) {
            console.warn(`⚠️ [SnapSound] Failed to load ${soundType}:`, error);
          }
        }

        if (loadedCount > 0) {
          console.log(`✅ [SnapSound] Successfully loaded ${loadedCount}/${Object.keys(SOUND_TYPE_MAPPING).length} sounds`);
        }
      } catch (error) {
        console.warn(`⚠️ [SnapSound] Failed to load from backend:`, error);
      }

      setLoadingFromBackend(false);
    };

    loadBackendSounds();
  }, []);

  const handleFileChange = async (type: SoundType, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      // اگر چند فایل انتخاب شده، همه را به لیست دستی اضافه کن
      const newSounds: SoundVariant[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        newSounds.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          file: file,
        });
      }

      setManualSounds((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(type) || [];
        const updated = [...existing, ...newSounds];
        newMap.set(type, updated);

        // به‌روزرسانی soundRandomizer
        soundRandomizer.setManualVariants(type, updated);

        return newMap;
      });

      // اولین فایل را بارگذاری کن
      await sonicEngine.setSound(type, newSounds[0].file);
      setLoadedSounds((prev) => new Set(prev).add(type));

      console.log(`✅ [SoundUpload] Added ${newSounds.length} sound(s) for ${type}`);
    } catch (err) {
      alert("خطا در بارگذاری فایل.");
      console.error("❌ [SoundUpload] Failed:", err);
    }
  };

  const handleClear = (type: SoundType) => {
    sonicEngine.clearSound(type);
    setLoadedSounds((prev) => {
      const n = new Set(prev);
      n.delete(type);
      return n;
    });
    if (fileInputs.current.get(type)) {
      fileInputs.current.get(type)!.value = "";
    }
  };

  const handleReRandomize = async (type: SoundType) => {
    const success = await soundRandomizer.randomizeSound(type, true);
    if (success) {
      setLoadedSounds((prev) => new Set(prev).add(type));
    }
  };

  const handleRemoveManualSound = (type: SoundType, soundId: string) => {
    setManualSounds((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(type) || [];
      const updated = existing.filter(s => s.id !== soundId);
      newMap.set(type, updated);

      // به‌روزرسانی soundRandomizer
      soundRandomizer.setManualVariants(type, updated);

      return newMap;
    });
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-zinc-400">
          <Volume2 className="w-4 h-4 text-blue-500" />
          <span className="text-[10px] font-black uppercase tracking-widest">Audio Profile Studio</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManualList(!showManualList)}
            className="p-1.5 bg-white/5 hover:bg-blue-600/20 rounded-md text-zinc-500 hover:text-blue-400 transition-all"
            title="مشاهده لیست افکت‌های دستی"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          {loadingFromBackend && (
            <div className="flex items-center gap-1.5 text-[9px] text-blue-400">
              <Download className="w-3 h-3 animate-bounce" />
              <span>Loading...</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {SOUND_SLOTS.map((slot) => {
          const isLoaded = loadedSounds.has(slot.type);
          return (
            <div
              key={slot.type}
              className="group relative flex items-center justify-between bg-zinc-900/40 border border-white/5 p-2 rounded-xl hover:border-blue-500/20 transition-all"
            >
              <input
                type="file"
                multiple
                ref={(el) => {
                  if (el) fileInputs.current.set(slot.type, el);
                }}
                onChange={(e) => handleFileChange(slot.type, e)}
                accept="audio/*"
                className="hidden"
              />

              <div className="flex items-center gap-3 overflow-hidden">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isLoaded ? "bg-blue-600 text-white shadow-lg" : "bg-zinc-800 text-zinc-600"
                  }`}
                >
                  {slot.icon}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-zinc-300 tracking-wide">{slot.label}</span>
                  <span className="text-[8px] font-mono text-zinc-600 uppercase">
                    {isLoaded ? `Ready (${(manualSounds.get(slot.type)?.length || 0) > 0 ? `${manualSounds.get(slot.type)?.length} variants` : 'DB'})` : "Waiting_Input"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {!isLoaded ? (
                  <button
                    disabled={disabled}
                    onClick={() => fileInputs.current.get(slot.type)?.click()}
                    className="p-2 bg-white/5 hover:bg-blue-600/20 rounded-lg text-zinc-500 hover:text-blue-400 transition-all"
                    title="بارگذاری فایل"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                    <button
                      onClick={() => handleReRandomize(slot.type)}
                      className="p-2 bg-white/5 hover:bg-purple-600/20 rounded-lg text-zinc-500 hover:text-purple-400 transition-all"
                      title="انتخاب تصادفی مجدد"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={disabled}
                      onClick={() => fileInputs.current.get(slot.type)?.click()}
                      className="p-2 bg-white/5 hover:bg-blue-600/20 rounded-lg text-zinc-500 hover:text-blue-400 transition-all"
                      title="اضافه کردن فایل بیشتر"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleClear(slot.type)}
                      className="p-2 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-colors"
                      title="پاک کردن"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Sound List */}
      {showManualList && (
        <div className="w-full bg-zinc-900/60 border border-white/10 rounded-xl p-3 space-y-2">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
            لیست افکت‌های دستی
          </div>
          {SOUND_SLOTS.map((slot) => {
            const sounds = manualSounds.get(slot.type) || [];
            if (sounds.length === 0) return null;

            return (
              <div key={slot.type} className="space-y-1">
                <div className="flex items-center gap-2 text-[9px] text-zinc-500 uppercase">
                  {slot.icon}
                  <span>{slot.label}</span>
                </div>
                {sounds.map((sound) => (
                  <div
                    key={sound.id}
                    className="flex items-center justify-between bg-zinc-800/40 border border-white/5 p-2 rounded-lg"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileAudio className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                      <span className="text-[10px] text-zinc-400 truncate">{sound.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveManualSound(slot.type, sound.id)}
                      className="p-1 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-colors rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
          {Array.from(manualSounds.values()).every(arr => arr.length === 0) && (
            <div className="text-center text-[10px] text-zinc-600 py-4">
              هیچ افکت دستی بارگذاری نشده است
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SnapSoundUploader;
