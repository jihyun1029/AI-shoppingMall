/**
 * 장바구니 기반 룰베이스 추천 (포트폴리오용)
 * @typedef {{ product: object, reason: string, score: number }} CartRecommendation
 */

/** 서브카테고리 → 함께 보면 좋은 카테고리·서브 */
const SUB_RULES = {
  후드: { cats: ['bottom', 'shoes', 'bag'], subs: ['청바지', '슬랙스', '스니커즈', '백팩', '반바지'] },
  맨투맨: { cats: ['bottom', 'shoes', 'bag'], subs: ['청바지', '슬랙스', '스니커즈', '백팩'] },
  반팔티: { cats: ['bottom', 'shoes', 'bag'], subs: ['청바지', '반바지', '스니커즈', '크로스백'] },
  긴팔티: { cats: ['bottom', 'shoes', 'bag'], subs: ['청바지', '슬랙스', '스니커즈'] },
  셔츠: { cats: ['bottom', 'shoes', 'bag'], subs: ['슬랙스', '로퍼', '크로스백', '청바지'] },
  청바지: { cats: ['top', 'shoes', 'outer', 'bag'], subs: ['맨투맨', '후드', '스니커즈', '셔츠', '백팩'] },
  슬랙스: { cats: ['top', 'shoes', 'bag'], subs: ['셔츠', '맨투맨', '로퍼', '스니커즈'] },
  반바지: { cats: ['top', 'shoes', 'bag'], subs: ['반팔티', '스니커즈', '맨투맨'] },
  스니커즈: { cats: ['top', 'bottom', 'bag'], subs: ['후드', '청바지', '맨투맨', '백팩'] },
  로퍼: { cats: ['top', 'bottom', 'bag'], subs: ['슬랙스', '셔츠', '크로스백'] },
  백팩: { cats: ['top', 'shoes'], subs: ['반팔티', '셔츠', '스니커즈', '후드'] },
  크로스백: { cats: ['top', 'shoes'], subs: ['반팔티', '셔츠', '스니커즈', '로퍼'] },
  자켓: { cats: ['bottom', 'top', 'shoes'], subs: ['청바지', '슬랙스', '스니커즈'] },
  코트: { cats: ['bottom', 'shoes', 'bag'], subs: ['청바지', '슬랙스', '스니커즈', '로퍼'] },
  패딩: { cats: ['bottom', 'shoes'], subs: ['청바지', '슬랙스', '스니커즈'] },
  원피스: { cats: ['shoes', 'bag'], subs: ['스니커즈', '로퍼', '크로스백'] },
}

const CAT_FALLBACK = {
  top: ['bottom', 'shoes', 'bag', 'outer'],
  bottom: ['top', 'shoes', 'bag', 'outer'],
  shoes: ['top', 'bottom', 'bag'],
  bag: ['top', 'shoes', 'bottom'],
  outer: ['bottom', 'top', 'shoes'],
  dress: ['shoes', 'bag'],
}

const NEUTRAL = new Set(['블랙', '화이트', '그레이', '멜란지', '네이비', '베이지', '차콜', '크림', '아이보리'])

function cartColorNames(cartProducts) {
  const s = new Set()
  for (const p of cartProducts) {
    for (const c of p.colors || []) {
      if (c?.name) s.add(c.name)
    }
  }
  return s
}

function dominantGender(cartProducts) {
  const scores = { male: 0, female: 0, unisex: 0 }
  for (const p of cartProducts) {
    const g = p.gender
    if (g === 'male' || g === 'female' || g === 'unisex') scores[g] += 1
  }
  let best = 'unisex'
  let max = -1
  for (const [g, n] of Object.entries(scores)) {
    if (n > max) {
      max = n
      best = g
    }
  }
  return max > 0 ? best : null
}

function buildWants(cartProducts) {
  const wantCats = new Set()
  const wantSubs = new Set()
  for (const p of cartProducts) {
    const sub = p.subCategory
    const rule = sub ? SUB_RULES[sub] : null
    if (rule) {
      rule.cats?.forEach((c) => wantCats.add(c))
      rule.subs?.forEach((s) => wantSubs.add(s))
    }
    const fb = CAT_FALLBACK[p.category]
    if (fb) fb.forEach((c) => wantCats.add(c))
  }
  return { wantCats, wantSubs }
}

function colorOverlap(product, cartColors) {
  const names = (product.colors || []).map((c) => c.name).filter(Boolean)
  for (const n of names) {
    if (cartColors.has(n)) return true
    if (NEUTRAL.has(n) && [...cartColors].some((cn) => NEUTRAL.has(cn))) return true
  }
  return false
}

function reasonLine(cartProducts, product) {
  const anchor = cartProducts[0]
  if (!anchor) return '함께 코디하기 좋은 추천이에요.'
  const hit = cartProducts.find((cp) =>
    Boolean(SUB_RULES[cp.subCategory]?.subs?.includes(product.subCategory)),
  )
  if (hit?.subCategory) {
    return `장바구니의「${hit.subCategory}」와 코디하기 좋은 ${product.subCategory || '피스'}예요.`
  }
  return `「${anchor.subCategory || anchor.name}」와 함께 보면 좋은 ${product.subCategory || '상품'}이에요.`
}

/**
 * @param {{ product: object }[]} cartLines
 * @param {object[]} allProducts
 * @param {{ min?: number, max?: number }} [opts]
 * @returns {CartRecommendation[]}
 */
export function recommendProductsByCart(cartLines, allProducts, opts = {}) {
  const min = opts.min ?? 4
  const max = opts.max ?? 8
  const cartProducts = cartLines.map((l) => l.product).filter(Boolean)
  const cartIds = new Set(cartProducts.map((p) => String(p.id)))

  if (!cartProducts.length || !Array.isArray(allProducts) || !allProducts.length) return []

  const { wantCats, wantSubs } = buildWants(cartProducts)
  const genderPref = dominantGender(cartProducts)
  const cartColors = cartColorNames(cartProducts)

  const scored = []
  for (const p of allProducts) {
    if (cartIds.has(String(p.id))) continue
    let score = 0
    if (p.subCategory && wantSubs.has(p.subCategory)) score += 8
    else if (p.category && wantCats.has(p.category)) score += 4

    if (genderPref && (p.gender === genderPref || p.gender === 'unisex')) score += 2
    if (p.isBest) score += 3
    score += Math.min(3, (Number(p.reviewCount) || 0) / 2000)
    if (colorOverlap(p, cartColors)) score += 1.5

    if (score > 0) {
      scored.push({
        product: p,
        score,
        reason: reasonLine(cartProducts, p),
      })
    }
  }

  scored.sort((a, b) => b.score - a.score)

  let out = scored.slice(0, max)

  if (out.length < min) {
    const used = new Set([...cartIds, ...out.map((x) => String(x.product.id))])
    const filler = [...allProducts]
      .filter((p) => !used.has(String(p.id)))
      .sort(
        (a, b) =>
          (b.isBest === true) - (a.isBest === true) ||
          (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0) ||
          (Number(b.popularity) || 0) - (Number(a.popularity) || 0),
      )
      .slice(0, min - out.length)
      .map((p) => ({
        product: p,
        score: 0.5,
        reason: '지금 많이 찾는 인기 피스로 채워 보았어요.',
      }))
    out = [...out, ...filler].slice(0, max)
  }

  return out.map(({ product, reason, score }) => ({ product, reason, score }))
}
