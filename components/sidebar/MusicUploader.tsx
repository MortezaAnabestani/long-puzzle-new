import React, { useRef, useState } from 'react';
import { Music, Plus, Trash2, CheckCircle, Circle, Headphones, Globe, FileAudio, CloudLightning } from 'lucide-react';
import SectionLabel from '../ui/SectionLabel';
import SonicGallery from './SonicGallery';

export interface MusicTrack {
  id: string;
  name: string;
  url: string;
  file?: File;
  source?: 'manual' | 'backend' | 'ai'; // منبع موسیقی
}

interface MusicUploaderProps {
  tracks: MusicTrack[];
  selectedTrackId: string | null;
  onAddTracks: (files: FileList) => void;
  onAddCloudTrack: (url: string, title: string) => void;
  onSelectTrack: (id: string | null) => void;
  onRemoveTrack: (id: string) => void;
  disabled?: boolean;
}

const MusicUploader: React.FC<MusicUploaderProps> = ({ 
  tracks, 
  selectedTrackId, 
  onAddTracks,
  onAddCloudTrack,
  onSelectTrack, 
  onRemoveTrack,
  disabled 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGallery, setShowGallery] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddTracks(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <section className="space-y-4 font-sans">
      {/* Header Section: Functional Toolbar Style */}
      <div className="flex justify-between items-end border-b border-slate-800 pb-2">
        <SectionLabel icon={<Music className="w-3.5 h-3.5" />}>مدیریت منابع صوتی</SectionLabel>
        <button 
          onClick={() => setShowGallery(true)}
          disabled={disabled}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors disabled:opacity-50 group"
        >
          <Globe className="w-3 h-3 text-blue-500 group-hover:text-blue-400" />
          <span className="text-[10px] font-medium text-slate-300 uppercase tracking-wide">Cloud Library</span>
        </button>
      </div>
      
      <div className="space-y-3">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="audio/mp3,audio/wav,audio/mpeg" 
          multiple
          onChange={handleFileChange}
        />
        
        {/* Upload Trigger: Compact Dashed Area */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="w-full h-10 flex items-center justify-center gap-2 border border-dashed border-slate-700 rounded-md hover:bg-slate-800/30 hover:border-slate-500 transition-all group disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
          <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200">
            آپلود فایل محلی <span className="font-mono text-[10px] opacity-50 ml-1">(MP3/WAV)</span>
          </span>
        </button>

        {/* Track List: Data Grid Style */}
        <div className="border border-slate-800 rounded-md bg-slate-950/30 overflow-hidden">
          {tracks && tracks.length > 0 ? (
            <div className="divide-y divide-slate-800/50 max-h-64 overflow-y-auto custom-scrollbar">
              {tracks.map((track) => {
                const isSelected = selectedTrackId === track.id;
                return (
                  <div 
                    key={track.id}
                    className={`group flex items-center justify-between p-2 pl-3 transition-all duration-200 ${
                      isSelected 
                        ? 'bg-[#007acc]/10 border-l-2 border-l-[#007acc]' 
                        : 'hover:bg-slate-900 border-l-2 border-l-transparent'
                    }`}
                  >
                    <button 
                      onClick={() => onSelectTrack(isSelected ? null : track.id)}
                      disabled={disabled}
                      className="flex-1 flex items-center gap-3 text-right overflow-hidden min-w-0"
                    >
                      <div className={`shrink-0 transition-colors ${isSelected ? 'text-[#007acc]' : 'text-slate-600 group-hover:text-slate-500'}`}>
                        {isSelected ? <CheckCircle className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                      </div>
                      
                      <div className="flex items-center gap-2 overflow-hidden w-full">
                        {track.file ? (
                          <FileAudio className="w-3 h-3 text-slate-500 shrink-0" />
                        ) : (
                          <CloudLightning className="w-3 h-3 text-indigo-400 shrink-0" />
                        )}
                        <span className={`text-[11px] font-medium truncate ${isSelected ? 'text-blue-100' : 'text-slate-400 group-hover:text-slate-300'}`}>
                          {track.name}
                        </span>
                      </div>
                    </button>
                    
                    <div className="flex items-center gap-3 pl-1">
                      <span className="font-mono text-[9px] text-slate-600 hidden sm:block uppercase tracking-wider">
                        {track.file ? 'LOCAL' : 'STREAM'}
                      </span>
                      <button 
                        onClick={() => onRemoveTrack(track.id)}
                        disabled={disabled}
                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center opacity-50">
              <Headphones className="w-6 h-6 text-slate-700 mb-2" />
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">No Audio Source</span>
            </div>
          )}
        </div>

        {/* Status Bar: Technical Alert */}
        {selectedTrackId && (
          <div className="flex items-start gap-2 px-3 py-2 bg-[#007acc]/5 border border-[#007acc]/20 rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-[#007acc] mt-1.5 animate-pulse shrink-0" />
            <p className="text-[10px] text-blue-400/90 font-medium leading-relaxed">
              <span className="font-bold text-[#007acc]">LOCKED:</span> فایل صوتی انتخاب شده به عنوان منبع اصلی برای تمام خروجی‌ها استفاده خواهد شد.
            </p>
          </div>
        )}
      </div>

      {showGallery && (
        <SonicGallery 
          activeUrl={tracks.find(t => t.id === selectedTrackId)?.url || null}
          onClose={() => setShowGallery(false)}
          onSelect={(url, title) => onAddCloudTrack(url, title)}
        />
      )}
    </section>
  );
};

export default MusicUploader;