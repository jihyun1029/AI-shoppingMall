import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { openDatabase, migrate } from './db.js'
import { seedIfEmpty } from './seedDb.js'
import { createAuthRouter } from './routes/auth.js'
import { createProductsRouter } from './routes/products.js'

const port = Number(process.env.PORT || 4000)
const db = openDatabase()
migrate(db)
seedIfEmpty(db)

const app = express()
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) || true,
    credentials: true,
  }),
)
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: 'sqlite' })
})

app.use('/api/auth', createAuthRouter(db))
app.use('/api/products', createProductsRouter(db))

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: '서버 오류가 발생했습니다.' })
})

app.listen(port, () => {
  console.log(`API http://localhost:${port}`)
})
