export interface Commit {
  id: string;
  message: string;
  parent_id: string | null;
  branch: string;
}

export interface GitState {
  initialized: boolean;
  current_branch: string;
  branches: Record<string, string | null>;
  commits: Commit[];
  staged_files: string[];
  working_files: string[];
  conflicted_files: string[];
  merge_in_progress_branch: string | null;
  file_contents: Record<string, string>;
}

export interface LessonStep {
  id: number;
  instruction: string;
  hint: string;
  expected_command_prefix: string;
  explanation: string;
  adds_files: string[];
  initial_file_contents: Record<string, string>;
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  steps: LessonStep[];
}

export interface CommandResponse {
  output: string;
  success: boolean;
  correct: boolean;
  step_completed: boolean;
  git_state: GitState;
}

export interface TerminalLine {
  type: "input" | "output" | "success" | "error" | "info";
  text: string;
}
