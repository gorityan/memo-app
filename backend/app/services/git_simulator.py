import hashlib
from typing import Dict, List, Optional, Tuple
from copy import deepcopy

from ..models.schemas import Commit, GitState

# In-memory session storage
sessions: Dict[str, GitState] = {}


def get_or_create_session(session_id: str) -> GitState:
    if session_id not in sessions:
        sessions[session_id] = GitState()
    return sessions[session_id]


def short_id(full_id: str) -> str:
    return full_id[:7]


def process_command(session_id: str, command: str) -> Tuple[str, bool, GitState]:
    """Returns (output, success, new_state)"""
    state = deepcopy(get_or_create_session(session_id))
    parts = command.strip().split()

    if not parts:
        return ("", False, state)

    if parts[0] != "git":
        output = f"bash: {parts[0]}: command not found\n(ヒント: git コマンドを使ってください)"
        return (output, False, state)

    if len(parts) < 2:
        return ("git: サブコマンドを指定してください", False, state)

    subcmd = parts[1]
    args = parts[2:]

    handlers = {
        "init": _git_init,
        "status": _git_status,
        "add": _git_add,
        "commit": _git_commit,
        "branch": _git_branch,
        "log": _git_log,
    }

    if subcmd in ("checkout", "switch"):
        output, success, state = _git_checkout(session_id, state, args, subcmd)
    elif subcmd == "merge":
        output, success, state = _git_merge(session_id, state, args)
    elif subcmd in handlers:
        output, success, state = handlers[subcmd](session_id, state, args)
    else:
        output = f"git: '{subcmd}' はこのシミュレーターではサポートされていません"
        success = False

    sessions[session_id] = state
    return (output, success, state)


def add_working_files(session_id: str, files: List[str]) -> GitState:
    state = get_or_create_session(session_id)
    for f in files:
        if f not in state.working_files:
            state.working_files.append(f)
    sessions[session_id] = state
    return state


def reset_session(session_id: str) -> GitState:
    sessions[session_id] = GitState()
    return sessions[session_id]


# --- Git command implementations ---

def _git_init(session_id: str, state: GitState, args: List[str]) -> Tuple[str, bool, GitState]:
    if state.initialized:
        return ("Reinitialized existing Git repository", True, state)
    state.initialized = True
    state.current_branch = "main"
    state.branches = {}
    state.working_files = ["README.md"]
    return ("Initialized empty Git repository in /myproject/.git/", True, state)


def _git_status(session_id: str, state: GitState, args: List[str]) -> Tuple[str, bool, GitState]:
    if not state.initialized:
        return ("fatal: not a git repository", False, state)

    lines = [f"On branch {state.current_branch}", ""]
    has_head = bool(state.branches.get(state.current_branch))

    if not has_head:
        lines.append("No commits yet")
        lines.append("")

    if state.staged_files:
        lines.append("Changes to be committed:")
        lines.append('  (use "git restore --staged <file>..." to unstage)')
        for f in state.staged_files:
            lines.append(f"\t\tnew file:   {f}")
        lines.append("")

    committed_files = _get_committed_files(state)
    untracked = [f for f in state.working_files if f not in state.staged_files and f not in committed_files]

    if untracked:
        lines.append("Untracked files:")
        lines.append('  (use "git add <file>..." to include in what will be committed)')
        for f in untracked:
            lines.append(f"\t\t{f}")
        lines.append("")

    if not state.staged_files and not untracked:
        lines.append("nothing to commit, working tree clean")

    return ("\n".join(lines), True, state)


def _get_committed_files(state: GitState) -> List[str]:
    files: List[str] = []
    for commit in state.commits:
        for f in commit.message.split("||files||")[-1:]:
            for item in f.split(","):
                item = item.strip()
                if item:
                    files.append(item)
    return files


def _git_add(session_id: str, state: GitState, args: List[str]) -> Tuple[str, bool, GitState]:
    if not state.initialized:
        return ("fatal: not a git repository", False, state)
    if not args:
        return ("Nothing specified, nothing added.", False, state)

    target = args[0]
    if target == ".":
        files_to_add = [f for f in state.working_files if f not in state.staged_files]
    elif target in state.working_files:
        files_to_add = [target] if target not in state.staged_files else []
    else:
        return (f"fatal: pathspec '{target}' did not match any files", False, state)

    for f in files_to_add:
        if f not in state.staged_files:
            state.staged_files.append(f)
    return ("", True, state)


def _git_commit(session_id: str, state: GitState, args: List[str]) -> Tuple[str, bool, GitState]:
    if not state.initialized:
        return ("fatal: not a git repository", False, state)
    if not state.staged_files:
        return ("nothing to commit, working tree clean", False, state)

    message = "Commit"
    raw_args = " ".join(args)
    if "-m" in args:
        m_idx = args.index("-m")
        if m_idx + 1 < len(args):
            message = " ".join(args[m_idx + 1:]).strip("\"'")
    elif '"-m"' in raw_args or "'-m'" in raw_args:
        pass  # already handled

    parent_id = state.branches.get(state.current_branch)
    files_str = ",".join(sorted(state.staged_files))
    content = f"{message}|{parent_id}|{files_str}"
    commit_id = hashlib.sha1(content.encode()).hexdigest()

    # Store staged files in commit message for tracking (simplified)
    stored_message = f"{message}||files||{files_str}"

    commit = Commit(
        id=commit_id,
        message=stored_message,
        parent_id=parent_id,
        branch=state.current_branch,
    )
    state.commits.append(commit)
    state.branches[state.current_branch] = commit_id
    n_files = len(state.staged_files)
    state.staged_files = []

    output = f"[{state.current_branch} {short_id(commit_id)}] {message}\n {n_files} file(s) changed"
    return (output, True, state)


def _git_branch(session_id: str, state: GitState, args: List[str]) -> Tuple[str, bool, GitState]:
    if not state.initialized:
        return ("fatal: not a git repository", False, state)

    if not args:
        lines = []
        all_branches = set(state.branches.keys())
        all_branches.add(state.current_branch)
        for branch in sorted(all_branches):
            prefix = "* " if branch == state.current_branch else "  "
            lines.append(f"{prefix}{branch}")
        return ("\n".join(lines) if lines else f"* {state.current_branch}", True, state)

    branch_name = args[0]
    if branch_name in state.branches:
        return (f"fatal: A branch named '{branch_name}' already exists.", False, state)

    current_head = state.branches.get(state.current_branch)
    if state.current_branch not in state.branches:
        state.branches[state.current_branch] = current_head
    state.branches[branch_name] = current_head
    return (f"ブランチ '{branch_name}' を作成しました", True, state)


def _git_checkout(session_id: str, state: GitState, args: List[str], subcmd: str) -> Tuple[str, bool, GitState]:
    if not state.initialized:
        return ("fatal: not a git repository", False, state)
    if not args:
        return ("fatal: ブランチ名を指定してください", False, state)

    # git checkout -b <branch>
    if args[0] == "-b" and len(args) > 1:
        branch_name = args[1]
        if branch_name in state.branches:
            return (f"fatal: A branch named '{branch_name}' already exists.", False, state)
        current_head = state.branches.get(state.current_branch)
        if state.current_branch not in state.branches:
            state.branches[state.current_branch] = current_head
        state.branches[branch_name] = current_head
        state.current_branch = branch_name
        return (f"ブランチ '{branch_name}' に切り替えました (新規作成)", True, state)

    branch_name = args[0]
    all_branches = set(state.branches.keys())
    all_branches.add(state.current_branch)

    if branch_name not in all_branches:
        return (f"error: pathspec '{branch_name}' did not match any branch", False, state)
    if branch_name == state.current_branch:
        return (f"Already on '{branch_name}'", True, state)

    if state.current_branch not in state.branches:
        state.branches[state.current_branch] = None

    state.current_branch = branch_name
    label = "切り替えました" if subcmd == "switch" else f"Switched to branch '{branch_name}'"
    output = f"ブランチ '{branch_name}' に{label}" if subcmd == "switch" else label
    return (output, True, state)


def _git_merge(session_id: str, state: GitState, args: List[str]) -> Tuple[str, bool, GitState]:
    if not state.initialized:
        return ("fatal: not a git repository", False, state)
    if not args:
        return ("fatal: ブランチ名を指定してください", False, state)

    branch_to_merge = args[0]
    if branch_to_merge not in state.branches:
        return (f"fatal: '{branch_to_merge}' does not point to a commit", False, state)
    if branch_to_merge == state.current_branch:
        return ("Already up to date.", True, state)

    merge_head = state.branches.get(branch_to_merge)
    current_head = state.branches.get(state.current_branch)
    if merge_head == current_head:
        return ("Already up to date.", True, state)

    content = f"Merge:{branch_to_merge}:{state.current_branch}:{current_head}:{merge_head}"
    commit_id = hashlib.sha1(content.encode()).hexdigest()
    commit = Commit(
        id=commit_id,
        message=f"Merge branch '{branch_to_merge}' into {state.current_branch}",
        parent_id=current_head,
        branch=state.current_branch,
    )
    state.commits.append(commit)
    state.branches[state.current_branch] = commit_id

    output = f"Merge made by the 'ort' strategy.\nブランチ '{branch_to_merge}' をマージしました"
    return (output, True, state)


def _git_log(session_id: str, state: GitState, args: List[str]) -> Tuple[str, bool, GitState]:
    if not state.initialized:
        return ("fatal: not a git repository", False, state)

    current_head_id = state.branches.get(state.current_branch)
    if not current_head_id:
        return ("fatal: your current branch has no commits yet", False, state)

    oneline = "--oneline" in args
    commit_map = {c.id: c for c in state.commits}

    chain: List[Commit] = []
    seen = set()
    next_id: Optional[str] = current_head_id
    while next_id and next_id not in seen:
        seen.add(next_id)
        c = commit_map.get(next_id)
        if not c:
            break
        chain.append(c)
        next_id = c.parent_id

    lines = []
    for commit in chain:
        display_msg = commit.message.split("||files||")[0]
        if oneline:
            lines.append(f"{short_id(commit.id)} {display_msg}")
        else:
            lines.append(f"commit {commit.id}")
            lines.append(f"Branch: {commit.branch}")
            lines.append("")
            lines.append(f"    {display_msg}")
            lines.append("")

    return ("\n".join(lines), True, state)
