import express from 'express'
import { postChatbot } from '../chatbot/chatbotController.js'

export function createChatbotRouter(db) {
  const r = express.Router()
  r.post('/', (req, res) => postChatbot(db, req, res))
  return r
}
