import {
  hybridSearch,
  searchByCartContext,
  searchConstrainedFallback,
  searchPopularFallback,
  searchRelaxedBlob,
  keywordStructuredSearch,
} from '../chatbot/searchService.js'
import { filterByHardConstraints } from '../chatbot/rankingService.js'

/**
 * @typedef {{ slot: { category: string, subCategory: string }, rows: object[] }} SlotResult
 */

/**
 * 검색/후보 수집 에이전트.
 *
 * @param {ReturnType<import('../chatbot/keywordParser.js').parseRagKeywords>} parsed
 * @param {{ strategy: string }} plan
 * @param {{ cartProductIds?: string[], styleCtx?: { slots?: object[], styleKey?: string }, weatherCtx?: { temperature?: number } }} context
 * @returns {Promise<{
 *   candidates: object[],
 *   slotResults: SlotResult[] | null,
 *   usedFallback: boolean,
 * }>}
 */
export async function retrievalAgent(parsed, plan, context) {
  const { strategy } = plan

  if (strategy === 'cart') {
    const ids = (context.cartProductIds || []).map(String).filter(Boolean)
    if (ids.length === 0) {
      return { candidates: [], slotResults: null, usedFallback: false, cartEmpty: true }
    }
    let candidates = await searchByCartContext(ids, parsed)
    let usedFallback = false
    if (candidates.length === 0) {
      candidates = await searchPopularFallback()
      usedFallback = true
    }
    return { candidates, slotResults: null, usedFallback, cartEmpty: false }
  }

  if (strategy === 'coordination' || strategy === 'weather') {
    const slots = context.styleCtx?.slots || []
    const slotResults = []
    for (const slot of slots) {
      const useAllowedBottom =
        slot.category === 'bottom' && Array.isArray(parsed.allowedSubCategories) && parsed.allowedSubCategories.length > 0
      const f = {
        ...parsed,
        categories: [slot.category],
        subCategories: [slot.subCategory],
        strictSubCategory: useAllowedBottom ? null : slot.subCategory,
      }
      const rows = await keywordStructuredSearch(f)
      const ok = filterByHardConstraints(rows, f)
      slotResults.push({ slot, rows: ok.slice(0, 8) })
    }
    return { candidates: [], slotResults, usedFallback: false }
  }

  // 기본: hybrid 검색
  let candidates = await hybridSearch(parsed)
  if (candidates.length < 6) {
    const extra = await searchRelaxedBlob(parsed)
    const m = new Map()
    for (const r of [...candidates, ...extra]) {
      if (r?.id != null) m.set(r.id, r)
    }
    candidates = [...m.values()]
  }
  candidates = filterByHardConstraints(candidates, parsed)

  let usedFallback = false
  // 결과가 1~2개면 일부 조건을 완화해 후보 풀을 확장
  if (candidates.length > 0 && candidates.length < 3) {
    const relaxed = {
      ...parsed,
      strictSubCategory: null,
      colors: [],
      color: null,
      colorLabel: null,
    }
    const [moreConstrained, moreRelaxed] = await Promise.all([
      searchConstrainedFallback(relaxed),
      searchRelaxedBlob(relaxed),
    ])
    const merged = new Map(candidates.map((r) => [r.id, r]))
    for (const row of [...moreConstrained, ...moreRelaxed]) {
      if (row?.id != null && !merged.has(row.id)) merged.set(row.id, row)
    }
    candidates = [...merged.values()]
    usedFallback = true
  }

  if (candidates.length === 0 && !parsed.colors?.length && !parsed.strictSubCategory) {
    const constrained = await searchConstrainedFallback(parsed)
    if (constrained.length > 0) {
      candidates = constrained
      usedFallback = true
    } else if (!parsed.categories?.length && parsed.minPrice == null && parsed.maxPrice == null) {
      candidates = await searchPopularFallback()
      usedFallback = true
    }
  }

  return { candidates, slotResults: null, usedFallback }
}
