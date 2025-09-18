
import express from 'express';
import { config as dotenvConfig } from 'dotenv';
import line from '@line/bot-sdk';
import { getGeminiReply } from './gemini.js';

dotenvConfig();


const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const app = express();

app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  const events = req.body.events;
  const client = new line.Client(lineConfig);
  try {
    await Promise.all(events.map(async event => {
      if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text;
        let replyText = '';
        try {
          replyText = await getGeminiReply(userMessage);
        } catch (err) {
          console.error('Gemini API error:', err);
          replyText = '[ERROR] エラーが発生しました。\n時間をおいて再度試してください。\nしばらく経っても問題が解決しない場合、管理者へ問い合わせてください。';
        }
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: replyText
        });
      }
      return Promise.resolve(null);
    }));
    res.status(200).end();
  } catch (err) {
    console.error('LINE reply error:', err);
    res.status(500).end();
  }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
