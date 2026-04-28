import { classifyIntent } from '../chatbot/intentClassifier.js'

/**
 * Intent 분류 에이전트.
 * @param {string} message
 * @returns {{ intent: string, scores: Record<string, number> }}
 */
export function intentAgent(message) {
  return classifyIntent(message)
}
