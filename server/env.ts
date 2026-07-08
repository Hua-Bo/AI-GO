import dotenv from 'dotenv'

dotenv.config()

export const env = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',

  aiProvider: process.env.AI_PROVIDER || 'longcat',
  aiModel: process.env.AI_MODEL || 'LongCat-2.0',
  aiBaseURL: process.env.AI_BASE_URL || 'https://api.longcat.chat/openai/v1',
  aiApiKey: process.env.AI_API_KEY || '',

  aiMaxTokens: Number(process.env.AI_MAX_TOKENS || 4096),
  aiTimeout: Number(process.env.AI_REQUEST_TIMEOUT || 120000),
  allowClientProvider: process.env.AI_ALLOW_CLIENT_PROVIDER === 'true',
}
