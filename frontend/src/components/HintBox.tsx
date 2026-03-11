import { useState } from "react";
import { fetchHint, explainCommand } from "../api/client";
import type { LessonStep } from "../types";

interface HintBoxProps {
  currentStep: LessonStep | null;
  lessonId: number;
  lastCommand: string;
}

export function HintBox({ currentStep, lessonId, lastCommand }: HintBoxProps) {
  const [hint, setHint] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleHint = async () => {
    if (!currentStep) return;
    setLoading(true);
    setHint("");
    setExplanation("");
    try {
      const h = await fetchHint(
        lessonId,
        currentStep.id,
        currentStep.instruction,
        currentStep.expected_command_prefix
      );
      setHint(h);
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async () => {
    if (!lastCommand) return;
    setLoading(true);
    setHint("");
    setExplanation("");
    try {
      const e = await explainCommand(lastCommand);
      setExplanation(e);
    } finally {
      setLoading(false);
    }
  };

  const text = hint || explanation;
  const textColor = hint ? "#d29922" : "#58a6ff";

  return (
    <div
      style={{
        background: "#0d1117",
        border: "1px solid #30363d",
        borderRadius: 8,
        padding: "12px 16px",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        fontFamily: "system-ui, sans-serif",
        minHeight: 64,
      }}
    >
      <div style={{ display: "flex", gap: 8, flexShrink: 0, paddingTop: 2 }}>
        <button
          onClick={handleHint}
          disabled={loading || !currentStep}
          style={btnStyle("#d29922")}
        >
          {loading && hint === "" && explanation === "" ? "..." : "ヒント"}
        </button>
        <button
          onClick={handleExplain}
          disabled={loading || !lastCommand}
          style={btnStyle("#58a6ff")}
        >
          {loading ? "..." : "解説"}
        </button>
      </div>

      <div style={{ flex: 1 }}>
        {loading && (
          <span style={{ color: "#8b949e", fontSize: 13 }}>AIが考えています...</span>
        )}
        {!loading && text && (
          <p
            style={{
              margin: 0,
              color: textColor,
              fontSize: 13,
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {text}
          </p>
        )}
        {!loading && !text && (
          <span style={{ color: "#6e7681", fontSize: 13 }}>
            「ヒント」でAIのヒントを表示 ／ 「解説」で直前のコマンドを解説します
          </span>
        )}
      </div>
    </div>
  );
}

function btnStyle(color: string): React.CSSProperties {
  return {
    padding: "5px 12px",
    background: "transparent",
    border: `1px solid ${color}`,
    borderRadius: 5,
    color,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap",
  };
}
