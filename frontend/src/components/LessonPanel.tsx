import type { Lesson } from "../types";

interface LessonPanelProps {
  lessons: Lesson[];
  currentLessonId: number;
  currentStepId: number;
  completedSteps: Set<string>;
  onSelectLesson: (lessonId: number) => void;
}

export function LessonPanel({
  lessons,
  currentLessonId,
  currentStepId,
  completedSteps,
  onSelectLesson,
}: LessonPanelProps) {
  const lesson = lessons.find((l) => l.id === currentLessonId);

  return (
    <div
      style={{
        background: "#0d1117",
        border: "1px solid #30363d",
        borderRadius: 8,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#161b22",
          borderBottom: "1px solid #30363d",
          padding: "10px 14px",
          borderRadius: "8px 8px 0 0",
        }}
      >
        <div style={{ color: "#8b949e", fontSize: 11, marginBottom: 4 }}>GIT DOJO</div>
        <div style={{ color: "#f0f6fc", fontWeight: 700, fontSize: 15 }}>
          レッスン一覧
        </div>
      </div>

      {/* Lesson tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #30363d" }}>
        {lessons.map((l) => (
          <button
            key={l.id}
            onClick={() => onSelectLesson(l.id)}
            style={{
              flex: 1,
              padding: "8px 4px",
              background: l.id === currentLessonId ? "#1f6feb22" : "transparent",
              border: "none",
              borderBottom: l.id === currentLessonId ? "2px solid #1f6feb" : "2px solid transparent",
              color: l.id === currentLessonId ? "#58a6ff" : "#8b949e",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: l.id === currentLessonId ? 700 : 400,
            }}
          >
            {l.id}
          </button>
        ))}
      </div>

      {/* Current lesson */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
        {lessons.length === 0 ? (
          <div style={{ color: "#8b949e", fontSize: 12, marginTop: 20 }}>
            レッスンを読込中...
          </div>
        ) : lesson ? (
          <>
            <div
              style={{
                color: "#f0f6fc",
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 4,
              }}
            >
              {lesson.title}
            </div>
            <div
              style={{
                color: "#8b949e",
                fontSize: 12,
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              {lesson.description}
            </div>

            <div style={{ fontSize: 11, color: "#8b949e", marginBottom: 8 }}>
              ステップ {Math.min(currentStepId, lesson.steps.length)} / {lesson.steps.length}
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: 4,
                background: "#21262d",
                borderRadius: 2,
                marginBottom: 16,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "#1f6feb",
                  borderRadius: 2,
                  width: `${((currentStepId - 1) / lesson.steps.length) * 100}%`,
                  transition: "width 0.3s",
                }}
              />
            </div>

            {lesson.steps.map((step) => {
              const key = `${lesson.id}-${step.id}`;
              const done = completedSteps.has(key);
              const active = step.id === currentStepId;
              return (
                <div
                  key={step.id}
                  style={{
                    marginBottom: 10,
                    padding: "10px 12px",
                    borderRadius: 6,
                    background: active
                      ? "#1f6feb22"
                      : done
                      ? "#1a2d1a"
                      : "#161b22",
                    border: `1px solid ${active ? "#1f6feb" : done ? "#3fb95044" : "#30363d"}`,
                    opacity: done ? 0.7 : 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: 14,
                        marginTop: 1,
                        color: done ? "#3fb950" : active ? "#58a6ff" : "#30363d",
                      }}
                    >
                      {done ? "✓" : active ? "▶" : "○"}
                    </span>
                    <span
                      style={{
                        color: active ? "#f0f6fc" : done ? "#8b949e" : "#6e7681",
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      {step.instruction}
                    </span>
                  </div>

                  {active && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: "6px 10px",
                        background: "#0d1117",
                        borderRadius: 4,
                        color: "#d29922",
                        fontSize: 12,
                      }}
                    >
                      💡 {step.hint}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <div style={{ color: "#8b949e", fontSize: 12, marginTop: 20 }}>
            レッスンが見つかりません
          </div>
        )}
      </div>
    </div>
  );
}
