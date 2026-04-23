/** @typedef {{ id: string, name: string, brand: string, price: number, image: string }} RecentProductEntry */

export const RECENT_PRODUCTS_KEY = 'recentProducts'
const MAX = 10

/** @type {readonly RecentProductEntry[]} */
const EMPTY_SNAPSHOT = Object.freeze([])

const listeners = new Set()

/** 캐시: useSyncExternalStore는 getSnapshot이 데이터가 같을 때 동일 참조를 반환해야 함 */
let snapshotSig = ''
/** @type {readonly RecentProductEntry[] | RecentProductEntry[]} */
let snapshot = EMPTY_SNAPSHOT

function emit() {
  listeners.forEach((fn) => fn())
}

/** @param {() => void} fn */
export function subscribeRecentProducts(fn) {
  listeners.add(fn)
  const onStorage = (e) => {
    if (e.key === RECENT_PRODUCTS_KEY || e.key === null) fn()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(fn)
    window.removeEventListener('storage', onStorage)
  }
}

/** @param {unknown} p */
function toEntry(p) {
  if (!p || typeof p !== 'object') return null
  const id = String(/** @type {{ id?: unknown }} */ (p).id ?? '')
  if (!id) return null
  const name = String(/** @type {{ name?: unknown }} */ (p).name ?? '')
  const brand = String(/** @type {{ brand?: unknown }} */ (p).brand ?? '')
  const price = Number(/** @type {{ price?: unknown }} */ (p).price)
  const image = String(
    /** @type {{ image?: unknown, images?: unknown[] }} */ (p).image ||
      (Array.isArray((p).images) ? (p).images[0] : '') ||
      '',
  )
  return { id, name, brand, price: Number.isFinite(price) ? price : 0, image }
}

/** @returns {RecentProductEntry[]} */
function parseStoredList() {
  try {
    const raw = localStorage.getItem(RECENT_PRODUCTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(toEntry).filter(Boolean).slice(0, MAX)
  } catch {
    return []
  }
}

/** @returns {readonly RecentProductEntry[]} */
export function getRecentProductsSnapshot() {
  const list = parseStoredList()
  const sig = JSON.stringify(list)
  if (sig === snapshotSig) return snapshot
  snapshotSig = sig
  snapshot = list.length === 0 ? EMPTY_SNAPSHOT : list
  return snapshot
}

/** SSR */
export function getRecentProductsServerSnapshot() {
  return EMPTY_SNAPSHOT
}

/** @param {RecentProductEntry[]} list */
function writeRecentProducts(list) {
  const next = list.slice(0, MAX)
  try {
    localStorage.setItem(RECENT_PRODUCTS_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  snapshotSig = JSON.stringify(next)
  snapshot = next.length === 0 ? EMPTY_SNAPSHOT : next
  emit()
}

/**
 * 상품 상세에서 호출: 동일 id 제거 후 맨 앞에 추가, 최대 10개
 * @param {object} product
 */
export function recordRecentProductView(product) {
  const entry = toEntry(product)
  if (!entry) return
  const cur = parseStoredList().filter((e) => e.id !== entry.id)
  writeRecentProducts([entry, ...cur])
}

export function clearRecentProducts() {
  writeRecentProducts([])
}

/** @param {string} id */
export function removeRecentProduct(id) {
  const sid = String(id)
  writeRecentProducts(parseStoredList().filter((e) => e.id !== sid))
}
