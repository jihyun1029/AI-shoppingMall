import { useContext } from 'react'
import { ChatbotContext } from '../context/chatbotContext'

export function useChatbot() {
  const ctx = useContext(ChatbotContext)
  if (!ctx) throw new Error('useChatbot must be used within ChatbotProvider')
  return ctx
}
