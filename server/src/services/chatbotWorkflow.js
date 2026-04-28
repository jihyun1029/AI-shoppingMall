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
import { INTENT } from '../chatbot/intentClassifier.js'
import { buildAgentKeywords } from '../chatbot/keywordParser.js'

function norm(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function hasConversationThread(lastContext) {
  if (!lastContext || typeof lastContext !== 'object') return false
  return Boolean(
    lastContext.temperature != null ||
      lastContext.bodyType ||
      (Array.isArray(lastContext.allowedSubCategories) && lastContext.allowedSubCategories.length > 0) ||
      (Array.isArray(lastContext.excludedSubCategories) && lastContext.excludedSubCategories.length > 0) ||
      (typeof lastContext.intent === 'string' &&
        (lastContext.intent.includes('COORDINATION') || lastContext.intent === INTENT.WEATHER_COORDINATION)),
  )
}

/** 완전히 새 상품 검색으로 보이면 컨텍스트 머지·의도 고정을 하지 않음 */
function isFreshProductQuery(message, rawParsed, lastContext) {
  if (!lastContext) return false
  const n = norm(message)
  if (/처음부터|리셋|새\s*질문|다른\s*건으로|상품만\s*찾아/.test(n)) return true
  const productish =
    (rawParsed.strictSubCategory || (rawParsed.categories || []).length > 0) &&
    (rawParsed.colors || []).length > 0 &&
    !/(코디|룩|날씨|기온|체형|통통|바지|팬츠|스커트|하의|도\s*\d)/.test(n)
  return productish
}

function isExplicitFollowUpMarker(message) {
  const n = norm(message)
  return /그럼|이면\??|라면\??|그\s*기준으로|이\s*조건(이면|으로)?|바지(도|로)?|다른\s*것도|말고|제외|빼고|대신|추가로|바꿔/.test(n)
}

/** 완전한 재요청 문장은 새 질문으로 처리 */
function isExplicitNewRequest(message) {
  const n = norm(message)
  if (isExplicitFollowUpMarker(n)) return false
  return /(추천해줘|코디\s*추천해줘|코디\s*추천|보여줘|골라줘|찾아줘|알려줘)/.test(n)
}

/**
 * 후속 질문: 이전 스레드가 있고, 새 질문이 맥락을 이어가는 경우.
 * @param {string} message
 * @param {ReturnType<import('../chatbot/keywordParser.js').parseRagKeywords>} rawParsed
 * @param {object | null} lastContext
 */
function isFollowUpMessage(message, rawParsed, lastContext) {
  if (!hasConversationThread(lastContext)) return false
  if (isFreshProductQuery(message, rawParsed, lastContext)) return false

  const n = norm(message)
  if (isExplicitNewRequest(n)) return false

  if (
    /바지(도|로|는)?\s*(추천|보여|골라|알려)|스커트\s*(말고|제외|빼고)|(말고|제외|빼고)\s*스커트|통통한\s*체형|체형\s*코디|이\s*조건(이면|으로)?|그\s*기준으로|다른\s*것도(\s*보여)?|말고|제외|빼고|대신|바꿔|추가로/.test(
      n,
    )
  ) {
    return true
  }

  if (/(그럼\s*)?\d{1,2}\s*도(의)?\s*날씨(인데|면|엔)?|날씨는?\s*\d{1,2}\s*도(야|인데)?|기온(은|이)?\s*\d{1,2}\s*도(야|인데)?/.test(n)) {
    return true
  }

  // 짧은 온도 질문(예: "그럼 23도는?", "23도면?")만 후속 처리
  if (/^(그럼\s*)?\d{1,2}\s*도(면|는|엔)?\??$/.test(n) || /^\d{1,2}\s*도(면|는)\??$/.test(n)) return true

  if (
    lastContext.temperature != null &&
    /(코디|룩|추천|체형|통통|마른|키\s*작|키\s*큰|바지|팬츠|스커트|하의|상의|신발|가방|어울|입을|매치|입기)/.test(n)
  ) {
    return true
  }

  if (
    ((lastContext.allowedSubCategories || []).length > 0 || (lastContext.excludedSubCategories || []).length > 0) &&
    rawParsed.temperature == null &&
    /(코디|추천|체형|통통|보여|골라)/.test(n)
  ) {
    return true
  }

  if (n.length <= 40 && rawParsed.temperature == null && !/^\d{1,2}\s*도/.test(n)) {
    const clothingish = /(코디|룩|옷|추천|체형|입|바지|치마|스커트|신발|가방|상의|하의|핏|매치|어울|보여|골라|통통|마른|색|컬러)/.test(n)
    if (
      clothingish &&
      (lastContext.temperature != null ||
        (lastContext.allowedSubCategories || []).length ||
        (lastContext.excludedSubCategories || []).length ||
        lastContext.bodyType)
    ) {
      return true
    }
  }

  return false
}

/** 새 메시지에서 스커트·치마를 긍정적으로 요청하면 이전 바지 한정 필터는 상속하지 않음 */
function shouldDropInheritedPantsFilter(message, parsed) {
  const n = norm(message)
  if (/(말고|제외|빼고)\s*스커트|스커트\s*(말고|제외|빼고)/.test(n)) return false
  if (parsed.strictSubCategory === '스커트') return true
  if (/(스커트|치마)(으로|로|는|를|\s*추천|\s*코디|\s*입)/.test(n)) return true
  return false
}

/**
 * 이전 대화 컨텍스트와 현재 parsed 병합.
 * 명시된 값이 새 메시지에 있으면 우선, 없으면 lastContext 유지.
 * excludedSubCategories는 합집합.
 */
function mergeWithLastContext(message, parsed, lastContext) {
  if (!lastContext) {
    return {
      ...parsed,
      weatherQuery: parsed.weatherQuery || parsed.temperature != null,
    }
  }
  const lc = lastContext
  const temperature = parsed.temperature ?? lc.temperature ?? null
  const weatherQuery = parsed.weatherQuery || temperature != null

  const rawAllow = parsed.allowedSubCategories || []
  const lastAllow = lc.allowedSubCategories || []
  const dropPants = shouldDropInheritedPantsFilter(message, parsed)
  const allowedSubCategories = dropPants
    ? [...rawAllow]
    : rawAllow.length
      ? [...rawAllow]
      : [...lastAllow]

  let categories = [...(parsed.categories || [])]
  if (categories.length === 0 && Array.isArray(lc.categories) && lc.categories.length) {
    categories = [...lc.categories]
  }

  const strictSubCategory = parsed.strictSubCategory ?? lc.strictSubCategory ?? lc.subCategory ?? null
  const mergedBodyType = parsed.bodyType ?? lc.bodyType ?? null

  const mergedContext = {
    ...parsed,
    temperature,
    weatherQuery,
    categories,
    strictSubCategory,
    styleKeyword: parsed.styleKeyword ?? lc.styleKeyword ?? lc.style ?? null,
    bodyType: mergedBodyType,
    colors: (parsed.colors || []).length > 0 ? parsed.colors : lc.colors || [],
    color: parsed.color ?? lc.color ?? null,
    colorLabel: parsed.colorLabel ?? lc.colorLabel ?? null,
    minPrice: parsed.minPrice ?? lc.minPrice ?? null,
    minPriceOp: parsed.minPriceOp ?? lc.minPriceOp ?? null,
    maxPrice: parsed.maxPrice ?? lc.maxPrice ?? null,
    maxPriceOp: parsed.maxPriceOp ?? lc.maxPriceOp ?? null,
    allowedSubCategories,
    excludedSubCategories: dropPants
      ? [...new Set([...(parsed.excludedSubCategories || [])])]
      : [...new Set([...(parsed.excludedSubCategories || []), ...(lc.excludedSubCategories || [])])],
  }

  // bodyType은 누적이 아닌 교체 조건: 새 값이 있으면 항상 최신 값으로 강제 반영.
  if (parsed.bodyType) {
    mergedContext.bodyType = parsed.bodyType
  }

  console.log({
    previousBodyType: lc.bodyType ?? null,
    newBodyType: parsed.bodyType ?? null,
    finalBodyType: mergedContext.bodyType ?? null,
  })

  return mergedContext
}

function resolveIntentAfterMerge(intent, followUp, parsed, lastContext) {
  if (parsed.temperature != null) return INTENT.WEATHER_COORDINATION
  if (parsed.bodyType && parsed.temperature == null) return INTENT.COORDINATION_RECOMMEND
  if (!followUp || !lastContext) return intent
  if (intent === INTENT.CART_RECOMMEND || intent === INTENT.GENERAL_INFO) return intent
  const hadWeather = lastContext.temperature != null || lastContext.intent === INTENT.WEATHER_COORDINATION
  if (hadWeather && parsed.temperature != null) return INTENT.WEATHER_COORDINATION
  return intent
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
  let { intent, scores } = intentAgent(message)
  trace.intent = { intent, scores }

  // Step 2: 키워드 파싱
  const { parsed: rawParsed } = parserAgent(message)
  trace.parser = rawParsed

  // Step 3: 이전 대화 컨텍스트 병합
  const followUp = isFollowUpMessage(message, rawParsed, opts.lastContext)
  const parsed = followUp
    ? mergeWithLastContext(message, rawParsed, opts.lastContext)
    : mergeWithLastContext(message, rawParsed, null)
  intent = resolveIntentAfterMerge(intent, followUp, parsed, opts.lastContext)
  trace.intent = { intent, scores, afterMerge: intent }
  trace.contextMerge = {
    followUp,
    previousContext: opts.lastContext ?? null,
    parsedContext: rawParsed,
    mergedContext: parsed,
  }

  const keywords = buildAgentKeywords(message, parsed)

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
      const slots = weatherSlotsForTemp(weatherCtx.temperature, styleKey, parsed)
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
      contextTemperature: followUp && parsed.temperature != null ? parsed.temperature : null,
    },
    message,
    usedFallback,
  )
  trace.response = { productCount: products.length }

  console.log({
    message,
    isFollowUp: followUp,
    previousContext: opts.lastContext ?? null,
    parsedContext: rawParsed,
    mergedContext: parsed,
    finalIntent: intent,
  })
  console.log('[workflow] intent=%s strategy=%s followUp=%s products=%d', intent, plan.strategy, followUp, products.length)

  return { intent, keywords, text, products, trace }
}
