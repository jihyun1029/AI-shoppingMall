import { SEASON_SUBS, SITUATION_SUBS } from './styleKeywords.js'

const LIMIT = 4

function productColorNames(p) {
  return (p.colors || []).map((c) => c.name)
}

function matchesColor(p, colorNames) {
  if (!colorNames.length) return true
  const names = productColorNames(p)
  return colorNames.some((cn) => names.some((pn) => pn.includes(cn) || cn.includes(pn)))
}

function matchesGender(p, genders) {
  if (!genders.length) return true
  if (p.gender === 'unisex') return true
  return genders.includes(p.gender)
}

function scoreProduct(p, q, boostSubs) {
  let s = 0
  if (q.popular) {
    s += (p.reviewCount || 0) / 500
    if (p.isBest) s += 4
    s += (p.rating || 0) * 0.5
  }
  if (boostSubs?.length && boostSubs.includes(p.subCategory)) s += 3
  if (q.subCategories.length && q.subCategories.includes(p.subCategory)) s += 5
  if (q.categories.length && q.categories.includes(p.category)) s += 2
  s += Math.min(3, (p.popularity || 0) / 40)
  return s
}

function complementaryCategories(cartCats) {
  const set = new Set(cartCats)
  const out = new Set()
  if (set.has('bottom')) {
    ;['top', 'outer', 'shoes', 'bag'].forEach((c) => out.add(c))
  }
  if (set.has('top')) {
    ;['bottom', 'outer', 'shoes', 'bag'].forEach((c) => out.add(c))
  }
  if (set.has('outer')) {
    ;['bottom', 'top', 'shoes'].forEach((c) => out.add(c))
  }
  if (set.has('shoes')) {
    ;['bottom', 'top'].forEach((c) => out.add(c))
  }
  if (set.has('bag')) {
    ;['top', 'bottom', 'outer'].forEach((c) => out.add(c))
  }
  if (set.has('dress')) {
    ;['shoes', 'bag'].forEach((c) => out.add(c))
  }
  if (out.size === 0) {
    ;['top', 'bottom', 'shoes'].forEach((c) => out.add(c))
  }
  return [...out]
}

/**
 * @param {object[]} products
 * @param {import('./chatbotParser.js').ParsedChatQuery} q
 * @param {{ cartProducts?: object[] }} [opts]
 */
export function recommendProducts(products, q, opts = {}) {
  const list = Array.isArray(products) ? products : []
  const cartProducts = opts.cartProducts || []

  let boostSubs = []
  if (q.season && SEASON_SUBS[q.season]) boostSubs = [...SEASON_SUBS[q.season]]
  if (q.situation && SITUATION_SUBS[q.situation]) {
    boostSubs = [...new Set([...boostSubs, ...SITUATION_SUBS[q.situation]])]
  }

  /** 장바구니 기반 */
  if (q.cartAssist && cartProducts.length === 0) {
    const loose = [...list].sort((a, b) => scoreProduct(b, q, boostSubs) - scoreProduct(a, q, boostSubs))
    const picks = loose.slice(0, LIMIT)
    return {
      reply:
        '장바구니가 비어 있어서 코디 연결은 어려워요. 대신 지금 인기 있는 피스를 골라봤어요. 마음에 드는 상품을 담은 뒤 다시 물어봐 주세요.',
      picks,
    }
  }

  if (q.cartAssist && cartProducts.length) {
    const cartIds = new Set(cartProducts.map((p) => String(p.id)))
    const cartCats = [...new Set(cartProducts.map((p) => p.category).filter(Boolean))]
    const wantCats = complementaryCategories(cartCats)

    let pool = list.filter((p) => !cartIds.has(String(p.id)))
    pool = pool.filter((p) => wantCats.includes(p.category))
    pool = pool.filter((p) => (q.maxPrice == null ? true : p.price <= q.maxPrice))
    pool = pool.filter((p) => matchesColor(p, q.colorNames))
    pool = pool.filter((p) => matchesGender(p, q.genders))

    if (pool.length === 0) {
      pool = list.filter((p) => !cartIds.has(String(p.id))).slice(0, 20)
    }

    pool.sort((a, b) => scoreProduct(b, q, boostSubs) - scoreProduct(a, q, boostSubs))
    const picks = pool.slice(0, LIMIT)
    const reply =
      picks.length > 0
        ? '장바구니에 담긴 실루엣과 어울리도록, 함께 코디하기 좋은 피스를 골라봤어요. 톤을 맞추거나 대비를 주면 더 세련돼 보여요.'
        : '조건에 맞는 연관 상품을 찾지 못했어요. 쇼핑 탭에서 카테고리를 넓혀 보시겠어요?'
    return { reply, picks }
  }

  /** 일반 검색·추천 */
  let pool = [...list]

  if (q.maxPrice != null) pool = pool.filter((p) => p.price <= q.maxPrice)
  pool = pool.filter((p) => matchesGender(p, q.genders))
  pool = pool.filter((p) => matchesColor(p, q.colorNames))

  if (q.categories.length) {
    pool = pool.filter((p) => q.categories.includes(p.category))
  }

  if (q.subCategories.length) {
    pool = pool.filter((p) => q.subCategories.includes(p.subCategory))
  }

  if (q.popular) {
    pool.sort(
      (a, b) =>
        (b.isBest === true) - (a.isBest === true) ||
        (b.reviewCount || 0) - (a.reviewCount || 0) ||
        (b.rating || 0) - (a.rating || 0),
    )
  } else {
    pool.sort((a, b) => scoreProduct(b, q, boostSubs) - scoreProduct(a, q, boostSubs))
  }

  let picks = pool.slice(0, LIMIT)

  if (picks.length === 0 && (q.categories.length || q.subCategories.length || q.colorNames.length)) {
    let loose = [...list]
    if (q.maxPrice != null) loose = loose.filter((p) => p.price <= q.maxPrice)
    loose = loose.filter((p) => matchesGender(p, q.genders))
    loose.sort((a, b) => scoreProduct(b, q, boostSubs) - scoreProduct(a, q, boostSubs))
    picks = loose.slice(0, LIMIT)
  }

  if (picks.length === 0) {
    const reply =
      '조건에 딱 맞는 상품이 없어요. 가격대를 조금 올리거나 색·카테고리를 줄여서 다시 물어봐 주세요.'
    return { reply, picks: [] }
  }

  const bits = []
  if (q.situation) bits.push('말씀해 주신 분위기')
  if (q.season) bits.push('계절감')
  if (q.maxPrice != null) bits.push(`예산 ${q.maxPrice.toLocaleString('ko-KR')}원 이하`)
  if (q.colorNames.length) bits.push('컬러')
  if (q.popular) bits.push('인기·리뷰')
  const hint = bits.length ? `${bits.join(', ')}을 반영해 ` : ''

  const reply = `${hint}지금 카탈로그에서 잘 어울릴 만한 피스를 골라봤어요. 마음에 드는 상품은 카드에서 바로 담거나 상세에서 옵션을 골라보세요.`

  return { reply, picks }
}
