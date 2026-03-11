import { useState, useEffect, useCallback } from "react";
import { Terminal } from "./components/Terminal";
import { GitTree } from "./components/GitTree";
import { LessonPanel } from "./components/LessonPanel";
import { HintBox } from "./components/HintBox";
import { FileEditor } from "./components/FileEditor";
import { createSession, fetchLessons, runCommand, writeFile, deleteFile } from "./api/client";
import type { Lesson, GitState, TerminalLine } from "./types";

const INITIAL_GIT_STATE: GitState = {
  initialized: false,
  current_branch: "main",
  branches: {},
  commits: [],
  staged_files: [],
  working_files: [],
  conflicted_files: [],
  merge_in_progress_branch: null,
  file_contents: {},
};

export default function App() {
  const [sessionId, setSessionId] = useState<string>("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState(1);
  const [currentStepId, setCurrentStepId] = useState(1);
  const [resetOnLessonChange, setResetOnLessonChange] = useState(true);
  const [gitState, setGitState] = useState<GitState>(INITIAL_GIT_STATE);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [lastCommand, setLastCommand] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const storedId = sessionStorage.getItem("git-dojo-session");
    const initSession = async () => {
      try {
        const { session_id, git_state } = await createSession();
        sessionStorage.setItem("git-dojo-session", session_id);
        setSessionId(session_id);
        setGitState(git_state);
      } catch (error) {
        console.error("Failed to create session:", error);
      }
    };
    if (storedId) {
      setSessionId(storedId);
      // Fetch the git state for this stored session
      const fetchSessionState = async () => {
        try {
          const res = await fetch(
            typeof window !== 'undefined' && window.location.hostname === 'localhost'
              ? `http://localhost:8000/api/session/${storedId}`
              : `/api/session/${storedId}`
          );
          const data = await res.json();
          setGitState(data.git_state);
        } catch (error) {
          console.error("Failed to fetch session state:", error);
          // If fetch fails, treat as new session
          initSession();
        }
      };
      fetchSessionState();
    } else {
      initSession();
    }
    fetchLessons().then(setLessons);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("git-dojo-reset-on-lesson-change");
    if (stored !== null) {
      setResetOnLessonChange(stored === "true");
    }
  }, []);

  const currentLesson = lessons.find((l) => l.id === currentLessonId) ?? null;
  const currentStep = currentLesson?.steps.find((s) => s.id === currentStepId) ?? null;

  const handleCommand = useCallback(
    async (command: string) => {
      if (!sessionId || busy) return;
      setBusy(true);
      setLastCommand(command);

      setLines((prev) => [...prev, { type: "input", text: command }]);

      try {
        const result = await runCommand(sessionId, command, currentLessonId, currentStepId);

        if (result.output) {
          const type = result.success
            ? result.correct
              ? "success"
              : "output"
            : "error";
          setLines((prev) => [...prev, { type, text: result.output }]);
        }

        setGitState(result.git_state);

        if (result.step_completed) {
          const key = `${currentLessonId}-${currentStepId}`;
          setCompletedSteps((prev) => new Set([...prev, key]));

          const nextStep = currentLesson?.steps.find((s) => s.id === currentStepId + 1);
          if (nextStep) {
            setCurrentStepId((id) => id + 1);
            setLines((prev) => [
              ...prev,
              { type: "info", text: `✓ ステップ ${currentStepId} クリア！次: ${nextStep.instruction}` },
            ]);
          } else {
            setLines((prev) => [
              ...prev,
              { type: "info", text: `🎉 レッスン ${currentLessonId} 完了！` },
            ]);
          }
        }
      } catch {
        setLines((prev) => [
          ...prev,
          { type: "error", text: "サーバーに接続できません。バックエンドが起動しているか確認してください。" },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [sessionId, busy, currentLessonId, currentStepId, currentLesson]
  );

  const handleFileChange = useCallback(
    async (filename: string, content: string) => {
      if (!sessionId) return;
      const result = await writeFile(sessionId, filename, content);
      setGitState(result.git_state);
    },
    [sessionId]
  );

  const handleFileDelete = useCallback(
    async (filename: string) => {
      if (!sessionId) return;
      const result = await deleteFile(sessionId, filename);
      setGitState(result.git_state);
    },
    [sessionId]
  );

  const handleSelectLesson = async (lessonId: number) => {
    if (resetOnLessonChange) {
      // 新しいセッションを作成して git 状態をリセット
      const { session_id, git_state } = await createSession();
      sessionStorage.setItem("git-dojo-session", session_id);
      setSessionId(session_id);
      setGitState(git_state);
      setLines([{ type: "info", text: `レッスン ${lessonId} を開始します。git状態をリセットしました。` }]);
    } else {
      setLines([{ type: "info", text: `レッスン ${lessonId} に切り替えました（git状態は保持）` }]);
    }
    setCurrentLessonId(lessonId);
    setCurrentStepId(1);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#010409",
        color: "#c9d1d9",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "#161b22",
          borderBottom: "1px solid #30363d",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 20, fontWeight: 800, color: "#f0f6fc" }}>
          Git Dojo
        </span>
        <span style={{ color: "#8b949e", fontSize: 13 }}>
          インタラクティブGit学習アプリ
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#8b949e" }}>
            <input
              type="checkbox"
              checked={resetOnLessonChange}
              onChange={(e) => {
                setResetOnLessonChange(e.target.checked);
                localStorage.setItem("git-dojo-reset-on-lesson-change", String(e.target.checked));
              }}
            />
            レッスン切り替えでリセット
          </label>
          {sessionId && (
            <span style={{ color: "#8b949e", fontSize: 11 }}>
              session: {sessionId.slice(0, 8)}
            </span>
          )}
        </div>
      </header>

      {/* Main layout */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "280px 1fr 260px",
          gridTemplateRows: "1fr auto",
          gap: 12,
          padding: 12,
          height: "calc(100vh - 47px)",
          boxSizing: "border-box",
        }}
      >
        {/* Left: Lesson panel */}
        <div style={{ gridColumn: 1, gridRow: 1, overflow: "hidden" }}>
          <LessonPanel
            lessons={lessons}
            currentLessonId={currentLessonId}
            currentStepId={currentStepId}
            completedSteps={completedSteps}
            onSelectLesson={handleSelectLesson}
          />
        </div>

        {/* Center: FileEditor + Terminal stacked */}
        <div style={{ gridColumn: 2, gridRow: 1, display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
          <div style={{ flex: "0 0 40%", minHeight: 0 }}>
            <FileEditor gitState={gitState} onFileChange={handleFileChange} onFileDelete={handleFileDelete} />
          </div>
          <div style={{ flex: "0 0 calc(60% - 8px)", minHeight: 0 }}>
            <Terminal lines={lines} onCommand={handleCommand} disabled={busy} />
          </div>
        </div>

        {/* Right: Git tree */}
        <div style={{ gridColumn: 3, gridRow: 1, overflow: "hidden" }}>
          <GitTree gitState={gitState} />
        </div>

        {/* Bottom: HintBox */}
        <div style={{ gridColumn: "1 / -1", gridRow: 2 }}>
          <HintBox
            currentStep={currentStep}
            lessonId={currentLessonId}
            lastCommand={lastCommand}
          />
        </div>
      </div>
    </div>
  );
}
