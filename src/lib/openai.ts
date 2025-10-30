// src/lib/openai.ts
import OpenAI from 'openai'

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const OPENAI_MODELS = {
  chat: process.env.OPENAI_CHAT_MODEL || 'gpt-4o',
  embedding: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large',
}


