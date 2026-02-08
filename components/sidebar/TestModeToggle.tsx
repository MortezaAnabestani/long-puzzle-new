import React, { useState } from "react";
import { Zap, ChevronDown, Check } from "lucide-react";
import { TEST_PROJECTS, TestProject } from "../../utils/testModeData";

interface TestModeToggleProps {
  isTestMode: boolean;
  onToggle: () => void;
  onSelectTestProject: (project: TestProject) => void;
  disabled?: boolean;
}

const TestModeToggle: React.FC<TestModeToggleProps> = ({
  isTestMode,
  onToggle,
  onSelectTestProject,
  disabled,
}) => {
  const [showProjectList, setShowProjectList] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleSelectProject = (project: TestProject) => {
    setSelectedProjectId(project.id);
    onSelectTestProject(project);
    setShowProjectList(false);
  };

  return (
    <div className="w-full space-y-2">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-3 p-3 rounded-xl border transition-all
          ${
            isTestMode
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-lg shadow-amber-900/10"
              : "bg-zinc-900/30 border-white/5 text-zinc-500 hover:text-zinc-200 hover:border-zinc-700"
          }
          disabled:opacity-30 disabled:cursor-not-allowed
        `}
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-4 h-4 ${isTestMode ? "animate-pulse" : ""}`}></div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-black uppercase tracking-widest">Test Mode</span>
            <span className="text-[8px] text-zinc-600 font-mono tracking-wider">
              {isTestMode ? "Using Sample Data" : "AI Generation Active"}
            </span>
          </div>
        </div>
        <div
          className={`
          w-12 h-6 rounded-full transition-all
          ${isTestMode ? "bg-amber-500" : "bg-zinc-800"}
        `}
        >
          <div
            className={`
            w-5 h-5 bg-white rounded-full mt-0.5 transition-transform
            ${isTestMode ? "translate-x-6" : "translate-x-0.5"}
          `}
          />
        </div>
      </button>

      {/* Project Selector */}
      {isTestMode && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          <button
            onClick={() => setShowProjectList(!showProjectList)}
            className="w-full flex items-center justify-between p-2.5 bg-amber-900/10 border border-amber-500/20 rounded-lg text-left hover:bg-amber-900/20 transition-all"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                {selectedProjectId
                  ? TEST_PROJECTS.find((p) => p.id === selectedProjectId)?.title
                  : "انتخاب پروژه تست"}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-amber-500 transition-transform ${
                showProjectList ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Project List Dropdown */}
          {showProjectList && (
            <div className="mt-2 bg-zinc-950 border border-amber-500/20 rounded-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200">
              {TEST_PROJECTS.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  className={`
                    w-full text-left p-3 border-b border-white/5 transition-all
                    ${
                      selectedProjectId === project.id
                        ? "bg-amber-500/20 text-amber-300"
                        : "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                    }
                    last:border-b-0
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold truncate">{project.title}</span>
                        {selectedProjectId === project.id && (
                          <Check className="w-3 h-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-zinc-600">
                        <span>{project.chapters.length} فصل</span>
                        <span>•</span>
                        <span>{Math.floor(project.totalDuration / 60)} دقیقه</span>
                        <span>•</span>
                        <span className="text-amber-500/70">{project.genre}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info Banner */}
      {isTestMode && (
        <div className="p-2.5 bg-amber-950/20 border border-amber-500/10 rounded-lg animate-in fade-in duration-300">
          <p className="text-[9px] text-amber-400/70 leading-relaxed">
            <span className="font-bold text-amber-400">🧪 حالت تست فعال:</span> از عکس‌ها و متن‌های آماده
            استفاده می‌شود. هیچ فراخوانی به API انجام نمی‌شود.
          </p>
        </div>
      )}
    </div>
  );
};

export default TestModeToggle;
