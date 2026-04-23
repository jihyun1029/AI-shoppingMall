function parseList(param) {
  if (!param) return []
  return param.split(',').map((s) => s.trim()).filter(Boolean)
}

/**
 * @param {URLSearchParams} sp
 */
export function parseShopParams(sp) {
  return {
    q: (sp.get('q') || '').trim().toLowerCase(),
    category: sp.get('category') || 'all',
    brands: parseList(sp.get('brand')),
    colors: parseList(sp.get('color')),
    sizes: parseList(sp.get('size')),
    priceMin: sp.get('min') ? Number(sp.get('min')) : null,
    priceMax: sp.get('max') ? Number(sp.get('max')) : null,
    sort: sp.get('sort') || 'popular',
  }
}

/**
 * @param {any} p
 * @param {{ q: string; category: string; brands: string[]; colors: string[]; sizes: string[]; priceMin: number | null; priceMax: number | null }} f
 */
function productMatches(p, f) {
  if (f.category && f.category !== 'all' && p.category !== f.category) return false
  if (f.brands.length && !f.brands.includes(p.brandId)) return false
  if (f.colors.length) {
    const ids = p.colors.map((c) => c.id)
    if (!f.colors.some((c) => ids.includes(c))) return false
  }
  if (f.sizes.length) {
    if (!f.sizes.some((s) => p.sizes.includes(s))) return false
  }
  if (f.priceMin != null && !Number.isNaN(f.priceMin) && p.price < f.priceMin) return false
  if (f.priceMax != null && !Number.isNaN(f.priceMax) && p.price > f.priceMax) return false
  if (f.q) {
    const blob = `${p.brand} ${p.name} ${p.description}`.toLowerCase()
    if (!blob.includes(f.q)) return false
  }
  return true
}

/**
 * @param {string} sort
 */
function sortList(list, sort) {
  const next = [...list]
  switch (sort) {
    case 'newest':
      return next.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    case 'price_asc':
      return next.sort((a, b) => a.price - b.price)
    case 'price_desc':
      return next.sort((a, b) => b.price - a.price)
    case 'popular':
    default:
      return next.sort((a, b) => b.popularity - a.popularity)
  }
}

/**
 * @param {URLSearchParams} sp
 */
export function getFilteredProducts(products, sp) {
  const f = parseShopParams(sp)
  const filtered = products.filter((p) => productMatches(p, f))
  return sortList(filtered, f.sort)
}
