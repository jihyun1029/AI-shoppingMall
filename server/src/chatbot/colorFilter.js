/**
 * `products.colors` 배열(또는 JSON 문자열)과 검색용 색상 토큰 매칭
 * @param {unknown} colorsVal  MongoDB 배열 또는 JSON 문자열
 * @param {string[]} tokens DB에 등장할 수 있는 색상명 목록 (동의어 OR)
 */
export function parseProductColorNames(colorsVal) {
  if (Array.isArray(colorsVal)) return colorsVal.map(String).filter(Boolean)
  try {
    const arr = JSON.parse(String(colorsVal || '[]'))
    if (!Array.isArray(arr)) return []
    return arr.map((x) => String(x).trim()).filter(Boolean)
  } catch {
    return []
  }
}

/**
 * @param {unknown} colorsVal
 * @param {string[] | null | undefined} tokens
 */
export function productMatchesColorTokens(colorsVal, tokens) {
  if (!tokens?.length) return true
  const names = parseProductColorNames(colorsVal).map((s) => s.toLowerCase())
  return tokens.some((t) => names.includes(String(t).toLowerCase()))
}
