import type { GitState, Commit } from "../types";

interface GitTreeProps {
  gitState: GitState;
}

const COLORS = ["#bc8cff", "#58a6ff", "#3fb950", "#d29922", "#f85149"];
const NODE_R = 10;
const ROW_H = 52;
const COL_W = 32;
const PAD_X = 20;
const PAD_Y = 24;

function branchColor(branch: string, index: number) {
  if (branch === "main" || branch === "master") return COLORS[0];
  return COLORS[index % COLORS.length];
}

export function GitTree({ gitState }: GitTreeProps) {
  if (!gitState.initialized) {
    return (
      <div style={containerStyle}>
        <p style={{ color: "#8b949e", textAlign: "center", paddingTop: 40 }}>
          git init を実行すると<br />ここにグラフが表示されます
        </p>
      </div>
    );
  }

  const { commits, branches, current_branch } = gitState;

  if (commits.length === 0) {
    return (
      <div style={containerStyle}>
        <p style={{ color: "#8b949e", textAlign: "center", paddingTop: 40 }}>
          まだコミットがありません
        </p>
      </div>
    );
  }

  // Assign column per branch
  const branchOrder: string[] = [];
  for (const c of commits) {
    if (!branchOrder.includes(c.branch)) branchOrder.push(c.branch);
  }

  const branchCol: Record<string, number> = {};
  branchOrder.forEach((b, i) => { branchCol[b] = i; });

  // Map commit id -> position
  const pos: Record<string, { x: number; y: number }> = {};
  const byBranch: Record<string, Commit[]> = {};
  for (const c of commits) {
    if (!byBranch[c.branch]) byBranch[c.branch] = [];
    byBranch[c.branch].push(c);
  }

  let rowCounter = 0;
  // Assign rows from root to tip (reverse commit order = oldest first)
  const ordered = [...commits].reverse();
  ordered.forEach((c) => {
    const col = branchCol[c.branch] ?? 0;
    pos[c.id] = { x: PAD_X + col * COL_W, y: PAD_Y + rowCounter * ROW_H };
    rowCounter++;
  });

  const svgH = PAD_Y * 2 + rowCounter * ROW_H;
  const svgW = PAD_X * 2 + Math.max(1, branchOrder.length) * COL_W;

  const headCommitId = branches[current_branch];

  return (
    <div style={containerStyle}>
      <div
        style={{
          background: "#161b22",
          borderBottom: "1px solid #30363d",
          padding: "6px 12px",
          fontSize: 12,
          color: "#8b949e",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ color: "#bc8cff" }}>◆</span> Git グラフ
        <span style={{ marginLeft: "auto", color: "#58a6ff" }}>
          HEAD → {current_branch}
        </span>
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        <svg
          width={svgW}
          height={svgH}
          style={{ display: "block", minWidth: "100%" }}
        >
          {/* Branch labels at top */}
          {branchOrder.map((b, i) => (
            <text
              key={b}
              x={PAD_X + i * COL_W}
              y={14}
              textAnchor="middle"
              fontSize={10}
              fill={branchColor(b, i)}
            >
              {b}
            </text>
          ))}

          {/* Edges */}
          {commits.map((c) => {
            if (!c.parent_id) return null;
            const from = pos[c.id];
            const to = pos[c.parent_id];
            if (!from || !to) return null;
            return (
              <line
                key={`edge-${c.id}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#30363d"
                strokeWidth={2}
              />
            );
          })}

          {/* Nodes */}
          {commits.map((c) => {
            const p = pos[c.id];
            if (!p) return null;
            const col = branchCol[c.branch] ?? 0;
            const color = branchColor(c.branch, col);
            const isHead = c.id === headCommitId;
            const displayMsg = c.message.split("||files||")[0];
            return (
              <g key={c.id}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={NODE_R}
                  fill={isHead ? color : "#0d1117"}
                  stroke={color}
                  strokeWidth={2}
                />
                {isHead && (
                  <circle cx={p.x} cy={p.y} r={NODE_R + 4} fill="none" stroke={color} strokeWidth={1} strokeDasharray="3,2" />
                )}
                <text
                  x={p.x + NODE_R + 8}
                  y={p.y + 4}
                  fontSize={11}
                  fill="#c9d1d9"
                >
                  {c.id.slice(0, 7)} {displayMsg.slice(0, 20)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Branch list */}
      <div
        style={{
          borderTop: "1px solid #30363d",
          padding: "8px 12px",
          fontSize: 12,
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        {Object.keys(branches).map((b, i) => (
          <span
            key={b}
            style={{
              background: b === current_branch ? "#1f6feb" : "#21262d",
              color: branchColor(b, i),
              padding: "2px 8px",
              borderRadius: 4,
              border: `1px solid ${branchColor(b, i)}44`,
            }}
          >
            {b === current_branch ? "* " : ""}{b}
          </span>
        ))}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  background: "#0d1117",
  border: "1px solid #30363d",
  borderRadius: 8,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  fontFamily: "'Fira Code', monospace",
  overflow: "hidden",
};
