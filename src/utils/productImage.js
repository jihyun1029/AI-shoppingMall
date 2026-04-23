import { useCallback, useEffect, useState } from 'react'

/** @type {string} */
const PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect fill="#f4f4f5" width="400" height="500"/><text x="200" y="248" text-anchor="middle" fill="#a1a1aa" font-size="13" font-family="system-ui,sans-serif">image</text></svg>`,
  )

/**
 * 상품 이미지 URL 후보 (첫 번째가 404일 때 구형 파일명 `-a`/`-b` 등으로 시도)
 * @param {{ image?: string; images?: string[] }} product
 * @returns {string[]}
 */
export function productImageCandidates(product) {
  const primary = String(product?.image ?? product?.images?.[0] ?? '').trim()
  const out = []
  if (primary) out.push(primary)

  const m = primary.match(/\/images\/products\/product-(\d+)\.(svg|jpe?g|png)$/i)
  if (m) {
    const num = Number.parseInt(m[1], 10)
    if (Number.isFinite(num)) {
      const n = String(num).padStart(2, '0')
      for (const suffix of ['-a.jpg', '-b.jpg', '-a.svg', '-b.svg']) {
        const u = `/images/products/product-${n}${suffix}`
        if (!out.includes(u)) out.push(u)
      }
      // 구형 빌드에는 product-15.svg ~ product-50.svg 만 있는 경우가 많음 → 그 범위로 매핑
      if (num < 15 || num > 50) {
        const mapped = 15 + ((num - 1) % 36)
        const pad = String(mapped).padStart(2, '0')
        const u = `/images/products/product-${pad}.svg`
        if (!out.includes(u)) out.push(u)
      }
    }
  }

  out.push('/images/products/product-placeholder.svg')
  out.push(PLACEHOLDER)
  return out
}

/**
 * @param {string[]} candidateList productImageCandidates 결과
 */
export function useProductImageSrc(candidateList) {
  const listKey = candidateList.join('|')
  const [failCount, setFailCount] = useState(0)

  useEffect(() => {
    // URL 후보가 바뀌면(상품·썸네일 전환) 폴백 인덱스 초기화
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 목록 변경 시 동기 리셋
    setFailCount(0)
  }, [listKey])

  const src = candidateList[Math.min(failCount, candidateList.length - 1)] || ''
  const onError = useCallback(() => {
    setFailCount((f) => Math.min(f + 1, candidateList.length - 1))
  }, [candidateList.length])

  return { src, onError }
}
