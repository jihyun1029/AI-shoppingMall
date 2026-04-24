/**
 * `products.colors` JSON 배열과 검색용 색상 토큰 매칭 (대소문자 무시, 정확히 배열 원소 일치)
 * @param {unknown} colorsJson
 * @param {string[]} tokens DB에 등장할 수 있는 색상명 목록 (동의어 OR)
 */
export function parseProductColorNames(colorsJson) {
  try {
    const arr = JSON.parse(String(colorsJson || '[]'))
    if (!Array.isArray(arr)) return []
    return arr.map((x) => String(x).trim()).filter(Boolean)
  } catch {
    return []
  }
}

/**
 * @param {unknown} colorsJson
 * @param {string[] | null | undefined} tokens
 */
export function productMatchesColorTokens(colorsJson, tokens) {
  if (!tokens?.length) return true
  const names = parseProductColorNames(colorsJson).map((s) => s.toLowerCase())
  return tokens.some((t) => names.includes(String(t).toLowerCase()))
}
