import { parseRagKeywords, buildAgentKeywords } from '../chatbot/keywordParser.js'

/**
 * 키워드 파싱 에이전트.
 * @param {string} message
 * @returns {{ parsed: ReturnType<typeof parseRagKeywords>, keywords: ReturnType<typeof buildAgentKeywords> }}
 */
export function parserAgent(message) {
  const parsed = parseRagKeywords(message)
  const keywords = buildAgentKeywords(message, parsed)
  return { parsed, keywords }
}
