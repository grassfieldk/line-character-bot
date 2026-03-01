import { config as dotenvConfig } from 'dotenv'
import { generateText } from 'ai'
import { xai } from '@ai-sdk/xai'

dotenvConfig()

const useStubResponse = ['1', 'true', 'yes'].includes(
  (process.env.XAI_USE_STUB ?? '').toLowerCase()
)
const xaiModels = (process.env.XAI_MODEL ?? '')
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean)

export async function getXaiReply(userMessage: string): Promise<string> {
  const character = process.env.CHARACTER_NAME ?? 'Character'
  if (useStubResponse) {
    return `[Stub|${character}] ${userMessage}`
  }

  if (!process.env.XAI_API_KEY) {
    throw new Error('XAI_API_KEY is missing')
  }
  if (xaiModels.length === 0) {
    throw new Error('No xAI model specified')
  }

  const pronoun = process.env.CHARACTER_PRONOUN ?? ''
  const phrase = process.env.CHARACTER_PHRASE ?? ''
  const quotes = process.env.CHARACTER_QUOTES ?? ''

  let prompt = `${character} になりきって、下記に示す文章への返答を
    「最大 200 文字程度で」
    「Markdown 記法や箇条書きなどの文字装飾を使わずに」
    「必要に応じて適宜改行をしながら」
    行ってください。`
  if (pronoun) prompt += `
一人称は ${pronoun} を使ってください。`
  if (phrase) prompt += `
口癖として ${phrase} を必要に応じて自然に会話に混ぜてください。`
  if (quotes) prompt += `

参考となるキャラクターのセリフ:
${quotes}`

  prompt += `

返答する文章:
${userMessage}`
  console.log('[xAI] Request prompt:\n', prompt)

  let lastError: unknown = null
  for (const modelName of xaiModels) {
    try {
      console.log(`[xAI] Trying model: ${modelName}`)
      const { text } = await generateText({
        model: xai(modelName),
        prompt
      })
      console.log('[xAI] Response:\n', text)
      return text
    } catch (error) {
      console.error(`[xAI] Error with model ${modelName}:`, error)
      lastError = error
    }
  }

  throw lastError ?? new Error('No xAI model specified')
}
