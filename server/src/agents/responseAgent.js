import { rowToApiProduct } from '../productRowMapper.js'
import { assignRecommendReasons, generateOverallReplyIntro } from '../chatbot/recommendReasonService.js'
import { answerGeneralInfo } from '../chatbot/generalInfoService.js'
import { rerank } from '../chatbot/rankingService.js'

const FINAL_N = 5

function buildNoResultText(parsed) {
  const cw = parsed.colorLabel || parsed.color
  const sub = parsed.strictSubCategory
  if (sub && cw) return `${cw} ${sub} 상품은 현재 조건에 맞는 상품이 없어요. 색상이나 다른 조건을 완화해서 다시 추천드릴까요?`
  if (sub) return `${sub} 상품은 현재 조건에 맞는 상품이 없어요. 조건을 완화해서 다시 검색해 보시겠어요?`
  if (parsed.colors?.length) {
    const colorWord = cw || '요청하신 컬러'
    const itemHint = parsed.subCategories?.length ? parsed.subCategories[0] : parsed.categories?.[0] === 'bag' ? '가방' : '상품'
    return `요청하신 ${colorWord} ${itemHint} 조합은 현재 등록된 상품이 없어요 😢 색상 조건을 조금 완화해서 다시 검색해 보시겠어요?`
  }
  return '조건에 맞는 상품을 찾지 못했어요. 검색 조건을 조금 바꿔 볼까요?'
}

/**
 * 응답 생성 에이전트.
 *
 * @param {{
 *   valid: object[],
 *   validSlots: Array<{ slot: object, rows: object[] }> | null,
 * }} validationResult
 * @param {ReturnType<import('../chatbot/keywordParser.js').parseRagKeywords>} parsed
 * @param {{ strategy: string }} plan
 * @param {{
 *   weatherCtx?: { guide: string, temperature: number } | null,
 *   bodyTypeCtx?: { mention: string, explain: string } | null,
 *   styleCtx?: { label: string, slots: object[] } | null,
 * }} context
 * @param {string} message
 * @param {boolean} usedFallback
 * @returns {{ text: string, products: object[] }}
 */
export function responseAgent(validationResult, parsed, plan, context, message, usedFallback) {
  const { strategy } = plan
  const { valid, validSlots } = validationResult

  // 일반 FAQ
  if (strategy === 'general') {
    const { text } = answerGeneralInfo(message)
    return { text, products: [] }
  }

  // 장바구니 추천
  if (strategy === 'cart') {
    if (context.cartEmpty) {
      return {
        text: '장바구니에 담긴 상품이 없어요 😊 먼저 마음에 드는 상품을 담아주시면, 그에 맞는 코디를 추천해드릴게요!',
        products: [],
      }
    }
    const finalRanked = rerank(valid, parsed)
    const products = assignRecommendReasons(
      finalRanked.slice(0, FINAL_N).map(rowToApiProduct),
      parsed,
      message,
    )
    const text = usedFallback
      ? `장바구니 상품에 어울리는 코디를 찾지 못했어요 😢 조건을 조금 완화해서 추천드릴게요.`
      : products.length > 0
        ? '담아두신 상품과 같은 무드의 카테고리에서 골라, 함께 입기 좋은 아이템을 추천드릴게요. 하의·신발·가방 위주로 맞춰봤어요 😊'
        : '장바구니와 어울리면서도 조건에 맞는 상품을 찾지 못했어요. 검색 조건을 조금 바꿔 볼까요?'
    return { text, products }
  }

  // 코디/날씨 슬롯 기반
  if ((strategy === 'coordination' || strategy === 'weather') && validSlots) {
    const picked = []
    const seen = new Set()
    for (const { rows } of validSlots) {
      const row = rows[0]
      if (row && !seen.has(row.id)) {
        seen.add(row.id)
        picked.push(rowToApiProduct(row))
      }
    }

    let text
    if (strategy === 'weather') {
      const baseGuide = context.weatherCtx?.guide || ''
      if (picked.length > 0) {
        const styleKey = context.styleCtx?.styleKey
        const officeHint =
          styleKey === 'office' ? '출근룩으로 입는 경우에는 구두/로퍼와 단정한 가방을 보조로 매치하면 깔끔해요.' : ''
        text = `${baseGuide} ${officeHint}`.trim()
      } else {
        text = `현재 기온 기준 정확히 맞는 조합이 적어 비슷한 계절감 상품을 찾기 어려웠어요. ${baseGuide}`
      }
    } else {
      const styleName = context.styleCtx?.label || '코디'
      const slots = context.styleCtx?.slots || []
      const parts = slots.map((s) => s.label.split('(')[1]?.replace(')', '') || s.subCategory).join(', ')
      const bt = context.bodyTypeCtx
      text =
        picked.length > 0
          ? bt
            ? `${bt.mention} ${styleName} 기준 ${parts} 조합으로 추천드려요. ${bt.explain}`.trim()
            : `${styleName}으로 ${parts} 조합을 제안해요. 각 슬롯에서 조건(색상·가격)을 맞춘 상품을 골랐어요. 함께 매치해 보세요 😊`
          : `${styleName}에 맞는 조합을 찾기 어려워요. 색상이나 가격 조건을 완화해 보시겠어요?`
    }

    const products = assignRecommendReasons(picked.slice(0, 6), parsed, message)
    return { text, products }
  }

  // 기본 hybrid: 상품 추천
  const finalRanked = rerank(valid, parsed)
  const slice = finalRanked.slice(0, FINAL_N)

  if (slice.length === 0) {
    return { text: buildNoResultText(parsed), products: [] }
  }

  const rawProducts = slice.map(rowToApiProduct)
  let text
  if (usedFallback) {
    text = `조건에 맞는 후보가 적어, 인기·평점 순으로 ${rawProducts.length}건을 넓혀서 골랐어요. 말씀하신 서브카테고리·색과 다를 수 있으니 상품 설명을 함께 확인해 주세요 😊`
  } else {
    const baseText = generateOverallReplyIntro(rawProducts, parsed)
    // 후속 질문 + 이전 대화에 기온 정보가 있으면 맥락 언급
    const temp = context.followUp ? (context.contextTemperature ?? null) : null
    text = temp != null
      ? `앞서 말씀하신 ${temp}도 날씨 기준으로, ${baseText.replace(/^[A-Z가-힣]/, (c) => c.toLowerCase())}`
      : baseText
  }

  const products = assignRecommendReasons(rawProducts, parsed, message)
  return { text, products }
}
