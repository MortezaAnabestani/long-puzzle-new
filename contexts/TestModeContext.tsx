import React, { createContext, useContext, useState, useCallback } from "react";
import { TestProject } from "../utils/testModeData";

interface TestModeContextType {
  isTestMode: boolean;
  selectedTestProject: TestProject | null;
  toggleTestMode: () => void;
  setTestProject: (project: TestProject) => void;
  clearTestProject: () => void;
}

const TestModeContext = createContext<TestModeContextType | undefined>(undefined);

export const TestModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTestMode, setIsTestMode] = useState(false);
  const [selectedTestProject, setSelectedTestProject] = useState<TestProject | null>(null);

  const toggleTestMode = useCallback(() => {
    setIsTestMode((prev) => !prev);
    if (isTestMode) {
      // وقتی تست مود غیرفعال میشه، پروژه تست رو پاک کن
      setSelectedTestProject(null);
    }
  }, [isTestMode]);

  const setTestProject = useCallback((project: TestProject) => {
    setSelectedTestProject(project);
    console.log("🧪 [TestMode] Selected test project:", project.title);
  }, []);

  const clearTestProject = useCallback(() => {
    setSelectedTestProject(null);
  }, []);

  return (
    <TestModeContext.Provider
      value={{
        isTestMode,
        selectedTestProject,
        toggleTestMode,
        setTestProject,
        clearTestProject,
      }}
    >
      {children}
    </TestModeContext.Provider>
  );
};

export const useTestMode = () => {
  const context = useContext(TestModeContext);
  if (!context) {
    throw new Error("useTestMode must be used within TestModeProvider");
  }
  return context;
};
