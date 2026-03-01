import { Hono } from 'hono'
import { config as dotenvConfig } from 'dotenv'
import {
  Client,
  WebhookRequestBody,
  validateSignature
} from '@line/bot-sdk'
import { getGeminiReply } from './gemini.ts'

dotenvConfig()

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
const channelSecret = process.env.LINE_CHANNEL_SECRET
const lineClient =
  channelAccessToken && channelSecret
    ? new Client({ channelAccessToken, channelSecret })
    : null
const systemErrorReply =
  '[システム] エラーが発生しました。\n時間をおいて再度試してください。\nしばらく経っても問題が解決しない場合、管理者へ問い合わせてください。'

const app = new Hono()

app.post('/webhook', async (ctx) => {
  if (!lineClient || !channelSecret) {
    console.error('Missing LINE webhook credentials')
    return ctx.text('LINE configuration missing', 500)
  }
  const client = lineClient

  const rawBody = await ctx.req.text()
  const signature = ctx.req.header('x-line-signature') ?? ''
  if (!validateSignature(rawBody, channelSecret, signature)) {
    return ctx.text('Invalid signature', 401)
  }

  let payload: WebhookRequestBody
  try {
    payload = JSON.parse(rawBody) as WebhookRequestBody
  } catch (error) {
    console.error('Failed to parse webhook payload:', error)
    return ctx.text('Bad request', 400)
  }

  const events = payload.events ?? []
  const replies: Array<{ replyText: string; fallbackError?: boolean }> = []
  const isTestRequest = ctx.req.header('x-cli-test') === '1'
  await Promise.all(
    events.map(async (event) => {
      if (event.type !== 'message' || event.message.type !== 'text') {
        return
      }
      const userMessage = event.message.text
      console.log('[LINE] Received a message:', userMessage)
      let replyText: string
      try {
        replyText = await getGeminiReply(userMessage)
      } catch (error) {
        console.error('Gemini API error:', error)
        replyText = systemErrorReply
      }
      console.log('[LINE] Reply message:', replyText)
      let finalReply = replyText
      let fallbackError = false
      if (!isTestRequest) {
        try {
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: replyText
          })
        } catch (error) {
          console.error('LINE reply error:', error)
          fallbackError = true
          finalReply = systemErrorReply
          try {
            await client.replyMessage(event.replyToken, {
              type: 'text',
              text: systemErrorReply
            })
          } catch (fallbackErrorInstance) {
            console.error(
              'LINE fallback reply error:',
              fallbackErrorInstance
            )
          }
        }
      }
      replies.push({ replyText: finalReply, fallbackError })
    })
  )
  if (isTestRequest) {
    return ctx.json({ ok: true, replies })
  }
  return ctx.text('OK')
})

export default app
