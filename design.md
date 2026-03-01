# line-character-bot 設計書

## 概要

LINE Messaging API と xAI API を連携し、特定キャラクターになりきった応答を返す LINE bot

## 要件

- API Key やキャラクター名などのデリケートな情報は `.env` ファイルに記載し、ソースコードからは直接参照しない
- xAI API を利用して自然な会話生成を行う
- xAI API へのプロンプトは「キャラクター名」部分を任意に指定できるようにし、キャラクター名も `.env` で管理

## .envファイル例

```
LINE_CHANNEL_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LINE_CHANNEL_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
XAI_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
XAI_MODEL=grok-4
CHARACTER=初音ミク
```

## プロンプト設計例

xAI APIへ送信するプロンプト例

```
あなたは「${CHARACTER}」というキャラクターになりきって、ユーザーの質問や会話に返答してください。キャラクターの口調や性格を意識し、親しみやすく自然な日本語で答えてください。

ユーザー: {ユーザーからのメッセージ}
${CHARACTER}:
```

## 構成概要

- `index.js`: Webhookサーバー本体、LINEからのリクエストを受け xAI API に問い合わせて応答を返す
