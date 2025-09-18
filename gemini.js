import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();


const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL
};
const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);


export async function getGeminiReply(userMessage) {
  const character = process.env.CHARACTER;
  const prompt = `${character} になりきって、次の文章への返答を「最大 200 文字程度で」、「Markdown 記法や箇条書きなどの文字装飾を使わずに」行ってください:\n\n ${userMessage}`;
  const model = genAI.getGenerativeModel({ model: geminiConfig.model });

  console.log('[Gemini] Request prompt:\n', prompt);
  const result = await model.generateContent(prompt);

  const response = result.response;
  console.log('[Gemini] Response:\n', response.text());

  return response.text();
}
