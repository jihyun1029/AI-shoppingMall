import { INTENT } from '../chatbot/intentClassifier.js'

/**
 * 플래너 에이전트: intent + parsed 기반으로 실행 전략 결정.
 *
 * @param {string} intent
 * @param {ReturnType<import('../chatbot/keywordParser.js').parseRagKeywords>} parsed
 * @returns {{
 *   strategy: 'hybrid'|'coordination'|'weather'|'cart'|'general',
 *   useWeather: boolean,
 *   useBodyType: boolean,
 *   useStyle: boolean,
 *   useCart: boolean,
 * }}
 */
export function plannerAgent(intent, parsed) {
  const useBodyType = Boolean(parsed.bodyType)
  const useWeather = parsed.weatherQuery && parsed.temperature != null
  const useCart = intent === INTENT.CART_RECOMMEND
  const useStyle =
    intent === INTENT.COORDINATION_RECOMMEND || intent === INTENT.WEATHER_COORDINATION

  let strategy
  switch (intent) {
    case INTENT.GENERAL_INFO:
      strategy = 'general'
      break
    case INTENT.CART_RECOMMEND:
      strategy = 'cart'
      break
    case INTENT.WEATHER_COORDINATION:
      strategy = 'weather'
      break
    case INTENT.COORDINATION_RECOMMEND:
      strategy = 'coordination'
      break
    default:
      strategy = 'hybrid'
  }

  return { strategy, useWeather, useBodyType, useStyle, useCart }
}
