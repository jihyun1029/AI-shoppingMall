import express from 'express'
import { postChatbot } from '../chatbot/chatbotController.js'

export function createChatbotRouter() {
  const r = express.Router()
  r.post('/', (req, res, next) => postChatbot(req, res).catch(next))
  return r
}
