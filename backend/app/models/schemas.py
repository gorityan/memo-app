from pydantic import BaseModel
from typing import Optional, List, Dict


class Commit(BaseModel):
    id: str
    message: str
    parent_id: Optional[str] = None
    branch: str


class GitState(BaseModel):
    initialized: bool = False
    current_branch: str = "main"
    branches: Dict[str, Optional[str]] = {}
    commits: List[Commit] = []
    staged_files: List[str] = []
    working_files: List[str] = []


class CommandRequest(BaseModel):
    session_id: str
    command: str
    lesson_id: int
    step_id: int


class CommandResponse(BaseModel):
    output: str
    success: bool
    correct: bool
    step_completed: bool
    git_state: GitState


class HintRequest(BaseModel):
    lesson_id: int
    step_id: int
    instruction: str
    expected_command_prefix: str


class HintResponse(BaseModel):
    hint: str


class ExplainRequest(BaseModel):
    command: str


class ExplainResponse(BaseModel):
    explanation: str


class SessionResponse(BaseModel):
    session_id: str
    git_state: GitState


class LessonStep(BaseModel):
    id: int
    instruction: str
    hint: str
    expected_command_prefix: str
    explanation: str
    adds_files: List[str] = []


class Lesson(BaseModel):
    id: int
    title: str
    description: str
    steps: List[LessonStep]
