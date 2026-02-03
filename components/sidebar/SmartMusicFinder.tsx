import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Loader2,
  Play,
  Pause,
  Check,
  ShieldCheck,
  Globe,
  AlertCircle,
  RefreshCw,
  Zap,
  Download,
  Radio,
  SkipForward,
  Server,
  Database,
} from "lucide-react";
import { findSmartMusicByMood, SmartMusicTrack, SONIC_LIBRARY } from "../../services/geminiService";
import { assetApi } from "../../services/api/assetApi";
import { MusicMood, MusicSelectionMode } from "../../types";
import { getFolderFromMood } from "@/services/ai/musicSelection";

/**
 * 🛠 تنظیمات پروکسی اختصاصی Cloudflare
 */
const CLOUDFLARE_WORKER_URL: string = "https://plain-tooth-75c3.jujube-bros.workers.dev/";

interface SmartMusicFinderProps {
  currentSubject: string;
  musicMood: MusicMood; // 🆕 NEW: Added musicMood prop
  musicSelectionMode: MusicSelectionMode; // 🆕 NEW: Added mode prop
  onSelectTrack: (url: string, title: string) => void;
  disabled?: boolean;
}

type SearchState = "IDLE" | "SEARCHING" | "DOWNLOADING" | "READY" | "ERROR";
type SourceType = "BACKEND" | "AI_SEARCH" | "FALLBACK";

const SmartMusicFinder: React.FC<SmartMusicFinderProps> = ({
  currentSubject,
  musicMood,
  musicSelectionMode,
  onSelectTrack,
  disabled,
}) => {
  const [state, setState] = useState<SearchState>("IDLE");
  const [statusMsg, setStatusMsg] = useState("");
  const [track, setTrack] = useState<SmartMusicTrack | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [proxyType, setProxyType] = useState<"CF_WORKER" | "PUBLIC_CORS" | "INTERNAL" | "BACKEND">(
    "INTERNAL"
  );
  const [sourceType, setSourceType] = useState<SourceType>("BACKEND");
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const clearLocalUrl = () => {
    if (localUrl) {
      URL.revokeObjectURL(localUrl);
      setLocalUrl(null);
    }
  };

  useEffect(() => {
    return () => clearLocalUrl();
  }, []);

  const fetchAudioBlob = async (url: string): Promise<string | null> => {
    const proxyList = [];

    if (CLOUDFLARE_WORKER_URL) {
      const cleanCfUrl = CLOUDFLARE_WORKER_URL.endsWith("/")
        ? CLOUDFLARE_WORKER_URL.slice(0, -1)
        : CLOUDFLARE_WORKER_URL;
      proxyList.push({
        url: `${cleanCfUrl}?url=${encodeURIComponent(url)}`,
        type: "CF_WORKER" as const,
      });
    }

    proxyList.push({
      url: `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      type: "PUBLIC_CORS" as const,
    });
    proxyList.push({ url: `https://corsproxy.io/?${encodeURIComponent(url)}`, type: "PUBLIC_CORS" as const });

    for (const proxy of proxyList) {
      setProxyType(proxy.type);
      setStatusMsg(`Syncing via ${proxy.type}...`);

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        const response = await fetch(proxy.url, {
          signal: controller.signal,
          headers: { Accept: "audio/mpeg, audio/mp3, audio/*" },
        });

        clearTimeout(timeout);

        if (!response.ok) continue;

        const blob = await response.blob();
        if (blob.size > 50000) {
          return URL.createObjectURL(blob);
        }
      } catch (e) {
        console.warn(`${proxy.type} failed or timed out.`);
      }
    }
    return null;
  };

  const handleSearch = async (forceSafe = false, skipBackend = false) => {
    if (!currentSubject && !forceSafe) return;

    setState("SEARCHING");
    setIsPlaying(false);
    clearLocalUrl();

    try {
      let target: SmartMusicTrack | null = null;
      let blobUrl: string | null = null;

      // 🆕 DECISION LOGIC: Check musicSelectionMode
      const useDatabase = musicSelectionMode === MusicSelectionMode.DATABASE;

      // 🥇 Tier 1: Try Backend Database (if mode is DATABASE)
      if (useDatabase && !forceSafe && !skipBackend) {
        setStatusMsg("Loading from Database...");
        setProxyType("BACKEND");
        setSourceType("BACKEND");

        const folderName = getFolderFromMood(musicMood);
        console.log(`🎵 [SmartMusic] Database mode - Loading from folder: ${folderName}`);

        try {
          const backendUrl = await assetApi.getRandomMusicByMood(folderName);
          if (backendUrl) {
            target = { title: `${musicMood} Track`, url: backendUrl, source: "Database" };
            setTrack(target);
            setState("DOWNLOADING");
            setStatusMsg("Downloading from Database...");

            // Direct fetch (no proxy needed for backend)
            const response = await fetch(backendUrl, {
              headers: { "ngrok-skip-browser-warning": "true" },
            });
            if (response.ok) {
              const blob = await response.blob();
              blobUrl = URL.createObjectURL(blob);

              if (blobUrl) {
                console.log(`✅ [SmartMusic] Loaded from database folder: ${folderName}`);
                setLocalUrl(blobUrl);
                setState("READY");
                setStatusMsg(`Database Music Ready (${folderName})`);
                onSelectTrack(blobUrl, target.title);
                return; // Success! Exit here
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️ [SmartMusic] Database failed, falling back...`, error);
        }
      }

      // 🥈 Tier 2: AI Search (if mode is AI_SEARCH or database failed)
      if (!useDatabase || forceSafe) {
        if (forceSafe) {
          setSourceType("FALLBACK");
          const random = SONIC_LIBRARY[Math.floor(Math.random() * SONIC_LIBRARY.length)];
          target = { title: random.title, url: random.url, source: "Internal" };
          setProxyType("INTERNAL");
          setStatusMsg("Mounting Calm Asset...");
        } else {
          setSourceType("AI_SEARCH");
          setStatusMsg("Finding Slow/Medium Rhythm...");
          console.log(`🔍 [SmartMusic] AI mode - Searching for: ${musicMood}`);
          target = await findSmartMusicByMood(musicMood, currentSubject);
        }

        if (target && target.url) {
          setTrack(target);
          setState("DOWNLOADING");

          blobUrl = await fetchAudioBlob(target.url);

          if (blobUrl) {
            console.log(`✅ [SmartMusic] Loaded from ${forceSafe ? "fallback" : "AI search"}`);
            setLocalUrl(blobUrl);
            setState("READY");
            setStatusMsg("Ambient Ready");
            onSelectTrack(blobUrl, target.title);
          } else {
            if (!forceSafe) handleSearch(true);
            else setState("ERROR");
          }
        } else {
          handleSearch(true);
        }
      }
    } catch (e) {
      console.error("Critical Failure in Sonic Bridge:", e);
      handleSearch(true);
    }
  };

  const togglePreview = () => {
    if (!localUrl || !audioPreviewRef.current) return;
    if (isPlaying) {
      audioPreviewRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPreviewRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => handleSearch(true));
    }
  };

  const isAiMode = musicSelectionMode === MusicSelectionMode.AI_SEARCH;

  return (
    <div className="w-full bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
      <audio
        ref={audioPreviewRef}
        src={localUrl || ""}
        onEnded={() => setIsPlaying(false)}
        crossOrigin="anonymous"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400">
          {isAiMode ? (
            <Server
              className={`w-3.5 h-3.5 ${
                state === "SEARCHING" || state === "DOWNLOADING" ? "animate-pulse" : ""
              }`}
            />
          ) : (
            <Database
              className={`w-3.5 h-3.5 ${
                state === "SEARCHING" || state === "DOWNLOADING" ? "animate-pulse" : ""
              }`}
            />
          )}
          <span className="text-[10px] font-black uppercase tracking-widest">
            {isAiMode ? "AI Music Discovery" : `Database: ${getFolderFromMood(musicMood)}`}
          </span>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
            proxyType === "BACKEND"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : proxyType === "CF_WORKER"
              ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
              : proxyType === "PUBLIC_CORS"
              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
              : "bg-zinc-500/10 border-zinc-500/20 text-zinc-400"
          }`}
        >
          {proxyType === "BACKEND"
            ? "LOCAL_DB"
            : proxyType === "CF_WORKER"
            ? "AI_SEARCH"
            : proxyType === "PUBLIC_CORS"
            ? "PROXY_FETCH"
            : "FALLBACK"}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleSearch(false)}
          disabled={disabled || state === "SEARCHING" || state === "DOWNLOADING"}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-[10px] font-black text-indigo-300 uppercase tracking-widest transition-all disabled:opacity-30 shadow-lg shadow-indigo-900/10"
        >
          {state === "SEARCHING" || state === "DOWNLOADING" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isAiMode ? (
            <Search className="w-3.5 h-3.5" />
          ) : (
            <Database className="w-3.5 h-3.5" />
          )}
          {isAiMode ? "Find AI Music" : "Load from DB"}
        </button>

        <button
          onClick={() => handleSearch(true)}
          disabled={disabled || state === "SEARCHING" || state === "DOWNLOADING"}
          title="Safe Fallback"
          className="px-3 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-xl text-zinc-400 transition-all"
        >
          <RefreshCw
            className={`w-4 h-4 ${state === "SEARCHING" || state === "DOWNLOADING" ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {(state === "SEARCHING" || state === "DOWNLOADING") && (
        <div className="flex items-center justify-between p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-3">
            <Download className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
            <span className="text-[10px] text-indigo-300 font-mono uppercase">{statusMsg}</span>
          </div>
          <button
            onClick={() => handleSearch(true)}
            className="text-[9px] text-indigo-400/50 hover:text-indigo-400 flex items-center gap-1 uppercase font-bold"
          >
            <SkipForward className="w-3 h-3" /> Skip
          </button>
        </div>
      )}

      {state === "READY" && track && localUrl && (
        <div className="bg-zinc-950/60 border border-white/10 rounded-xl p-3 flex items-center justify-between animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={togglePreview}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg transition-all ${
                isPlaying ? "bg-red-500 shadow-red-500/20" : "bg-indigo-600 shadow-indigo-500/20"
              }`}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-1" />
              )}
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-zinc-100 truncate pr-2 leading-tight">
                {track.title}
              </span>
              <span className="text-[9px] text-emerald-500 font-mono flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3 h-3" />
                {isAiMode ? "AI_DISCOVERED" : `DB_${getFolderFromMood(musicMood).toUpperCase()}`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-[10px] font-black uppercase">
            <Check className="w-3.5 h-3.5" /> Applied
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartMusicFinder;
