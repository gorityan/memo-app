from fastapi import APIRouter
from typing import List
from ..models.schemas import Lesson, LessonStep

router = APIRouter(prefix="/api/lessons", tags=["lessons"])

LESSONS: List[Lesson] = [
    Lesson(
        id=1,
        title="はじめてのGit",
        description="リポジトリの初期化から最初のコミットまで",
        steps=[
            LessonStep(
                id=1,
                instruction="まず `git init` でリポジトリを初期化しましょう",
                hint="git init を入力してください",
                expected_command_prefix="git init",
                explanation="`git init` でカレントディレクトリをGitリポジトリとして初期化します。`.git` ディレクトリが作成されます。",
                adds_files=[],
            ),
            LessonStep(
                id=2,
                instruction="`git status` で現在の状態を確認しましょう",
                hint="git status を入力してください",
                expected_command_prefix="git status",
                explanation="`git status` でワーキングディレクトリの状態を確認できます。追跡されていないファイルや変更が表示されます。",
                adds_files=[],
            ),
            LessonStep(
                id=3,
                instruction="`git add README.md` でファイルをステージングエリアに追加しましょう",
                hint="git add の後にファイル名を指定します",
                expected_command_prefix="git add",
                explanation="`git add` でファイルをステージングエリアに追加します。コミットするファイルを選択する操作です。",
                adds_files=[],
            ),
            LessonStep(
                id=4,
                instruction='`git commit -m "Initial commit"` で最初のコミットを作成しましょう',
                hint='git commit -m "メッセージ" の形式で使います',
                expected_command_prefix="git commit",
                explanation="`git commit` でステージングされた変更をリポジトリに記録します。`-m` フラグでメッセージを指定します。",
                adds_files=["feature.txt"],
            ),
        ],
    ),
    Lesson(
        id=2,
        title="ブランチを使おう",
        description="ブランチの作成・切り替え・コミット",
        steps=[
            LessonStep(
                id=1,
                instruction="`git branch feature` で新しいブランチを作成しましょう",
                hint="git branch の後にブランチ名を指定します",
                expected_command_prefix="git branch",
                explanation="`git branch <名前>` で新しいブランチを作成します。ブランチは開発の流れを分岐させる機能です。",
                adds_files=[],
            ),
            LessonStep(
                id=2,
                instruction="`git switch feature` または `git checkout feature` でブランチを切り替えましょう",
                hint="git switch または git checkout を使います",
                expected_command_prefix="git",
                explanation="`git switch` (または旧来の `git checkout`) でブランチを切り替えます。",
                adds_files=[],
            ),
            LessonStep(
                id=3,
                instruction="`git add feature.txt` で新しいファイルをステージングしましょう",
                hint="git add で feature.txt を追加します",
                expected_command_prefix="git add",
                explanation="ブランチで作業した変更をステージングします。",
                adds_files=[],
            ),
            LessonStep(
                id=4,
                instruction='`git commit -m "Add feature"` でブランチにコミットしましょう',
                hint='git commit -m "メッセージ" を使います',
                expected_command_prefix="git commit",
                explanation="featureブランチに変更を記録します。mainブランチとは独立したコミット履歴になります。",
                adds_files=[],
            ),
        ],
    ),
    Lesson(
        id=3,
        title="マージしよう",
        description="ブランチをmainに統合する",
        steps=[
            LessonStep(
                id=1,
                instruction="`git switch main` または `git checkout main` でmainブランチに戻りましょう",
                hint="git switch main を使います",
                expected_command_prefix="git",
                explanation="マージするにはまず統合先のブランチ(main)に切り替えます。",
                adds_files=[],
            ),
            LessonStep(
                id=2,
                instruction="`git merge feature` でfeatureブランチをmainにマージしましょう",
                hint="git merge の後にマージしたいブランチ名を指定します",
                expected_command_prefix="git merge",
                explanation="`git merge` で別ブランチの変更を現在のブランチに統合します。",
                adds_files=[],
            ),
            LessonStep(
                id=3,
                instruction="`git log --oneline` でコミット履歴を確認しましょう",
                hint="git log --oneline を使います",
                expected_command_prefix="git log",
                explanation="`git log` でコミット履歴を表示します。`--oneline` で簡潔に表示できます。",
                adds_files=[],
            ),
        ],
    ),
]


@router.get("", response_model=List[Lesson])
def get_lessons():
    return LESSONS


@router.get("/{lesson_id}", response_model=Lesson)
def get_lesson(lesson_id: int):
    for lesson in LESSONS:
        if lesson.id == lesson_id:
            return lesson
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Lesson not found")
