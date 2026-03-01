import { config as dotenvConfig } from 'dotenv'
import { createHmac, randomBytes } from 'crypto'
import { createInterface } from 'readline/promises'
import { stdin as input, stdout as output } from 'node:process'

dotenvConfig()

const channelSecret = process.env.LINE_CHANNEL_SECRET
const webhookHost = process.env.TEST_WEBHOOK_HOST ?? '127.0.0.1'
const webhookPort =
  process.env.TEST_WEBHOOK_PORT ?? process.env.PORT ?? '8787'
const webhookUrl =
  process.env.TEST_WEBHOOK_URL ?? `http://${webhookHost}:${webhookPort}/webhook`

if (!channelSecret) {
  console.error('LINE_CHANNEL_SECRET is required to sign webhook requests')
  process.exit(1)
}

const rl = createInterface({ input, output })
let messageId = 1

console.log('CLI driver ready. Type \"exit\" to quit.')

const buildSignature = (body: string): string =>
  createHmac('sha256', channelSecret).update(body).digest('base64')

const makeEvent = (text: string) => ({
  events: [
    {
      replyToken: randomBytes(16).toString('hex'),
      type: 'message',
      timestamp: Date.now(),
      source: { type: 'user', userId: 'cli-driver' },
      message: {
        id: `${messageId++}`,
        type: 'text',
        text
      }
    }
  ]
})

const setStatus = (status: string) => {
  console.log(`[Status] ${status}`)
}

const TIMEOUT_MS = Number(process.env.CLI_TIMEOUT_MS ?? '15000')

const send = async (text: string) => {
  const payload = makeEvent(text)
  const body = JSON.stringify(payload)
  const signature = buildSignature(body)
  const fetchPromise = fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-line-signature': signature,
      'x-cli-test': '1'
    },
    body
  })
  const timeoutPromise = new Promise<Response>((_, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
    fetchPromise.finally(() => clearTimeout(timer))
  })
  const response = (await Promise.race([fetchPromise, timeoutPromise])) as Response
  const textResponse = await response.text()
  if (!response.ok) {
    console.error('Webhook error:', response.status, textResponse)
    throw new Error('Webhook returned non-OK status')
  }
  try {
    const parsed = JSON.parse(textResponse)
    if (parsed?.replies) {
      parsed.replies.forEach((reply: { replyText: string; fallbackError?: boolean }) => {
        console.log(
          `[Reply${reply.fallbackError ? ' (fallback)' : ''}] ${reply.replyText}`
        )
      })
    } else {
      console.log('Webhook response:', textResponse)
    }
  } catch {
    console.log('Webhook response:', textResponse)
  }
}

const withSendStatus = async (fn: () => Promise<void>) => {
  rl.pause()
  setStatus('Sending message...')
  try {
    await fn()
    setStatus('Message delivered. Ready for next input.')
  } catch (error) {
    setStatus('Message failed to send.')
    throw error
  } finally {
    rl.resume()
  }
}

const loop = async () => {
  while (true) {
    const line = await rl.question('You: ')
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }
    if (trimmed.toLowerCase() === 'exit') {
      break
    }
    try {
      await withSendStatus(() => send(trimmed))
    } catch (error) {
      console.error('Send failed:', error)
    }
  }
}

loop()
  .catch((error) => console.error('CLI driver failed:', error))
  .finally(() => rl.close())
