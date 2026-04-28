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

function norm(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * 후속 질문 판별: 짧거나 명시적 수정 마커가 있으면 true.
 * @param {string} message
 * @param {ReturnType<import('../chatbot/keywordParser.js').parseRagKeywords>} parsed
 */
function isFollowUp(message, parsed) {
  const n = norm(message)
  // 명시적 수정 마커
  if (/말고|제외|빼고|대신|다른\s*(색|색상)|더\s*(저렴|비싼)|추가로|바꿔/.test(n)) return true
  // 짧고 독립적 컨텍스트가 없는 경우
  if (n.length <= 20 && !parsed.weatherQuery && !parsed.bodyType) return true
  return false
}

/**
 * 이전 대화 컨텍스트와 현재 parsed를 병합.
 * 현재 메시지가 명시한 값이 있으면 우선, 없으면 lastContext 값 사용.
 * excludedSubCategories는 누적(합집합).
 */
function mergeWithLastContext(parsed, lastContext) {
  if (!lastContext) return parsed
  return {
    ...parsed,
    temperature: parsed.temperature ?? lastContext.temperature ?? null,
    weatherQuery: parsed.weatherQuery || Boolean(lastContext.temperature),
    styleKeyword: parsed.styleKeyword ?? lastContext.styleKeyword ?? null,
    bodyType: parsed.bodyType ?? lastContext.bodyType ?? null,
    colors: parsed.colors.length > 0 ? parsed.colors : (lastContext.colors || []),
    color: parsed.color ?? lastContext.color ?? null,
    colorLabel: parsed.colorLabel ?? lastContext.colorLabel ?? null,
    minPrice: parsed.minPrice ?? lastContext.minPrice ?? null,
    minPriceOp: parsed.minPriceOp ?? lastContext.minPriceOp ?? null,
    maxPrice: parsed.maxPrice ?? lastContext.maxPrice ?? null,
    maxPriceOp: parsed.maxPriceOp ?? lastContext.maxPriceOp ?? null,
    // 제외 목록은 누적
    excludedSubCategories: [
      ...new Set([
        ...(parsed.excludedSubCategories || []),
        ...(lastContext.excludedSubCategories || []),
      ]),
    ],
  }
}

/**
 * Agent 기반 챗봇 워크플로 파이프라인.
 *
 * 단계:
 * 1. intentAgent     — Intent 분류
 * 2. parserAgent     — 키워드·조건 파싱
 * 3. (컨텍스트 병합) — lastContext 와 후속 질문 병합
 * 4. plannerAgent    — 실행 전략 결정
 * 5. weatherAgent    — 기온/날씨 컨텍스트 (필요 시)
 * 6. bodyTypeAgent   — 체형 컨텍스트 (필요 시)
 * 7. styleAgent      — 스타일/슬롯 결정 (coordination/weather)
 * 8. retrievalAgent  — 후보 수집
 * 9. rankingAgent    — 재랭킹
 * 10. validationAgent — DB 재조회 + 제약 검증
 * 11. responseAgent  — 텍스트·상품 응답 생성
 *
 * @param {string} message
 * @param {{ cartProductIds?: string[], lastContext?: object | null }} [opts]
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
  const { parsed: rawParsed, keywords: rawKeywords } = parserAgent(message)
  trace.parser = rawParsed

  // Step 3: 이전 대화 컨텍스트 병합
  const followUp = isFollowUp(message, rawParsed)
  const parsed = followUp ? mergeWithLastContext(rawParsed, opts.lastContext) : rawParsed
  const keywords = followUp ? { ...rawKeywords, allowedSubCategories: parsed.allowedSubCategories, excludedSubCategories: parsed.excludedSubCategories } : rawKeywords
  trace.contextMerge = { followUp, lastContext: opts.lastContext ?? null }

  console.log('[workflow debug]', {
    message,
    lastContext: opts.lastContext,
    followUp,
    allowedSubCategories: parsed.allowedSubCategories,
    excludedSubCategories: parsed.excludedSubCategories,
    temperature: parsed.temperature,
    styleKeyword: parsed.styleKeyword,
  })

  // Step 4: 실행 전략
  const plan = plannerAgent(intent, parsed)
  trace.planner = plan

  // Step 5 & 6: 날씨·체형 컨텍스트 (병렬)
  const [weatherCtx, bodyTypeCtx] = await Promise.all([
    plan.useWeather ? Promise.resolve(weatherAgent(parsed)) : Promise.resolve(null),
    plan.useBodyType ? Promise.resolve(bodyTypeAgent(parsed)) : Promise.resolve(null),
  ])
  trace.weather = weatherCtx
  trace.bodyType = bodyTypeCtx

  // Step 7: 스타일/슬롯 (coordination·weather 전략에서 필요)
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

  // Step 8: 후보 수집
  const context = {
    cartProductIds: opts.cartProductIds,
    styleCtx,
    weatherCtx,
    bodyTypeCtx,
  }
  const { candidates, slotResults, usedFallback, cartEmpty = false } = await retrievalAgent(parsed, plan, context)
  trace.retrieval = {
    candidateCount: candidates.length,
    slotCount: slotResults?.length ?? null,
    usedFallback,
    cartEmpty,
  }

  // Step 9: 재랭킹
  const { ranked, rankedSlots } = rankingAgent(candidates, slotResults, parsed, { bodyTypeCtx })
  trace.ranking = { rankedCount: ranked.length, rankedSlotCount: rankedSlots?.length ?? null }

  // Step 10: 검증
  const validationResult = await validationAgent(ranked, rankedSlots, parsed)
  trace.validation = {
    validCount: validationResult.valid.length,
    validSlotCount: validationResult.validSlots?.length ?? null,
    meta: validationResult.meta,
  }

  // Step 11: 응답 생성
  const { text, products } = responseAgent(
    validationResult,
    parsed,
    plan,
    {
      weatherCtx,
      bodyTypeCtx,
      styleCtx,
      cartEmpty,
      followUp,
      contextTemperature: followUp ? (opts.lastContext?.temperature ?? null) : null,
    },
    message,
    usedFallback,
  )
  trace.response = { productCount: products.length }

  console.log('[workflow debug] finalProducts:', products.map((p) => ({
    id: p.id,
    name: p.name,
    subCategory: p.subCategory,
  })))
  console.log('[workflow] intent=%s strategy=%s followUp=%s products=%d', intent, plan.strategy, followUp, products.length)

  return { intent, keywords, text, products, trace }
}
