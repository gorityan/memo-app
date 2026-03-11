import os
from anthropic import Anthropic

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

SYSTEM_PROMPT = (
    "あなたはGitを教える先生です。初心者向けに日本語で分かりやすく説明してください。"
    "回答は2〜3文程度に簡潔にまとめてください。コマンド例を示す場合はコードブロックを使ってください。"
)


def get_hint(instruction: str, expected_command_prefix: str) -> str:
    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=300,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    f"課題: {instruction}\n"
                    f"期待されるコマンドの種類: {expected_command_prefix}\n"
                    "答えを直接教えずに、ヒントだけ教えてください。"
                ),
            }
        ],
    )
    return message.content[0].text


def explain_command(command: str) -> str:
    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=400,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"このgitコマンドを初心者向けに説明してください: `{command}`",
            }
        ],
    )
    return message.content[0].text
