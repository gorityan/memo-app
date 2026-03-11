import type {
  CommandResponse,
  GitState,
  Lesson,
} from "../types";

const BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? "http://localhost:8000/api"
  : "/api";

export async function createSession(): Promise<{ session_id: string; git_state: GitState }> {
  const res = await fetch(`${BASE}/session/new`, { method: "POST" });
  return res.json();
}

export async function fetchLessons(): Promise<Lesson[]> {
  const res = await fetch(`${BASE}/lessons`);
  return res.json();
}

export async function runCommand(
  sessionId: string,
  command: string,
  lessonId: number,
  stepId: number
): Promise<CommandResponse> {
  const res = await fetch(`${BASE}/git/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      command,
      lesson_id: lessonId,
      step_id: stepId,
    }),
  });
  return res.json();
}

export async function fetchHint(
  lessonId: number,
  stepId: number,
  instruction: string,
  expectedCommandPrefix: string
): Promise<string> {
  const res = await fetch(`${BASE}/ai/hint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lesson_id: lessonId,
      step_id: stepId,
      instruction,
      expected_command_prefix: expectedCommandPrefix,
    }),
  });
  const data = await res.json();
  return data.hint;
}

export async function writeFile(
  sessionId: string,
  filename: string,
  content: string
): Promise<{ ok: boolean; git_state: GitState }> {
  const res = await fetch(`${BASE}/file/write`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, filename, content }),
  });
  return res.json();
}

export async function deleteFile(
  sessionId: string,
  filename: string
): Promise<{ ok: boolean; git_state: GitState }> {
  const res = await fetch(`${BASE}/file/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, filename }),
  });
  return res.json();
}

export async function explainCommand(command: string): Promise<string> {
  const res = await fetch(`${BASE}/ai/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command }),
  });
  const data = await res.json();
  return data.explanation;
}
