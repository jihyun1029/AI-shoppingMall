import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectMongo } from './db.js'
import { seedIfEmpty } from './seedDb.js'
import { createAuthRouter } from './routes/auth.js'
import { createProductsRouter } from './routes/products.js'
import { createChatbotRouter } from './routes/chatbot.js'

const port = Number(process.env.PORT || 4000)

await connectMongo()
await seedIfEmpty()

const app = express()
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) || true,
    credentials: true,
  }),
)
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: 'mongodb' })
})

app.use('/api/auth', createAuthRouter())
app.use('/api/products', createProductsRouter())
app.use('/api/chatbot', createChatbotRouter())

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: '서버 오류가 발생했습니다.' })
})

app.listen(port, () => {
  console.log(`API http://localhost:${port}`)
})
