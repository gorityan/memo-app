import { useState, useRef, useEffect, KeyboardEvent } from "react";
import type { TerminalLine } from "../types";

interface TerminalProps {
  lines: TerminalLine[];
  onCommand: (command: string) => void;
  disabled?: boolean;
}

const lineColor: Record<TerminalLine["type"], string> = {
  input: "#58a6ff",
  output: "#c9d1d9",
  success: "#3fb950",
  error: "#f85149",
  info: "#d29922",
};

export function Terminal({ lines, onCommand, disabled = false }: TerminalProps) {
  const [input, setInput] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputHistory = useRef<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const submit = () => {
    const cmd = input.trim();
    if (!cmd) return;
    inputHistory.current = [cmd, ...inputHistory.current.slice(0, 49)];
    setHistoryIndex(-1);
    setInput("");
    onCommand(cmd);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      submit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(historyIndex + 1, inputHistory.current.length - 1);
      setHistoryIndex(next);
      setInput(inputHistory.current[next] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(historyIndex - 1, -1);
      setHistoryIndex(next);
      setInput(next === -1 ? "" : (inputHistory.current[next] ?? ""));
    }
  };

  return (
    <div
      style={{
        background: "#0d1117",
        borderRadius: 8,
        border: "1px solid #30363d",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
        fontSize: 13,
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Title bar */}
      <div
        style={{
          background: "#161b22",
          borderBottom: "1px solid #30363d",
          padding: "6px 12px",
          borderRadius: "8px 8px 0 0",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ color: "#f85149", fontSize: 10 }}>●</span>
        <span style={{ color: "#d29922", fontSize: 10 }}>●</span>
        <span style={{ color: "#3fb950", fontSize: 10 }}>●</span>
        <span style={{ color: "#8b949e", marginLeft: 8, fontSize: 12 }}>git-dojo ~ terminal</span>
      </div>

      {/* Output area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {lines.length === 0 && (
          <p style={{ color: "#8b949e", margin: 0 }}>
            左のレッスンを確認して、コマンドを入力してください。
          </p>
        )}
        {lines.map((line, i) => (
          <div key={i} style={{ marginBottom: 2 }}>
            {line.type === "input" && (
              <span style={{ color: "#8b949e" }}>$ </span>
            )}
            <span
              style={{
                color: lineColor[line.type],
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {line.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div
        style={{
          borderTop: "1px solid #30363d",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ color: "#3fb950", flexShrink: 0 }}>$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? "処理中..." : "git コマンドを入力..."}
          autoFocus
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#58a6ff",
            fontFamily: "inherit",
            fontSize: "inherit",
          }}
        />
      </div>
    </div>
  );
}
