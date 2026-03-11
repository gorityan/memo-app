# Git Dojo

インタラクティブにGitの使い方を学べるWebアプリです。

## 特徴

- **体験型チュートリアル**: 実際にコマンドを入力しながらGitを学べます
- **AIヒント機能**: 詰まったときはAI（Claude）がヒントや解説を提供
- **ビジュアルGitグラフ**: コミット・ブランチの状態をリアルタイムで可視化
- **3つのレッスン**: 初期化 → ブランチ → マージ

## 技術スタック

| 役割 | 技術 |
|------|------|
| フロントエンド | TypeScript + React + Vite |
| バックエンド | Python + FastAPI |
| AI | Anthropic Claude API |

## セットアップ

### バックエンド

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# .env を編集して ANTHROPIC_API_KEY を設定

uvicorn app.main:app --reload
```

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開いてください。

## 画面構成

```
┌─────────────┬──────────────────┬────────────┐
│ レッスン    │   ターミナル     │  Gitグラフ │
│ パネル      │                  │            │
│             │  $ git init      │   ● main   │
│ ステップ    │  $ git add ...   │   │        │
│ 一覧        │  $ git commit    │   ● Init   │
├─────────────┴──────────────────┴────────────┤
│  AIヒント / コマンド解説                    │
└─────────────────────────────────────────────┘
```

## 環境変数

| 変数名 | 説明 |
|--------|------|
| `ANTHROPIC_API_KEY` | Anthropic APIキー（[取得はこちら](https://console.anthropic.com/)）|
