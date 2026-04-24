import { productMatchesColorTokens } from './colorFilter.js'

function colorNamesJson(product) {
  const names = (product.colors || [])
    .map((c) => (typeof c === 'string' ? c : c?.name))
    .filter(Boolean)
  return JSON.stringify(names)
}

function productMatchesColorFilter(product, colorTokens) {
  if (!colorTokens?.length) return false
  return productMatchesColorTokens(colorNamesJson(product), colorTokens)
}

function categoryMatchesQuery(product, f) {
  if (!f.categories?.length) return false
  return f.categories.includes(String(product.category))
}

function subCategoryMatchesQuery(product, f) {
  if (f.strictSubCategory) return String(product.subCategory) === String(f.strictSubCategory)
  if (f.subCategories?.length) return f.subCategories.includes(String(product.subCategory))
  return false
}

function priceSatisfiesMax(product, f) {
  if (f.maxPrice == null || Number.isNaN(f.maxPrice)) return false
  return Number(product.salePrice) <= f.maxPrice
}

function priceSatisfiesMin(product, f) {
  if (f.minPrice == null || Number.isNaN(f.minPrice)) return false
  return Number(product.salePrice) >= f.minPrice
}

/** 질문 색 토큰과 일치하는 이 상품의 컬러명 (표기용) */
function primaryMatchedColorName(product, f) {
  if (!f.colors?.length) return ''
  const names = (product.colors || []).map((c) => String(c?.name || c))
  for (const token of f.colors) {
    const hit = names.find((n) => n.toLowerCase() === String(token).toLowerCase())
    if (hit) return hit
  }
  return f.colorLabel || f.color || ''
}

/** 상품명에서 구체 디테일 키워드 추출 (데이터 기반) */
const NAME_DETAIL_WORDS = [
  '와이드',
  '슬림',
  '크롭',
  '미디',
  '롱',
  '핀턱',
  '스트레이트',
  '하이웨스트',
  '테이퍼드',
  '루즈',
  '오버',
  '밴딩',
  '슬림핏',
  '오버핏',
  'H라인',
  '랩',
  '에센셜',
  '싱글',
  '더블',
]

function detailWordsFromName(name) {
  const n = String(name || '')
  const hits = []
  for (const w of NAME_DETAIL_WORDS) {
    if (n.includes(w) && !hits.includes(w)) hits.push(w)
  }
  return hits.slice(0, 3)
}

/** description에서 보일러플레이트 뒤 한 문장만 (있을 때만) */
function concreteDescriptionClause(product) {
  const raw = String(product.description || '').replace(/\s+/g, ' ').trim()
  if (!raw || raw.length < 30) return ''
  if (!/은\(는\)\s*\S+\s*의\s*시즌 무드/.test(raw)) return ''
  const parts = raw.split(/\.\s+/)
  if (parts.length < 2) return ''
  const second = parts[1]?.trim() || ''
  if (second.length < 12) return ''
  if (product.subCategory && /카테고리에서/.test(second) && !second.includes(product.subCategory)) {
    return ''
  }
  return second.length > 72 ? `${second.slice(0, 72).replace(/\s+\S*$/, '')}…` : second
}

const BANNED_IN_OUTPUT =
  /실루엣과 소재를|감각적인 스타일|세련된 무드|미니멀한 느낌|한 번 살펴보시면|베이직한 디자인으로 데일리하게|은은하게 살리면|무드로 미니멀하게/gi

function sanitizeOutput(s) {
  return String(s || '')
    .replace(BANNED_IN_OUTPUT, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.])/g, '$1')
    .trim()
}

/** 문장 경계용: 끝에 마침표가 없으면 추가 */
function withSentenceEnd(fragment) {
  const t = String(fragment || '').trim()
  if (!t) return ''
  return /[.!?…]$/.test(t) ? t : `${t}.`
}

/** 코디 문구 — 서브카테고리별로 문장을 나눠 조합 (데이터에 없는 스타일 수사는 쓰지 않음) */
function matchHalfBySub(sub, variant) {
  const v = variant % 2
  switch (sub) {
    case '슬랙스':
      return v === 0
        ? '블라우스나 니트·셔츠와 매치하기 좋고'
        : '셔츠·니트 상의와 컬러를 맞추기 좋고'
    case '데님':
      return v === 0 ? '티·맨투맨·셔츠와 매치하기 좋고' : '캐주얼 상의와 함께 입기 좋고'
    case '스커트':
      return v === 0 ? '블라우스·니트와 매치하기 좋고' : '가디건·니트 상의와 어울리기 좋고'
    case '반바지':
      return v === 0 ? '티·후드와 매치하기 좋고' : '가벼운 상의와 함께 입기 좋고'
    case '블라우스':
      return v === 0 ? '슬랙스·스커트·데님 하의와 매치하기 좋고' : '슬랙스·데님 하의와 함께 입기 좋고'
    case '로퍼':
    case '스니커즈':
    case '힐':
      return v === 0 ? '하의 기장에 맞춰 신발 포인트로 쓰기 좋고' : '하의와 밸런스를 맞추기 좋고'
    case '크로스백':
    case '숄더백':
    case '토트백':
      return v === 0 ? '외출 시 수납과 착장을 함께 챙기기 좋고' : '데일리 외출에 들기 좋고'
    default:
      return v === 0 ? '다른 피스와 색을 맞추기 좋고' : '코디에 맞춰 골라 쓰기 좋고'
  }
}

function useHalfBySub(sub, variant) {
  const v = variant % 2
  switch (sub) {
    case '슬랙스':
      return v === 0 ? '데일리룩과 출근룩 모두 활용하기 좋아요.' : '오피스와 데일리 코디에 모두 쓰기 좋아요.'
    case '데님':
      return v === 0 ? '캐주얼 하의 코디로 활용하기 좋아요.' : '편한 일상 룩에 맞추기 좋아요.'
    case '스커트':
      return v === 0 ? '하의 코디의 중심으로 활용하기 좋아요.' : '다양한 상의와 세트하기 좋아요.'
    case '반바지':
      return v === 0 ? '가벼운 외출 룩에 맞추기 좋아요.' : '활동적인 코디에 쓰기 좋아요.'
    case '블라우스':
      return v === 0 ? '상의 포인트로 활용하기 좋아요.' : '하의와 레이어링하기 좋아요.'
    case '로퍼':
    case '스니커즈':
    case '힐':
      return v === 0 ? '발 마무리로 활용하기 좋아요.' : '코디 완성용으로 쓰기 좋아요.'
    case '크로스백':
    case '숄더백':
    case '토트백':
      return v === 0 ? '실사용 가방으로 쓰기 좋아요.' : '수납과 스타일을 함께 챙기기 좋아요.'
    default:
      return v === 0 ? '데일리 코디에 활용하기 좋아요.' : '착용 상황에 맞춰 쓰기 좋아요.'
  }
}

function utilizationBySubCategory(sub) {
  switch (sub) {
    case '슬랙스':
      return '셔츠·니트·블라우스 등 상의와 매치해 오피스·데일리 모두 활용하기 좋아요.'
    case '데님':
      return '티·맨투맨·셔츠와 매치해 캐주얼한 하의 코디로 쓰기 좋아요.'
    case '스커트':
      return '블라우스·니트·가디건과 함께 입기 좋은 하의 아이템이에요.'
    case '반바지':
      return '티·후드·슬리브리스와 매치해 가볍게 입기 좋아요.'
    case '블라우스':
      return '슬랙스·스커트·데님 하의와 매치해 상의 포인트로 쓰기 좋아요.'
    case '로퍼':
    case '스니커즈':
    case '힐':
      return '하의 길이와 밸런스를 맞춰 신발 포인트로 활용하기 좋아요.'
    case '크로스백':
    case '숄더백':
    case '토트백':
      return '외출 시 수납과 스타일을 함께 챙기기 좋은 가방이에요.'
    default:
      return `${sub} 카테고리로 코디에 맞춰 골라 쓰기 좋아요.`
  }
}

function styleUtilizationIfMatched(product, f) {
  if (!f.styleKeyword) return ''
  const sub = String(product.subCategory || '')
  const officeSubs = ['슬랙스', '블라우스', '셔츠', '로퍼', '자켓', '코트', '크로스백']
  const casualSubs = ['데님', '반바지', '스니커즈', '맨투맨', '후드', '반팔티']
  if (f.styleKeyword === 'office' && officeSubs.includes(sub)) {
    return '출근·오피스룩에 자주 쓰는 조합으로 활용하기 좋아요.'
  }
  if (f.styleKeyword === 'casual' && casualSubs.includes(sub)) {
    return '편한 캐주얼 코디에 맞춰 입기 좋아요.'
  }
  if (f.styleKeyword === 'date' && ['스커트', '힐', '원피스', '미니 원피스', '롱 원피스', '숄더백'].includes(sub)) {
    return '외출·모임 코디에 맞춰 활용하기 좋아요.'
  }
  return ''
}

/**
 * 상품별 추천 이유 (2문장). 사용자 조건(parsed) + 상품 필드만 사용. description은 요약 문장만 반영.
 * @param {object} product
 * @param {ReturnType<import('./keywordParser.js').parseRagKeywords>} f — parseRagKeywords 결과
 * @param {string} _message
 * @param {number} index — 목록 내 상품마다 다른 데이터 조합을 쓰기 위한 인덱스
 */
export function generateReason(product, f, _message, index = 0) {
  const sub = String(product.subCategory || '')
  const rating = Number(product.rating) || 0
  const rc = Number(product.reviewCount) || 0
  const name = String(product.name || '')
  const matchedColor = primaryMatchedColorName(product, f)
  const details = detailWordsFromName(name)
  const descBit = concreteDescriptionClause(product)
  const styleExtra = styleUtilizationIfMatched(product, f)
  const i = index

  let s1 = ''
  if (matchedColor && subCategoryMatchesQuery(product, f)) {
    s1 = `${matchedColor} 컬러 ${sub}로 요청하신 조건에 맞아요`
  } else if (f.categories?.includes('bag') && product.category === 'bag') {
    s1 = '가방으로 요청하신 조건에 맞는 상품이에요'
  } else if (subCategoryMatchesQuery(product, f)) {
    s1 = `${sub}로 요청하신 조건에 맞아요`
  } else if (categoryMatchesQuery(product, f) && f.categories?.includes('bottom') && !f.strictSubCategory) {
    s1 = '하의 카테고리 조건에 맞는 상품이에요'
  } else if (matchedColor && productMatchesColorFilter(product, f.colors)) {
    s1 = `${matchedColor} 컬러 조건에 맞는 상품이에요`
  } else {
    s1 = '지금 검색 조건에 맞게 골라 담은 상품이에요'
  }

  const mh = matchHalfBySub(sub, i)
  const uh = useHalfBySub(sub, i + 1)
  const tailFromStyle = () => {
    if (!styleExtra) return `${mh}, ${uh}`.replace(/\s+/g, ' ').trim()
    const se = String(styleExtra).trim().replace(/\.$/, '')
    return `${mh}, ${se}`.replace(/\s+/g, ' ').trim()
  }

  const s2ColorTone = () => {
    if (!matchedColor) return ''
    return `${matchedColor} 톤이라 ${tailFromStyle()}`
  }

  const s2Details = () => {
    if (!details.length) return ''
    const bits = details.join('·')
    return `상품명에 ${bits}이 들어가 있어, ${tailFromStyle()}`
  }

  const s2Rating = () => {
    if (rating < 4.2 || rc < 5) return ''
    return `평점 ${rating.toFixed(1)}점·리뷰 ${rc}건이라 만족도를 참고하기 좋고, ${tailFromStyle()}`
  }

  const s2Best = () => {
    if (!product.isBest) return ''
    return `에디터 베스트에 선정된 상품이라 반응이 검증된 편이고, ${tailFromStyle()}`
  }

  const s2Price = () => {
    if (priceSatisfiesMax(product, f)) {
      const op = f.maxPriceOp === '미만' ? '미만' : '이하'
      return `${Math.round(f.maxPrice / 10000)}만원 ${op} 가격 조건을 만족하고, ${tailFromStyle()}`
    }
    if (priceSatisfiesMin(product, f)) {
      const op = f.minPriceOp === '초과' ? '초과' : '이상'
      return `${Math.round(f.minPrice / 10000)}만원 ${op} 가격 조건을 만족하고, ${tailFromStyle()}`
    }
    return ''
  }

  const s2Desc = () => {
    if (!descBit) return ''
    return `${descBit} ${tailFromStyle()}`.replace(/\s+/g, ' ').trim()
  }

  const s2Popular = () => {
    if (!f.popular) return ''
    return `인기·베스트 검색 조건을 반영했고, ${tailFromStyle()}`
  }

  const candidates = [s2ColorTone, s2Details, s2Rating, s2Best, s2Price, s2Desc, s2Popular]
    .map((fn) => fn())
    .filter(Boolean)

  let s2 = ''
  if (candidates.length) {
    s2 = candidates[i % candidates.length]
  } else {
    s2 = styleExtra || utilizationBySubCategory(sub)
  }

  const conciseS2 = String(s2 || '')
    .replace(/,\s*[^,.!?]*좋고,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()

  // 카드에서는 2문장으로 짧고 명확하게 표시
  const out = `${withSentenceEnd(s1)} ${withSentenceEnd(conciseS2)}`
  return sanitizeOutput(out)
}

/** @deprecated 이름 호환 — `generateReason` 사용 권장 */
export const generateProductReason = generateReason

/**
 * @param {object[]} products
 * @param {ReturnType<import('./keywordParser.js').parseRagKeywords>} f
 * @param {string} message
 */
export function assignRecommendReasons(products, f, message) {
  if (!products?.length) return []
  return products.map((p, i) => {
    const reason = generateReason(p, f, message, i).trim()
    return {
      ...p,
      reason: reason || '요청하신 검색 조건을 반영해 골라 담은 상품이에요.',
    }
  })
}

/**
 * 채팅 상단 전체 설명 (검색 조건 요약 1문장 + 선택적 예산 1문장)
 * @param {object[]} _products — 추천 건수 문구는 쓰지 않고 조건 요약만 사용
 * @param {ReturnType<import('./keywordParser.js').parseRagKeywords>} f
 */
export function generateOverallReplyIntro(_products, f) {
  const cw = f.colorLabel || f.color
  const sub = f.strictSubCategory
  let core = ''
  if (sub && cw) {
    core = `${cw} 컬러의 ${sub}를 찾고 계셔서 조건에 맞는 상품을 추천드릴게요`
  } else if (sub) {
    core = `${sub}를 찾고 계셔서 조건에 맞는 상품을 추천드릴게요`
  } else if (f.categories?.includes('bag')) {
    core = '가방을 찾고 계셔서 조건에 맞는 상품을 추천드릴게요'
  } else if (cw) {
    core = `${cw} 컬러를 찾고 계셔서 조건에 맞는 상품을 추천드릴게요`
  } else if (f.categories?.includes('bottom') && !f.strictSubCategory) {
    core = '하의를 찾고 계셔서 조건에 맞는 상품을 추천드릴게요'
  } else {
    core = '조건에 맞는 상품을 추천드릴게요'
  }

  let extra = ''
  if (f.maxPrice != null && !Number.isNaN(f.maxPrice)) {
    const op = f.maxPriceOp === '미만' ? '미만' : '이하'
    extra = `${Math.round(f.maxPrice / 10000)}만원 ${op} 예산도 함께 반영했어요.`
  } else if (f.minPrice != null && !Number.isNaN(f.minPrice)) {
    const op = f.minPriceOp === '초과' ? '초과' : '이상'
    extra = `${Math.round(f.minPrice / 10000)}만원 ${op} 가격 조건을 반영했어요.`
  }

  const mid = extra.trim()
  const text = mid ? `${core}. ${mid}` : core
  return sanitizeOutput(`${text} 😊`.trim())
}
