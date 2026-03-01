# LINE Character Bot

特定のキャラクターになりきって会話を行う LINE Bot


## 初期化

1. 依存パッケージのインストール
   ```bash
   bun install
   ```
2. 開発サーバー起動
   ```bash
   bun run dev
   ```


## 本番起動

```bash
bun run start
```


## PM2 による起動管理

1. PM2 のインストール
   ```bash
   bun install --global pm2
   ```
2. アプリケーションを登録
   ```bash
   pm2 start --name line-character-bot "bun run start"
   ```
3. 任意で自動起動を設定
   ```bash
   pm2 startup
   pm2 save
   ```

PM2 登録後は `pm2 logs line-character-bot` などで状態確認と再起動/停止ができます。


## ローカル検証用 CLI ドライバ

`bun run dev` で Hono サーバーを立ち上げた状態で、別ターミナルから `bun run chat` を実行すると CLI 対話が始まります。CLI は `LINE_CHANNEL_SECRET` を使って署名付き webhook を `http://{TEST_WEBHOOK_HOST or 127.0.0.1}:{TEST_WEBHOOK_PORT or PORT or 8787}/webhook`（`TEST_WEBHOOK_URL` で完全指定可）に投げるため、実際の webhook と同じ処理経路を通って応答を確認できます。

- `XAI_USE_STUB=1` を設定すると xAI API にアクセスせずにスタブ応答を返すため、API キー不要で動作検証できます
- `XAI_MODEL` で `grok-4` や `grok-3` などのモデル ID をカンマ区切りで指定できます
- CLI で `exit` を入力すれば終了します
