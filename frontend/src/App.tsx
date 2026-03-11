import { useState, useEffect, useCallback } from "react";
import { Terminal } from "./components/Terminal";
import { GitTree } from "./components/GitTree";
import { LessonPanel } from "./components/LessonPanel";
import { HintBox } from "./components/HintBox";
import { createSession, fetchLessons, runCommand } from "./api/client";
import type { Lesson, GitState, TerminalLine } from "./types";

const INITIAL_GIT_STATE: GitState = {
  initialized: false,
  current_branch: "main",
  branches: {},
  commits: [],
  staged_files: [],
  working_files: [],
};

export default function App() {
  const [sessionId, setSessionId] = useState<string>("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState(1);
  const [currentStepId, setCurrentStepId] = useState(1);
  const [gitState, setGitState] = useState<GitState>(INITIAL_GIT_STATE);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [lastCommand, setLastCommand] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const storedId = sessionStorage.getItem("git-dojo-session");
    const initSession = async () => {
      const { session_id, git_state } = await createSession();
      sessionStorage.setItem("git-dojo-session", session_id);
      setSessionId(session_id);
      setGitState(git_state);
    };
    if (storedId) {
      setSessionId(storedId);
    } else {
      initSession();
    }
    fetchLessons().then(setLessons);
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

  const handleSelectLesson = (lessonId: number) => {
    setCurrentLessonId(lessonId);
    setCurrentStepId(1);
    setLines([]);
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
        {sessionId && (
          <span style={{ marginLeft: "auto", color: "#8b949e", fontSize: 11 }}>
            session: {sessionId.slice(0, 8)}
          </span>
        )}
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
          minHeight: 0,
          height: "calc(100vh - 47px)",
          boxSizing: "border-box",
        }}
      >
        {/* Lesson panel */}
        <div style={{ gridColumn: 1, gridRow: 1 }}>
          <LessonPanel
            lessons={lessons}
            currentLessonId={currentLessonId}
            currentStepId={currentStepId}
            completedSteps={completedSteps}
            onSelectLesson={handleSelectLesson}
          />
        </div>

        {/* Terminal */}
        <div
          style={{
            gridColumn: 2,
            gridRow: 1,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ flex: 1 }}>
            <Terminal lines={lines} onCommand={handleCommand} disabled={busy} />
          </div>
        </div>

        {/* Git tree */}
        <div style={{ gridColumn: 3, gridRow: 1 }}>
          <GitTree gitState={gitState} />
        </div>

        {/* AI hint bar - full width */}
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
