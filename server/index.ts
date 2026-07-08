import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { proxyAiChat } from './aiProxy'
import { env } from './env'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.resolve(rootDir, 'dist')

const app = express()

app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.post('/api/ai/chat', proxyAiChat)

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'travel-ai',
    time: new Date().toISOString(),
  })
})

app.use(express.static(distDir))

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next()
  res.sendFile(path.join(distDir, 'index.html'), (err) => {
    if (err) next(err)
  })
})

app.listen(env.port, '0.0.0.0', () => {
  console.log(`travel-ai server running at http://0.0.0.0:${env.port}`)
})
