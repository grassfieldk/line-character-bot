import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();


const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL
};
const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);

export async function getGeminiReply(prompt) {
  const model = genAI.getGenerativeModel({ model: geminiConfig.model});
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}
