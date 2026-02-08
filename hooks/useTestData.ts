import { useCallback } from "react";
import { useTestMode } from "../contexts/TestModeContext";
import { DocumentaryProject, ProjectStatus, Chapter } from "../types";

/**
 * Hook برای استفاده از داده‌های تست به جای تولید AI
 */
export const useTestData = () => {
  const { isTestMode, selectedTestProject } = useTestMode();

  /**
   * تبدیل TestProject به DocumentaryProject
   */
  const convertToDocumentaryProject = useCallback((testProject: any): DocumentaryProject => {
    const chapters: Chapter[] = testProject.chapters.map((ch: any, index: number) => ({
      id: `test-chapter-${index}`,
      title: ch.title,
      narrativeText: ch.narrativeText,
      imageUrl: ch.imageUrl,
      imagePrompt: ch.narrativeText, // از متن روایت به عنوان پرامپت استفاده می‌کنیم
      musicUrl: null,
      duration: ch.duration,
      pieceCount: 500, // پیش‌فرض
      shape: "CLASSIC",
      material: "Classic Cardboard",
      movement: "SMOOTH",
      background: "DARK",
      status: "PENDING",
    }));

    return {
      id: testProject.id,
      topic: testProject.title,
      genre: testProject.genre,
      narrativeLens: "HIDDEN_DISCOVERY",
      masterVisualStyle: "CINEMATIC",
      targetDuration: testProject.totalDuration,
      chapters,
      status: ProjectStatus.READY,
      createdAt: Date.now(),
    };
  }, []);

  /**
   * گرفتن پروژه تست (اگر تست مود فعال باشه)
   */
  const getTestProject = useCallback((): DocumentaryProject | null => {
    if (!isTestMode || !selectedTestProject) {
      return null;
    }
    return convertToDocumentaryProject(selectedTestProject);
  }, [isTestMode, selectedTestProject, convertToDocumentaryProject]);

  /**
   * شبیه‌سازی تولید سریع (بدون تاخیر AI)
   */
  const simulateGeneration = useCallback(
    async (onProgress?: (step: string) => void): Promise<DocumentaryProject | null> => {
      if (!isTestMode || !selectedTestProject) {
        return null;
      }

      // شبیه‌سازی مراحل تولید
      const steps = [
        "Scanning test data...",
        "Loading sample images...",
        "Preparing narratives...",
        "Building chapters...",
        "Finalizing project...",
      ];

      for (const step of steps) {
        if (onProgress) onProgress(step);
        // تاخیر کوچک برای UX بهتر
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      return convertToDocumentaryProject(selectedTestProject);
    },
    [isTestMode, selectedTestProject, convertToDocumentaryProject]
  );

  return {
    isTestMode,
    hasTestProject: !!selectedTestProject,
    getTestProject,
    simulateGeneration,
  };
};
