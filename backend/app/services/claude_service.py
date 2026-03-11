import os
import google.generativeai as genai

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))
model = genai.GenerativeModel("gemini-1.5-flash")

SYSTEM_PROMPT = (
    "あなたはGitを教える先生です。初心者向けに日本語で分かりやすく説明してください。"
    "回答は2〜3文程度に簡潔にまとめてください。コマンド例を示す場合はコードブロックを使ってください。"
)


def get_hint(instruction: str, expected_command_prefix: str) -> str:
    prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"課題: {instruction}\n"
        f"期待されるコマンドの種類: {expected_command_prefix}\n"
        "答えを直接教えずに、ヒントだけ教えてください。"
    )
    response = model.generate_content(prompt)
    return response.text


def explain_command(command: str) -> str:
    prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"このgitコマンドを初心者向けに説明してください: `{command}`"
    )
    response = model.generate_content(prompt)
    return response.text
