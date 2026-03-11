import { useState, useEffect, useRef } from "react";
import type { GitState } from "../types";

interface FileEditorProps {
  gitState: GitState;
  onFileChange: (filename: string, content: string) => void;
  onFileDelete: (filename: string) => Promise<void>;
}

export function FileEditor({ gitState, onFileChange, onFileDelete }: FileEditorProps) {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [editContents, setEditContents] = useState<Record<string, string>>({});
  const [newFilename, setNewFilename] = useState("");
  const [newFileError, setNewFileError] = useState<string | null>(null);
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when gitState.file_contents changes (e.g. conflict markers added)
  useEffect(() => {
    setEditContents(prev => {
      const next = { ...prev };
      for (const [filename, content] of Object.entries(gitState.file_contents)) {
        next[filename] = content;
      }
      return next;
    });
    // If active file was removed from working files, deselect it
    if (activeFile && !gitState.working_files.includes(activeFile)) {
      setActiveFile(gitState.working_files[0] ?? null);
    }
    // Auto-select first file
    if (!activeFile && gitState.working_files.length > 0) {
      setActiveFile(gitState.working_files[0]);
    }
  }, [gitState.file_contents, gitState.working_files]);

  // Auto-select first file on mount
  useEffect(() => {
    if (!activeFile && gitState.working_files.length > 0) {
      setActiveFile(gitState.working_files[0]);
    }
  }, []);

  const handleEdit = (filename: string, content: string) => {
    setEditContents(prev => ({ ...prev, [filename]: content }));
    // Debounced save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onFileChange(filename, content);
    }, 500);
  };

  const getFileStatus = (filename: string) => {
    if (gitState.conflicted_files.includes(filename)) return "conflict";
    if (gitState.staged_files.includes(filename)) return "staged";
    return "normal";
  };

  const statusColor: Record<string, string> = {
    conflict: "#f85149",
    staged: "#3fb950",
    normal: "#c9d1d9",
  };

  const activeContent = activeFile ? (editContents[activeFile] ?? gitState.file_contents[activeFile] ?? "") : "";
  const hasConflictMarkers = activeContent.includes("<<<<<<<");
  const visibleFiles = gitState.working_files.filter((filename) => !pendingDeletes.has(filename));
  const placeholderText = visibleFiles.length === 0
    ? "ファイルがありません。左上で新しいファイルを作成してください。"
    : "ファイルを選択してください";

  const createNewFile = () => {
    const name = newFilename.trim();
    if (!name) {
      setNewFileError("ファイル名を入力してください");
      return;
    }
    if (gitState.working_files.includes(name)) {
      setNewFileError("すでに存在するファイル名です");
      return;
    }
    setNewFileError(null);
    onFileChange(name, "");
    setActiveFile(name);
    setNewFilename("");
  };

  const handleDeleteFile = async (filename: string) => {
    setPendingDeletes((prev) => new Set(prev).add(filename));

    // Keep UI in sync: if deleting active file, switch to another
    if (filename === activeFile) {
      const idx = gitState.working_files.indexOf(filename);
      const nextFile = gitState.working_files[idx + 1] ?? gitState.working_files[idx - 1] ?? null;
      setActiveFile(nextFile);
    }

    setEditContents(prev => {
      const next = { ...prev };
      delete next[filename];
      return next;
    });

    await onFileDelete(filename);
    setPendingDeletes((prev) => {
      const next = new Set(prev);
      next.delete(filename);
      return next;
    });
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "#0d1117",
      border: "1px solid #30363d",
      borderRadius: 8,
      overflow: "hidden",
    }}>
      {/* Editor title bar */}
      <div style={{
        background: "#161b22",
        borderBottom: "1px solid #30363d",
        padding: "6px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, color: "#8b949e", fontWeight: 600 }}>ファイルエディタ</span>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <input
            value={newFilename}
            onChange={(e) => setNewFilename(e.target.value)}
            placeholder="new-file.txt"
            style={{
              width: 120,
              padding: "2px 6px",
              fontSize: 11,
              borderRadius: 4,
              border: "1px solid #30363d",
              background: "#0d1117",
              color: "#c9d1d9",
            }}
          />
          <button
            onClick={createNewFile}
            style={{
              padding: "4px 10px",
              fontSize: 11,
              borderRadius: 4,
              border: "1px solid #30363d",
              background: "#21262d",
              color: "#c9d1d9",
              cursor: "pointer",
            }}
          >
            作成
          </button>
        </div>

        {gitState.conflicted_files.length > 0 && (
          <span style={{ fontSize: 11, color: "#f85149" }}>
            コンフリクトあり: {gitState.conflicted_files.join(", ")}
          </span>
        )}
      </div>

      {newFileError && (
        <div style={{
          padding: "4px 12px",
          background: "#1a1f26",
          color: "#f85149",
          fontSize: 11,
          borderBottom: "1px solid #30363d",
        }}>
          {newFileError}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: "flex",
        background: "#161b22",
        borderBottom: "1px solid #30363d",
        overflowX: "auto",
        flexShrink: 0,
      }}>
        {visibleFiles.length === 0 ? (
          <span style={{ padding: "6px 12px", fontSize: 12, color: "#c9d1d9" }}>
            ファイルがありません。左上で新しいファイルを作成してください。
          </span>
        ) : (
          visibleFiles.map((filename) => {
            const status = getFileStatus(filename);
            const isActive = filename === activeFile;
            return (
              <button
                key={filename}
                onClick={() => setActiveFile(filename)}
                style={{
                  background: isActive ? "#0d1117" : "transparent",
                  border: "none",
                  borderRight: "1px solid #30363d",
                  borderBottom: isActive ? "2px solid #58a6ff" : "2px solid transparent",
                  color: statusColor[status],
                  padding: "6px 14px",
                  fontSize: 12,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>
                    {status === "conflict" && "[!] "}
                    {status === "staged" && "[+] "}
                    {filename}
                  </span>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(filename);
                    }}
                    title="ファイルを削除"
                    style={{
                      background: "transparent",
                      color: "#8b949e",
                      cursor: "pointer",
                      fontSize: 12,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 16,
                      height: 16,
                    }}
                  >
                    ✕
                  </div>
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Editor area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative" }}>
        {activeFile ? (
          <>
            {hasConflictMarkers && (
              <div style={{
                background: "#1c2128",
                borderBottom: "1px solid #30363d",
                padding: "4px 12px",
                fontSize: 11,
                color: "#f85149",
                flexShrink: 0,
              }}>
                コンフリクトマーカーが検出されました。編集して解消し、git add してください。
              </div>
            )}
            <textarea
              value={activeContent}
              onChange={(e) => handleEdit(activeFile, e.target.value)}
              style={{
                flex: 1,
                background: "#0d1117",
                color: "#c9d1d9",
                border: "none",
                outline: "none",
                padding: "12px",
                fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
                fontSize: 13,
                lineHeight: 1.6,
                resize: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
              spellCheck={false}
            />
          </>
        ) : (
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#c9d1d9",
            fontSize: 14,
            padding: 12,
            textAlign: "center",
          }}>
            {placeholderText}
          </div>
        )}
      </div>
    </div>
  );
}
