import { parseChatQuery } from '../../../src/utils/chatbotParser.js'
import { COLOR_MATCH_GROUPS } from '../../../src/utils/styleKeywords.js'

/** DB `subCategory`와 직접 매칭되는 추가 키워드 (여성 시드 기준) */
const EXTRA_SUBCATEGORY_KEYWORDS = [
  '블라우스',
  '니트',
  '가디건',
  '트렌치코트',
  '데님',
  '스커트',
  '플랫슈즈',
  '힐',
  '토트백',
  '숄더백',
  '귀걸이',
  '목걸이',
  '스카프',
  '미니 원피스',
  '롱 원피스',
]

const STYLE_PATTERNS = [
  { key: 'office', re: /출근|오피스|비즈니스|포멀|미팅|출근룩/ },
  { key: 'daily', re: /데일리|일상|무난|데일리룩/ },
  { key: 'date', re: /데이트|데이트룩|러블리/ },
  { key: 'casual', re: /캐주얼|편한|힙|스트릿/ },
  { key: 'feminine', re: /페미닌|여성스럽|우아|로맨틱/ },
]

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** 사용자 문장에서 매칭된 색상 트리거(가장 긴 단어) — 안내 문구용 */
function pickColorLabelFromMessage(message) {
  const n = norm(message)
  let best = null
  let bestLen = 0
  for (const g of COLOR_MATCH_GROUPS) {
    for (const w of g.words) {
      const lw = w.toLowerCase()
      if (n.includes(lw) && w.length >= bestLen) {
        bestLen = w.length
        best = w
      }
    }
  }
  return best
}

/**
 * 동의어 그룹 기준 대표 키 (예: 보라색 요청 → "보라")
 * @param {string[]} colorNames
 */
function canonicalColorKey(colorNames) {
  if (!colorNames?.length) return null
  const set = new Set(colorNames)
  const hasAny = (arr) => arr.some((x) => set.has(x))
  if (hasAny(['퍼플', '라벤더', '보라', '바이올렛', '머브'])) return '보라'
  if (hasAny(['블랙', '차콜'])) return '블랙'
  if (hasAny(['베이지'])) return '베이지'
  if (hasAny(['아이보리'])) return '아이보리'
  if (hasAny(['화이트', '크림'])) return '화이트'
  if (hasAny(['네이비'])) return '네이비'
  if (hasAny(['카키', '올리브'])) return '카키'
  if (hasAny(['그레이', '멜란지'])) return '그레이'
  if (hasAny(['브라운', '버건디', '와인'])) return '브라운'
  if (hasAny(['블루', '라이트블루', '인디고', '연청', '미디엄블루'])) return '블루'
  if (hasAny(['핑크', '로즈'])) return '핑크'
  return colorNames[0]
}

const BAG_ALIASES = ['가방', '백', 'bag', '토트백', '숄더백', '크로스백']

/** DB `subCategory`와 정확히 일치해야 하는 하의 키워드 (넓은 name LIKE 검색 제외) */
const STRICT_BOTTOM_SUB_PATTERNS = [
  { sub: '슬랙스', words: ['슬랙스'] },
  { sub: '스커트', words: ['스커트'] },
  { sub: '데님', words: ['데님', '청바지'] },
  { sub: '반바지', words: ['반바지'] },
]

/**
 * 메시지에 특정 하의 서브카테고리가 명시된 경우에만 반환. "하의"만 있으면 null.
 * @param {string} n norm(message)
 * @returns {string | null}
 */
export function resolveStrictBottomSubCategory(n) {
  let best = null
  let bestLen = 0
  for (const { sub, words } of STRICT_BOTTOM_SUB_PATTERNS) {
    for (const w of words) {
      const lw = w.toLowerCase()
      if (n.includes(lw) && lw.length >= bestLen) {
        bestLen = lw.length
        best = sub
      }
    }
  }
  return best
}

const MIN_PRICE_WORDS = ['이상', '초과', '넘는', '부터']
const MAX_PRICE_WORDS = ['이하', '미만', '안으로', '안에서', '까지']

function parseMoneyToWon(token) {
  const t = String(token || '').replace(/,/g, '').trim()
  const mMan = t.match(/(\d+(?:\.\d+)?)\s*만\s*원?/)
  if (mMan) return Math.round(Number(mMan[1]) * 10000)
  const mWon = t.match(/(\d{1,9})\s*원?/)
  if (mWon) return Number(mWon[1])
  return null
}

function parsePriceRangeFromText(text) {
  const n = norm(text)
  /** @type {{ minPrice: number | null, maxPrice: number | null, minOp: '이상'|'초과'|null, maxOp: '이하'|'미만'|null }} */
  const out = { minPrice: null, maxPrice: null, minOp: null, maxOp: null }

  const minRe = /(\d+(?:\.\d+)?\s*만\s*원?|\d{1,9}\s*원?)\s*(이상|초과|넘는|부터)/
  const maxRe = /(\d+(?:\.\d+)?\s*만\s*원?|\d{1,9}\s*원?)\s*(이하|미만|안으로|안에서|까지)/

  const minM = n.match(minRe)
  const maxM = n.match(maxRe)
  if (minM) {
    out.minPrice = parseMoneyToWon(minM[1])
    out.minOp = minM[2] === '초과' ? '초과' : '이상'
  }
  if (maxM) {
    out.maxPrice = parseMoneyToWon(maxM[1])
    out.maxOp = maxM[2] === '미만' ? '미만' : '이하'
  }

  // 단독 금액 + 범위 단어가 떨어져 있는 케이스 보강
  if (out.minPrice == null && out.maxPrice == null) {
    const anyMoney = n.match(/(\d+(?:\.\d+)?\s*만\s*원?|\d{1,9}\s*원?)/)
    if (anyMoney) {
      const price = parseMoneyToWon(anyMoney[1])
      if (price != null) {
        if (MIN_PRICE_WORDS.some((w) => n.includes(w))) {
          out.minPrice = price
          out.minOp = n.includes('초과') ? '초과' : '이상'
        }
        if (MAX_PRICE_WORDS.some((w) => n.includes(w))) {
          out.maxPrice = price
          out.maxOp = n.includes('미만') ? '미만' : '이하'
        }
      }
    }
  }

  return out
}

/**
 * @param {string} message
 * @returns {{
 *   categories: string[];
 *   subCategories: string[];
 *   colors: string[];
 *   color: string | null;
 *   colorLabel: string | null;
 *   minPrice: number | null;
 *   minPriceOp: '이상'|'초과'|null;
 *   maxPrice: number | null;
 *   maxPriceOp: '이하'|'미만'|null;
 *   situation: 'office'|'daily'|'casual'|null;
 *   styleKeyword: 'office'|'daily'|'date'|'casual'|'feminine'|null;
 *   popular: boolean;
 *   cartAssist: boolean;
 *   rawTokens: string[];
 *   strictSubCategory: string | null;
 * }}
 */
export function parseRagKeywords(message) {
  const q = parseChatQuery(message)
  const n = norm(message)
  const { minPrice, maxPrice, minOp, maxOp } = parsePriceRangeFromText(message)

  const subCategories = [...q.subCategories]
  for (const sub of EXTRA_SUBCATEGORY_KEYWORDS) {
    if (n.includes(sub.toLowerCase()) && !subCategories.includes(sub)) {
      subCategories.push(sub)
    }
  }

  let styleKeyword = null
  for (const { key, re } of STYLE_PATTERNS) {
    if (re.test(n)) {
      styleKeyword = key
      break
    }
  }
  if (!styleKeyword && q.situation) {
    styleKeyword = q.situation === 'office' ? 'office' : q.situation === 'daily' ? 'daily' : 'casual'
  }

  const categories = [...q.categories]
  if (BAG_ALIASES.some((w) => n.includes(w))) {
    // "가방/백/토트백/숄더백/크로스백"이 들어오면 bag 카테고리 고정
    categories.length = 0
    categories.push('bag')
  }

  /** 하의 서브를 문장에 명시한 경우 DB subCategory 정확 일치 필수 */
  let strictSubCategory = null
  const strictBottom = resolveStrictBottomSubCategory(n)
  if (strictBottom && !categories.includes('bag')) {
    if (!categories.includes('bottom')) categories.push('bottom')
    subCategories.length = 0
    subCategories.push(strictBottom)
    strictSubCategory = strictBottom
  }

  const colors = [...new Set(q.colorNames)]
  const colorLabel = colors.length ? pickColorLabelFromMessage(message) : null
  const color = colors.length ? canonicalColorKey(colors) : null

  return {
    categories,
    subCategories,
    colors,
    color,
    colorLabel,
    minPrice,
    minPriceOp: minOp,
    maxPrice,
    maxPriceOp: maxOp,
    situation: q.situation,
    styleKeyword,
    popular: q.popular,
    cartAssist: q.cartAssist,
    rawTokens: q.rawTokens,
    strictSubCategory,
  }
}

const CATEGORY_LABEL = {
  top: '상의',
  outer: '아우터',
  bottom: '하의',
  dress: '원피스',
  shoes: '신발',
  bag: '가방',
  accessory: '액세서리',
}

/**
 * Agent 응답용 구조화 키워드 (Intent 분류 후 설명·로그용).
 * @param {string} message
 */
export function buildAgentKeywords(message) {
  const f = parseRagKeywords(message)
  const mainCat = f.categories?.[0]
  const mainSub = f.subCategories?.[0]
  const category =
    mainSub || (mainCat ? CATEGORY_LABEL[mainCat] || mainCat : null) || null

  return {
    categories: f.categories,
    subCategories: f.subCategories,
    category,
    strictSubCategory: f.strictSubCategory,
    price: {
      min: f.minPrice,
      max: f.maxPrice,
      minOp: f.minPriceOp,
      maxOp: f.maxPriceOp,
    },
    color: f.color,
    colorTokens: f.colors,
    colorLabel: f.colorLabel,
    styleKeyword: f.styleKeyword,
    popular: f.popular,
  }
}

/** 스타일 키워드 → 우선 정렬에 쓸 서브카테고리 힌트 */
/** Hybrid 2단계: 스타일 → 검색 blob에 매칭시킬 확장 키워드 */
export function semanticExpansionTerms(styleKeyword) {
  switch (styleKeyword) {
    case 'office':
      return ['블라우스', '슬랙스', '셔츠', '자켓', '코트', '로퍼', '크로스백', '출근']
    case 'daily':
      return ['반팔티', '니트', '가디건', '데님', '청바지', '스니커즈', '크로스백', '데일리']
    case 'date':
      return ['원피스', '스커트', '블라우스', '힐', '숄더백', '가디건', '데이트']
    case 'feminine':
      return ['블라우스', '스커트', '원피스', '니트', '힐', '목걸이', '페미닌']
    case 'casual':
      return ['후드', '맨투맨', '데님', '반바지', '스니커즈', '캐주얼']
    default:
      return []
  }
}

export function preferredSubCategoriesForStyle(styleKeyword) {
  switch (styleKeyword) {
    case 'office':
      return ['블라우스', '셔츠', '슬랙스', '자켓', '로퍼', '크로스백', '코트']
    case 'daily':
      return ['니트', '가디건', '데님', '스니커즈', '반팔티', '크로스백']
    case 'date':
      return ['롱 원피스', '미니 원피스', '블라우스', '스커트', '힐', '숄더백']
    case 'feminine':
      return ['블라우스', '스커트', '롱 원피스', '힐', '목걸이', '니트']
    case 'casual':
      return ['후드', '맨투맨', '데님', '스니커즈', '반바지', '크로스백']
    default:
      return []
  }
}
