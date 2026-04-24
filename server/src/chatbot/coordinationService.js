import { parseRagKeywords } from './keywordParser.js'
import { keywordStructuredSearch } from './searchService.js'
import { filterByHardConstraints } from './rankingService.js'
import { validateCandidates } from './validationService.js'
import { rowToApiProduct } from '../productRowMapper.js'

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** @param {string} styleKey */
function slotsForStyle(styleKey) {
  /** @type {Record<string, { category: string, subCategory: string, label: string }[]>} */
  const map = {
    office: [
      { category: 'top', subCategory: '블라우스', label: '상의(블라우스)' },
      { category: 'bottom', subCategory: '슬랙스', label: '하의(슬랙스)' },
      { category: 'shoes', subCategory: '로퍼', label: '신발(로퍼)' },
    ],
    daily: [
      { category: 'top', subCategory: '반팔티', label: '상의(티)' },
      { category: 'bottom', subCategory: '데님', label: '하의(데님)' },
      { category: 'shoes', subCategory: '스니커즈', label: '신발(스니커즈)' },
    ],
    date: [
      { category: 'top', subCategory: '블라우스', label: '상의(블라우스)' },
      { category: 'bottom', subCategory: '스커트', label: '하의(스커트)' },
      { category: 'shoes', subCategory: '힐', label: '신발(힐)' },
    ],
    feminine: [
      { category: 'dress', subCategory: '롱 원피스', label: '원피스' },
      { category: 'shoes', subCategory: '힐', label: '신발(힐)' },
      { category: 'bag', subCategory: '숄더백', label: '가방(숄더)' },
    ],
    casual: [
      { category: 'top', subCategory: '맨투맨', label: '상의(맨투맨)' },
      { category: 'bottom', subCategory: '데님', label: '하의(데님)' },
      { category: 'shoes', subCategory: '스니커즈', label: '신발(스니커즈)' },
    ],
  }
  return map[styleKey] || map.office
}

function styleLineKo(styleKey) {
  switch (styleKey) {
    case 'office':
      return '출근룩'
    case 'daily':
      return '데일리룩'
    case 'date':
      return '데이트룩'
    case 'feminine':
      return '페미닌 무드'
    case 'casual':
      return '캐주얼룩'
    default:
      return '오피스룩'
  }
}

/**
 * Intent: COORDINATION_RECOMMEND — 슬롯별 1벌씩 골라 코디 세트 구성.
 * @param {import('better-sqlite3').Database} db
 * @param {string} message
 */
export function runCoordinationRecommend(db, message) {
  const base = parseRagKeywords(message)
  const n = norm(message)
  let styleKey = base.styleKeyword || 'office'
  if (!base.styleKeyword) {
    if (/데이트|러블리/.test(n)) styleKey = 'date'
    else if (/데일리|일상|무난/.test(n)) styleKey = 'daily'
    else if (/캐주얼|편한|힙|후드|니트/.test(n)) styleKey = 'casual'
    else if (/페미닌|원피스/.test(n)) styleKey = 'feminine'
  }
  const slots = slotsForStyle(styleKey)

  const picked = []
  const seen = new Set()
  for (const slot of slots) {
    const f = {
      ...base,
      categories: [slot.category],
      subCategories: [slot.subCategory],
      strictSubCategory: slot.subCategory,
    }
    const rows = keywordStructuredSearch(db, f)
    const ok = filterByHardConstraints(rows, f)
    const { rows: valid } = validateCandidates(db, ok.slice(0, 6), f)
    const row = valid[0]
    if (row && !seen.has(row.id)) {
      seen.add(row.id)
      picked.push(rowToApiProduct(row))
    }
  }

  const styleName = styleLineKo(styleKey)
  const parts = slots.map((s) => s.label.split('(')[1]?.replace(')', '') || s.subCategory).join(', ')
  const text =
    picked.length > 0
      ? `${styleName}으로 ${parts} 조합을 제안해요. 각 슬롯에서 조건(색상·가격)을 맞춘 상품을 골랐어요. 함께 매치해 보세요 😊`
      : `${styleName}에 맞는 조합을 찾기 어려워요. 색상이나 가격 조건을 완화해 보시겠어요?`

  return { text, products: picked.slice(0, 6) }
}
