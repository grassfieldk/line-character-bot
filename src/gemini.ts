import { config as dotenvConfig } from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'

dotenvConfig()

const geminiApiKey = process.env.GEMINI_API_KEY
const geminiModels = (process.env.GEMINI_MODEL ?? '')
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean)
const generativeAI = geminiApiKey
  ? new GoogleGenerativeAI(geminiApiKey)
  : null
const useStubResponse = ['1', 'true', 'yes'].includes(
  (process.env.GEMINI_USE_STUB ?? '').toLowerCase()
)

export async function getGeminiReply(userMessage: string): Promise<string> {
  const character = process.env.CHARACTER_NAME ?? 'Character'
  if (useStubResponse) {
    return `[Stub|${character}] ${userMessage}`
  }

  if (!geminiApiKey || !generativeAI) {
    throw new Error('GEMINI_API_KEY is missing')
  }

  const pronoun = process.env.CHARACTER_PRONOUN ?? ''
  const phrase = process.env.CHARACTER_PHRASE ?? ''
  const quotes = process.env.CHARACTER_QUOTES ?? ''

  let prompt = `${character} になりきって、下記に示す文章への返答を
    「最大 200 文字程度で」
    「Markdown 記法や箇条書きなどの文字装飾を使わずに」
    「必要に応じて適宜改行をしながら」
    行ってください。`
  if (pronoun) prompt += `\n一人称は ${pronoun} を使ってください。`
  if (phrase) prompt += `\n口癖として ${phrase} を必要に応じて自然に会話に混ぜてください。`
  if (quotes) prompt += `\n\n参考となるキャラクターのセリフ:\n${quotes}`

  prompt += `\n\n返答する文章:\n${userMessage}`
  console.log('[Gemini] Request prompt:\n', prompt)

  let lastError: unknown = null
  for (const modelName of geminiModels) {
    try {
      const model = generativeAI.getGenerativeModel({ model: modelName })
      console.log(`[Gemini] Trying model: ${modelName}`)
      const result = await model.generateContent(prompt)
      const response = result.response
      console.log('[Gemini] Response:\n', response.text())
      return response.text()
    } catch (error) {
      console.error(`[Gemini] Error with model ${modelName}:`, error)
      lastError = error
    }
  }

  throw lastError ?? new Error('No Gemini model specified')
}
