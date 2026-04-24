import {
  CATEGORY_TRIGGER,
  COLOR_MATCH_GROUPS,
  GENDER_TRIGGER,
  SEASON_WORDS,
  SITUATION_WORDS,
  SUBCATEGORY_TRIGGER,
} from './styleKeywords.js'

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * @typedef {object} ParsedChatQuery
 * @property {string[]} categories
 * @property {string[]} subCategories
 * @property {string[]} colorNames
 * @property {string[]} genders
 * @property {number | null} maxPrice
 * @property {boolean} popular
 * @property {'spring'|'summer'|'autumn'|'winter'|null} season
 * @property {'office'|'daily'|'casual'|null} situation
 * @property {boolean} cartAssist
 * @property {string[]} rawTokens
 */

/** @param {string} text @returns {ParsedChatQuery} */
export function parseChatQuery(text) {
  const n = norm(text)
  const rawTokens = n.split(/[\s,.!?]+/).filter(Boolean)

  /** @type {ParsedChatQuery} */
  const q = {
    categories: [],
    subCategories: [],
    colorNames: [],
    genders: [],
    maxPrice: null,
    popular: false,
    season: null,
    situation: null,
    cartAssist: false,
    rawTokens: rawTokens,
  }

  if (/장바구니|담은|카트|cart/.test(n)) q.cartAssist = true

  if (/인기|베스트|best|리뷰\s*많|많은\s*리뷰/.test(n)) q.popular = true

  let m = n.match(/(\d+)\s*만\s*(?:원)?(?:\s*이하)?/)
  if (m) q.maxPrice = Number(m[1]) * 10000
  if (q.maxPrice == null) {
    m = n.match(/(\d{2,7})\s*원?\s*이하/)
    if (m) q.maxPrice = Number(m[1])
  }
  if (q.maxPrice == null) {
    m = n.match(/(\d+)\s*만/)
    if (m) q.maxPrice = Number(m[1]) * 10000
  }

  for (const { codes, words } of CATEGORY_TRIGGER) {
    for (const w of words) {
      if (n.includes(w.toLowerCase())) {
        for (const c of codes) {
          if (!q.categories.includes(c)) q.categories.push(c)
        }
      }
    }
  }

  for (const sub of SUBCATEGORY_TRIGGER) {
    if (n.includes(sub.toLowerCase()) && !q.subCategories.includes(sub)) q.subCategories.push(sub)
  }

  if (n.includes('데님') || n.includes('청바지')) {
    if (!q.subCategories.includes('청바지')) q.subCategories.push('청바지')
    if (!q.categories.includes('bottom')) q.categories.push('bottom')
  }

  for (const { names, words } of COLOR_MATCH_GROUPS) {
    for (const w of words) {
      if (n.includes(w.toLowerCase())) {
        for (const name of names) {
          if (!q.colorNames.includes(name)) q.colorNames.push(name)
        }
      }
    }
  }

  for (const { value, words } of GENDER_TRIGGER) {
    for (const w of words) {
      if (n.includes(w.toLowerCase()) && !q.genders.includes(value)) q.genders.push(value)
    }
  }

  for (const [season, words] of Object.entries(SEASON_WORDS)) {
    for (const w of words) {
      if (n.includes(w.toLowerCase())) {
        q.season = /** @type {'spring'|'summer'|'autumn'|'winter'} */ (season)
        break
      }
    }
    if (q.season) break
  }

  for (const [sit, words] of Object.entries(SITUATION_WORDS)) {
    for (const w of words) {
      if (n.includes(w.toLowerCase())) {
        q.situation = /** @type {'office'|'daily'|'casual'} */ (sit)
        break
      }
    }
    if (q.situation) break
  }

  return q
}
