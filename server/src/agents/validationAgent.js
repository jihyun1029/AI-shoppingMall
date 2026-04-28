import { validateCandidates } from '../chatbot/validationService.js'

const TOP_K = 12

/**
 * DB 재조회 + 제약 검증 에이전트.
 *
 * @param {object[]} ranked — 평면 재랭킹 결과
 * @param {Array<{ slot: object, rows: object[] }> | null} rankedSlots
 * @param {ReturnType<import('../chatbot/keywordParser.js').parseRagKeywords>} parsed
 * @param {{ strictCategory?: boolean }} [opts]
 * @returns {Promise<{ valid: object[], validSlots: Array<{ slot: object, rows: object[] }> | null, meta: object }>}
 */
export async function validationAgent(ranked, rankedSlots, parsed, opts = {}) {
  if (rankedSlots) {
    const validSlots = []
    let totalDropped = 0
    for (const { slot, rows } of rankedSlots) {
      const useAllowedBottom =
        slot.category === 'bottom' && Array.isArray(parsed.allowedSubCategories) && parsed.allowedSubCategories.length > 0
      const slotF = {
        ...parsed,
        categories: [slot.category],
        subCategories: [slot.subCategory],
        strictSubCategory: useAllowedBottom ? null : slot.subCategory,
      }
      const { rows: valid, meta } = await validateCandidates(rows.slice(0, 6), slotF)
      totalDropped += meta.droppedCount
      validSlots.push({ slot, rows: valid })
    }
    return { valid: [], validSlots, meta: { droppedCount: totalDropped } }
  }

  const { rows: valid, meta } = await validateCandidates(ranked.slice(0, TOP_K), parsed, opts)
  return { valid, validSlots: null, meta }
}
