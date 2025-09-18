import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY,
  models: (process.env.GEMINI_MODEL || '').split(',').map(m => m.trim()).filter(Boolean)
};
const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);

export async function getGeminiReply(userMessage) {

  const character = process.env.CHARACTER_NAME;
  const pronoun = process.env.CHARACTER_PRONOUN || '';
  const phrase = process.env.CHARACTER_PHRASE || '';
  const quotes = process.env.CHARACTER_QUOTES || '';

  let prompt = `${character} になりきって、下記に示す文章への返答を
    「最大 300 文字程度で」、
    「Markdown 記法や箇条書きなどの文字装飾を使わずに」、
    「必要に応じて適宜改行をしながら」
    行ってください。`;
  if (pronoun) prompt += `\n一人称は ${pronoun} を使ってください。`;
  if (phrase) prompt += `\n口癖として ${phrase} を必要に応じて自然に会話に混ぜてください。`;
  if (quotes) prompt += `\n\n参考となるキャラクターのセリフ:\n${quotes}`

  prompt += `\n\n返答する文章:\n${userMessage}`;
  console.log('[Gemini] Request prompt:\n', prompt);

  let lastError = null;
  for (const modelName of geminiConfig.models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      console.log(`[Gemini] Trying model: ${modelName}`);

      const result = await model.generateContent(prompt);
      const response = result.response;
      console.log('[Gemini] Response:\n', response.text());

      return response.text();

    } catch (err) {
      console.error(`[Gemini] Error with model ${modelName}:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('No Gemini model specified');
}
