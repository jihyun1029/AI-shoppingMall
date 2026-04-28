import { intentAgent } from '../agents/intentAgent.js'
import { parserAgent } from '../agents/parserAgent.js'
import { plannerAgent } from '../agents/plannerAgent.js'
import { weatherAgent } from '../agents/weatherAgent.js'
import { bodyTypeAgent } from '../agents/bodyTypeAgent.js'
import { styleAgent } from '../agents/styleAgent.js'
import { retrievalAgent } from '../agents/retrievalAgent.js'
import { rankingAgent } from '../agents/rankingAgent.js'
import { validationAgent } from '../agents/validationAgent.js'
import { responseAgent } from '../agents/responseAgent.js'
import { weatherSlotsForTemp } from '../agents/styleAgent.js'

/**
 * Agent 기반 챗봇 워크플로 파이프라인.
 *
 * 단계:
 * 1. intentAgent     — Intent 분류
 * 2. parserAgent     — 키워드·조건 파싱
 * 3. plannerAgent    — 실행 전략 결정
 * 4. weatherAgent    — 기온/날씨 컨텍스트 (필요 시)
 * 5. bodyTypeAgent   — 체형 컨텍스트 (필요 시)
 * 6. styleAgent      — 스타일/슬롯 결정 (coordination/weather)
 * 7. retrievalAgent  — 후보 수집
 * 8. rankingAgent    — 재랭킹
 * 9. validationAgent — DB 재조회 + 제약 검증
 * 10. responseAgent  — 텍스트·상품 응답 생성
 *
 * @param {string} message
 * @param {{ cartProductIds?: string[] }} [opts]
 * @returns {Promise<{
 *   intent: string,
 *   keywords: object,
 *   text: string,
 *   products: object[],
 *   trace: Record<string, object>,
 * }>}
 */
export async function runWorkflow(message, opts = {}) {
  const trace = {}

  // Step 1: Intent 분류
  const { intent, scores } = intentAgent(message)
  trace.intent = { intent, scores }

  // Step 2: 키워드 파싱
  const { parsed, keywords } = parserAgent(message)
  trace.parser = { parsed, keywords }

  // Step 3: 실행 전략
  const plan = plannerAgent(intent, parsed)
  trace.planner = plan

  // Step 4 & 5: 날씨·체형 컨텍스트 (병렬)
  const [weatherCtx, bodyTypeCtx] = await Promise.all([
    plan.useWeather ? Promise.resolve(weatherAgent(parsed)) : Promise.resolve(null),
    plan.useBodyType ? Promise.resolve(bodyTypeAgent(parsed)) : Promise.resolve(null),
  ])
  trace.weather = weatherCtx
  trace.bodyType = bodyTypeCtx

  // Step 6: 스타일/슬롯 (coordination·weather 전략에서 필요)
  let styleCtx = null
  if (plan.useStyle) {
    if (plan.strategy === 'weather' && weatherCtx) {
      const styleKey = parsed.styleKeyword || (/출근|오피스|미팅/.test(message) ? 'office' : 'daily')
      const slots = weatherSlotsForTemp(weatherCtx.temperature, styleKey)
      styleCtx = { styleKey, label: styleKey, slots }
    } else {
      styleCtx = styleAgent(message, parsed, bodyTypeCtx)
    }
  }
  trace.style = styleCtx

  // Step 7: 후보 수집
  const context = {
    cartProductIds: opts.cartProductIds,
    styleCtx,
    weatherCtx,
    bodyTypeCtx,
  }
  const { candidates, slotResults, usedFallback } = await retrievalAgent(parsed, plan, context)
  trace.retrieval = {
    candidateCount: candidates.length,
    slotCount: slotResults?.length ?? null,
    usedFallback,
  }

  // Step 8: 재랭킹
  const { ranked, rankedSlots } = rankingAgent(candidates, slotResults, parsed, { bodyTypeCtx })
  trace.ranking = { rankedCount: ranked.length, rankedSlotCount: rankedSlots?.length ?? null }

  // Step 9: 검증
  const validationResult = await validationAgent(ranked, rankedSlots, parsed)
  trace.validation = {
    validCount: validationResult.valid.length,
    validSlotCount: validationResult.validSlots?.length ?? null,
    meta: validationResult.meta,
  }

  // Step 10: 응답 생성
  const { text, products } = responseAgent(
    validationResult,
    parsed,
    plan,
    { weatherCtx, bodyTypeCtx, styleCtx },
    message,
    usedFallback,
  )
  trace.response = { productCount: products.length }

  console.log('[workflow] intent=%s strategy=%s products=%d', intent, plan.strategy, products.length)

  return { intent, keywords, text, products, trace }
}
