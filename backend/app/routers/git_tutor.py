import uuid
from fastapi import APIRouter
from ..models.schemas import (
    CommandRequest,
    CommandResponse,
    HintRequest,
    HintResponse,
    ExplainRequest,
    ExplainResponse,
    SessionResponse,
    FileWriteRequest,
    FileDeleteRequest,
)
from ..services import git_simulator, claude_service
from .lessons import LESSONS

router = APIRouter(prefix="/api", tags=["git"])


@router.post("/session/new", response_model=SessionResponse)
def new_session():
    session_id = str(uuid.uuid4())
    state = git_simulator.reset_session(session_id)
    return SessionResponse(session_id=session_id, git_state=state)


@router.get("/session/{session_id}", response_model=SessionResponse)
def get_session(session_id: str):
    state = git_simulator.get_or_create_session(session_id)
    return SessionResponse(session_id=session_id, git_state=state)


@router.post("/git/command", response_model=CommandResponse)
def run_command(req: CommandRequest):
    # Find the expected step
    lesson = next((l for l in LESSONS if l.id == req.lesson_id), None)
    step = None
    if lesson:
        step = next((s for s in lesson.steps if s.id == req.step_id), None)

    output, success, git_state = git_simulator.process_command(req.session_id, req.command)

    # Check if the command matches what's expected for this step
    correct = False
    step_completed = False
    if step:
        cmd = req.command.strip()
        prefix = step.expected_command_prefix.strip()

        # Special handling for checkout/switch steps
        if prefix == "git":
            correct = success and (
                cmd.startswith("git switch") or cmd.startswith("git checkout")
            )
        else:
            correct = success and cmd.startswith(prefix)

        step_completed = correct

        # Add files needed for next step when this step completes
        if step_completed:
            if step.adds_files:
                git_state = git_simulator.add_working_files(req.session_id, step.adds_files)
            if step.initial_file_contents:
                for filename, content in step.initial_file_contents.items():
                    git_state = git_simulator.set_file_content(req.session_id, filename, content)

    return CommandResponse(
        output=output,
        success=success,
        correct=correct,
        step_completed=step_completed,
        git_state=git_state,
    )


@router.post("/file/write")
def write_file_endpoint(req: FileWriteRequest):
    state = git_simulator.set_file_content(req.session_id, req.filename, req.content)
    return {"ok": True, "git_state": state}


@router.post("/file/delete")
def delete_file_endpoint(req: FileDeleteRequest):
    state = git_simulator.remove_file(req.session_id, req.filename)
    return {"ok": True, "git_state": state}


@router.post("/ai/hint", response_model=HintResponse)
def get_hint(req: HintRequest):
    hint = claude_service.get_hint(req.instruction, req.expected_command_prefix)
    return HintResponse(hint=hint)


@router.post("/ai/explain", response_model=ExplainResponse)
def explain_command(req: ExplainRequest):
    explanation = claude_service.explain_command(req.command)
    return ExplainResponse(explanation=explanation)
