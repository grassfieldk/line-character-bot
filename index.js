import express from 'express';
import { config as dotenvConfig } from 'dotenv';
import line from '@line/bot-sdk';

dotenvConfig();


const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const app = express();
app.post('/webhook', line.middleware(lineConfig), (req, res) => {
  const events = req.body.events;
  const client = new line.Client(lineConfig);
  Promise.all(events.map(event => {
    if (event.type === 'message' && event.message.type === 'text') {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'Hello world!'
      });
    } else {
      return Promise.resolve(null);
    }
  }))
    .then(() => res.status(200).end())
    .catch((err) => {
      console.error('LINE reply error:', err);
      res.status(500).end();
    });
});

app.post('/webhook', async (req, res) => {
  console.log('--- Webhook received ---');
  console.log('Headers:', req.headers);
  console.log('Body:', JSON.stringify(req.body, null, 2));

  // LINEのreplyTokenを取得
  const events = req.body.events;
  if (Array.isArray(events)) {
    for (const event of events) {
      if (event.replyToken) {
        console.log('Sending reply to LINE...');
        const response = await fetch('https://api.line.me/v2/bot/message/reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN || 'YOUR_CHANNEL_ACCESS_TOKEN'}`
          },
          body: JSON.stringify({
            replyToken: event.replyToken,
            messages: [
              { type: 'text', text: 'Hello world!' }
            ]
          })
        });
        const text = await response.text();
        if (response.ok) {
          console.log('LINE reply sent successfully.');
        } else {
          console.error('Failed to send reply to LINE:', response.status, text);
        }
      }
    }
  }
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
