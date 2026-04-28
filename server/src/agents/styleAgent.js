const STYLE_SLOTS = {
  office: [
    { category: 'top', subCategory: '블라우스', label: '상의(블라우스)' },
    { category: 'bottom', subCategory: '슬랙스', label: '하의(슬랙스)' },
    { category: 'shoes', subCategory: '로퍼', label: '신발(로퍼)' },
  ],
  daily: [
    { category: 'top', subCategory: '반팔티', label: '상의(티)' },
    { category: 'bottom', subCategory: '데님', label: '하의(데님)' },
    { category: 'shoes', subCategory: '스니커즈', label: '신발(스니커즈)' },
  ],
  date: [
    { category: 'top', subCategory: '블라우스', label: '상의(블라우스)' },
    { category: 'bottom', subCategory: '스커트', label: '하의(스커트)' },
    { category: 'shoes', subCategory: '힐', label: '신발(힐)' },
  ],
  feminine: [
    { category: 'dress', subCategory: '롱 원피스', label: '원피스' },
    { category: 'shoes', subCategory: '힐', label: '신발(힐)' },
    { category: 'bag', subCategory: '숄더백', label: '가방(숄더)' },
  ],
  casual: [
    { category: 'top', subCategory: '맨투맨', label: '상의(맨투맨)' },
    { category: 'bottom', subCategory: '데님', label: '하의(데님)' },
    { category: 'shoes', subCategory: '스니커즈', label: '신발(스니커즈)' },
  ],
}

const STYLE_LABELS = {
  office: '출근룩',
  daily: '데일리룩',
  date: '데이트룩',
  feminine: '페미닌 무드',
  casual: '캐주얼룩',
}

function norm(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function adaptSlots(slots, bodyType) {
  if (!bodyType) return slots
  return slots.map((slot) => {
    if (bodyType === '상체통통' && slot.category === 'top') {
      return { ...slot, subCategory: '셔츠', label: '상의(셔츠)' }
    }
    if ((bodyType === '하체통통' || bodyType === '골반넓은') && slot.category === 'bottom') {
      return { ...slot, subCategory: '슬랙스', label: '하의(슬랙스)' }
    }
    return slot
  })
}

/**
 * 스타일/코디 슬롯 에이전트.
 * @param {string} message
 * @param {ReturnType<import('../chatbot/keywordParser.js').parseRagKeywords>} parsed
 * @param {{ bodyType?: string } | null} bodyTypeCtx
 * @returns {{ styleKey: string, label: string, slots: { category: string, subCategory: string, label: string }[] }}
 */
export function styleAgent(message, parsed, bodyTypeCtx) {
  const n = norm(message)
  const bodyType = bodyTypeCtx?.bodyType || null

  let styleKey = parsed.styleKeyword || 'office'
  if (!parsed.styleKeyword) {
    if (bodyType) styleKey = 'daily'
    if (/데이트|러블리/.test(n)) styleKey = 'date'
    else if (/데일리|일상|무난/.test(n)) styleKey = 'daily'
    else if (/캐주얼|편한|힙|후드/.test(n)) styleKey = 'casual'
    else if (/페미닌|원피스/.test(n)) styleKey = 'feminine'
  }

  const slots = adaptSlots(STYLE_SLOTS[styleKey] || STYLE_SLOTS.office, bodyType)

  return {
    styleKey,
    label: STYLE_LABELS[styleKey] || '코디',
    slots,
  }
}

/**
 * 날씨 기온에 따른 슬롯 결정.
 * @param {number} temp
 * @param {string} styleKey
 * @returns {{ category: string, subCategory: string }[]}
 */
export function weatherSlotsForTemp(temp, styleKey) {
  const hasOffice = styleKey === 'office'
  if (temp >= 23) {
    return [
      { category: 'top', subCategory: hasOffice ? '블라우스' : '셔츠' },
      { category: 'bottom', subCategory: temp >= 28 ? '반바지' : (temp >= 23 ? '스커트' : '데님') },
      { category: 'outer', subCategory: temp >= 28 ? '' : '가디건' },
    ].filter((x) => x.subCategory)
  }
  if (temp >= 18) {
    return [
      { category: 'top', subCategory: '니트' },
      { category: 'bottom', subCategory: hasOffice ? '슬랙스' : '데님' },
      { category: 'outer', subCategory: '가디건' },
    ]
  }
  if (temp >= 12) {
    return [
      { category: 'outer', subCategory: '트렌치코트' },
      { category: 'top', subCategory: '니트' },
      { category: 'bottom', subCategory: '슬랙스' },
    ]
  }
  return [
    { category: 'outer', subCategory: '코트' },
    { category: 'top', subCategory: '니트' },
    { category: 'bottom', subCategory: '슬랙스' },
  ]
}
