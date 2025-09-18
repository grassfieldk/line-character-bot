# line-character-bot

特定のキャラクターになりきって会話を行う LINE Bot


## 初期化

1. 依存パッケージのインストール
   ```bash
   npm install
   ```
2. サーバー起動
   ```bash
   npm start
   ```

## PM2 による起動

PM2 を使用することで起動管理が容易になります

1. PM2 のインストール
   ```bash
   npm install --global pm2
   ```
2. アプリケーションの登録
   ```bash
   pm2 start index.js --name line-character-bot
   ```
3. 自動起動設定（任意）
   ```bash
   pm2 startup # OS と同時に起動
   pm2 save # 上記設定を保存
   ```

登録後、PM2 によるログ閲覧や起動管理ができるようになります

```bash
# 登録済アプリケーション一覧の表示
pm2 list
# ログの表示
pm2 logs line-character-bot
# アプリケーションの起動
pm2 start line-character-bot
# アプリケーションの再起動
pm2 restart line-character-bot
# アプリケーションの終了
pm2 stop line-character-bot
```
