import { rerank, filterByHardConstraints } from '../chatbot/rankingService.js'

function bodyTypeRowBoost(row, bodyType) {
  if (!bodyType) return 0
  const txt = `${row?.name || ''} ${row?.description || ''} ${Array.isArray(row?.colors) ? row.colors.join(' ') : ''}`.toLowerCase()
  switch (bodyType) {
    case '통통':
      return (/와이드|세미\s*와이드|루즈|여유핏/.test(txt) ? 3 : 0) + (/블랙|네이비|차콜|다크/.test(txt) ? 1 : 0)
    case '마른':
      return (/슬림|슬림핏/.test(txt) ? 2 : 0) + (/가디건|레이어드|니트|셔츠/.test(txt) ? 2 : 0)
    case '키작은':
      return /하이웨스트|크롭|미니|숏/.test(txt) ? 2 : 0
    case '키큰':
      return /롱|맥시|와이드|코트/.test(txt) ? 2 : 0
    case '상체통통':
      return /루즈|셔츠|블라우스|가디건|브이넥|v넥/.test(txt) ? 2 : 0
    case '하체통통':
      return /세미\s*와이드|와이드|스트레이트|슬랙스|다크/.test(txt) ? 2 : 0
    case '어깨넓은':
      return /드롭|루즈|브이넥|v넥|가디건/.test(txt) ? 2 : 0
    case '골반넓은':
      return /와이드|스트레이트|롱|슬랙스/.test(txt) ? 2 : 0
    default:
      return 0
  }
}

/**
 * 재랭킹 에이전트.
 *
 * @param {object[]} candidates — 평면 후보 목록
 * @param {object[] | null} slotResults — 슬롯별 후보 (coordination/weather 전략)
 * @param {ReturnType<import('../chatbot/keywordParser.js').parseRagKeywords>} parsed
 * @param {{ bodyTypeCtx?: { bodyType?: string } | null }} context
 * @returns {{ ranked: object[], rankedSlots: Array<{ slot: object, rows: object[] }> | null }}
 */
export function rankingAgent(candidates, slotResults, parsed, context) {
  const bodyType = context.bodyTypeCtx?.bodyType || null

  if (slotResults) {
    const rankedSlots = slotResults.map(({ slot, rows }) => {
      const sorted = [...rows].sort(
        (a, b) => bodyTypeRowBoost(b, bodyType) - bodyTypeRowBoost(a, bodyType),
      )
      return { slot, rows: sorted }
    })
    return { ranked: [], rankedSlots }
  }

  const ranked = rerank(candidates, parsed)
  if (bodyType) {
    ranked.sort(
      (a, b) => bodyTypeRowBoost(b, bodyType) - bodyTypeRowBoost(a, bodyType) || 0,
    )
  }

  return { ranked, rankedSlots: null }
}
