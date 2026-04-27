import { parseRagKeywords } from './keywordParser.js'
import { keywordStructuredSearch } from './searchService.js'
import { filterByHardConstraints } from './rankingService.js'
import { validateCandidates } from './validationService.js'
import { rowToApiProduct } from '../productRowMapper.js'

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function detectBodyTypeFromMessage(n) {
  if (/상체\s*통통|팔뚝\s*통통|상체\s*커버/.test(n)) return '상체통통'
  if (/하체\s*통통|허벅지\s*통통|종아리\s*통통|하체\s*커버/.test(n)) return '하체통통'
  if (/어깨\s*넓은|어깨가\s*넓/.test(n)) return '어깨넓은'
  if (/골반\s*넓은|힙\s*넓은/.test(n)) return '골반넓은'
  if (/통통|통통한|체형\s*커버|커버\s*핏/.test(n)) return '통통'
  if (/마른|마른\s*체형|왜소|말랐/.test(n)) return '마른'
  if (/키\s*작은|작은\s*키|아담/.test(n)) return '키작은'
  if (/키\s*큰|큰\s*키|장신/.test(n)) return '키큰'
  return null
}

/** @param {string} styleKey */
function slotsForStyle(styleKey) {
  /** @type {Record<string, { category: string, subCategory: string, label: string }[]>} */
  const map = {
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
  return map[styleKey] || map.office
}

function styleLineKo(styleKey) {
  switch (styleKey) {
    case 'office':
      return '출근룩'
    case 'daily':
      return '데일리룩'
    case 'date':
      return '데이트룩'
    case 'feminine':
      return '페미닌 무드'
    case 'casual':
      return '캐주얼룩'
    default:
      return '오피스룩'
  }
}

function bodyTypeGuide(bodyType) {
  switch (bodyType) {
    case '상체통통':
      return {
        mention: '상체가 도드라지는 체형을 고려해',
        explain: '어깨선이 부드러운 루즈핏 상의와 세로로 떨어지는 하의를 매치하면 상체 부담을 줄이기 좋아요.',
        darkHint: '상체는 톤다운, 하의는 동일 계열로 맞추면 더 안정적으로 보여요.',
      }
    case '하체통통':
      return {
        mention: '하체 커버를 고려해',
        explain: '허벅지 라인을 덜 드러내는 세미 와이드/스트레이트 하의가 체형 보완에 도움이 돼요.',
        darkHint: '하의를 어두운 컬러로 고르면 더 깔끔한 실루엣을 만들기 좋아요.',
      }
    case '어깨넓은':
      return {
        mention: '어깨가 넓은 체형을 고려해',
        explain: '드롭 숄더 느낌의 여유 있는 상의와 하의 포인트를 주면 시선 분산에 좋아요.',
        darkHint: '',
      }
    case '골반넓은':
      return {
        mention: '골반이 도드라지는 체형을 고려해',
        explain: '하체는 와이드/스트레이트 실루엣으로 정리하고 상의는 단정하게 맞추면 균형감이 좋아져요.',
        darkHint: '',
      }
    case '통통':
      return {
        mention: '통통한 체형을 고려해',
        explain:
          '루즈한 상의와 세미 와이드/와이드 하의 조합이 실루엣을 자연스럽게 커버하고 세로 라인을 살리기 좋아요.',
        darkHint: '블랙·네이비·차콜 같은 어두운 톤을 섞으면 더 슬림해 보이는 인상을 줄 수 있어요.',
      }
    case '마른':
      return {
        mention: '마른 체형을 고려해',
        explain: '슬림핏 이너에 가디건·셔츠 레이어드를 더하면 볼륨감과 균형을 살리기 좋아요.',
        darkHint: '',
      }
    case '키작은':
      return {
        mention: '키가 작은 체형을 고려해',
        explain: '상하 비율을 길어 보이게 하는 하이웨스트·짧은 상의 중심으로 고르면 비율 보완에 도움이 돼요.',
        darkHint: '',
      }
    case '키큰':
      return {
        mention: '키가 큰 체형을 고려해',
        explain: '롱 기장과 와이드 실루엣을 섞으면 전체 비율을 안정감 있게 살리기 좋아요.',
        darkHint: '',
      }
    default:
      return null
  }
}

function adaptSlotsByBodyType(slots, bodyType) {
  if (!bodyType) return slots
  return slots.map((slot) => {
    if (bodyType === '상체통통' && slot.category === 'top') {
      return { ...slot, subCategory: '셔츠', label: '상의(셔츠)' }
    }
    if (bodyType === '하체통통' && slot.category === 'bottom') {
      return { ...slot, subCategory: '슬랙스', label: '하의(슬랙스)' }
    }
    if (bodyType === '골반넓은' && slot.category === 'bottom') {
      return { ...slot, subCategory: '슬랙스', label: '하의(슬랙스)' }
    }
    return slot
  })
}

function bodyTypeRowBoost(row, bodyType) {
  if (!bodyType) return 0
  const txt = `${row?.name || ''} ${row?.description || ''} ${row?.colors || ''}`.toLowerCase()
  if (bodyType === '통통') {
    let s = 0
    if (/와이드|세미\s*와이드|루즈|여유핏/.test(txt)) s += 3
    if (/블랙|네이비|차콜|다크/.test(txt)) s += 1
    return s
  }
  if (bodyType === '마른') {
    let s = 0
    if (/슬림|슬림핏/.test(txt)) s += 2
    if (/가디건|레이어드|니트|셔츠/.test(txt)) s += 2
    return s
  }
  if (bodyType === '키작은') return /하이웨스트|크롭|미니|숏/.test(txt) ? 2 : 0
  if (bodyType === '키큰') return /롱|맥시|와이드|코트/.test(txt) ? 2 : 0
  if (bodyType === '상체통통') return /루즈|셔츠|블라우스|가디건|브이넥|v넥/.test(txt) ? 2 : 0
  if (bodyType === '하체통통') return /세미\s*와이드|와이드|스트레이트|슬랙스|다크/.test(txt) ? 2 : 0
  if (bodyType === '어깨넓은') return /드롭|루즈|브이넥|v넥|가디건/.test(txt) ? 2 : 0
  if (bodyType === '골반넓은') return /와이드|스트레이트|롱|슬랙스/.test(txt) ? 2 : 0
  return 0
}

/**
 * Intent: COORDINATION_RECOMMEND — 슬롯별 1벌씩 골라 코디 세트 구성.
 * @param {string} message
 */
export async function runCoordinationRecommend(message) {
  const base = parseRagKeywords(message)
  const n = norm(message)
  const bodyType = base.bodyType || detectBodyTypeFromMessage(n)
  let styleKey = base.styleKeyword || 'office'
  // 체형 질문에서 스타일 키워드가 없다면 출근룩 고정 대신 데일리룩 기본 적용
  if (!base.styleKeyword && bodyType) styleKey = 'daily'
  if (!base.styleKeyword) {
    if (/데이트|러블리/.test(n)) styleKey = 'date'
    else if (/데일리|일상|무난/.test(n)) styleKey = 'daily'
    else if (/캐주얼|편한|힙|후드|니트/.test(n)) styleKey = 'casual'
    else if (/페미닌|원피스/.test(n)) styleKey = 'feminine'
  }
  const slots = adaptSlotsByBodyType(slotsForStyle(styleKey), bodyType)

  const picked = []
  const seen = new Set()
  for (const slot of slots) {
    const f = {
      ...base,
      categories: [slot.category],
      subCategories: [slot.subCategory],
      strictSubCategory: slot.subCategory,
    }
    const rows = await keywordStructuredSearch(f)
    const ok = filterByHardConstraints(rows, f)
    const { rows: valid } = await validateCandidates(ok.slice(0, 6), f)
    const sorted = [...valid].sort((a, b) => bodyTypeRowBoost(b, bodyType) - bodyTypeRowBoost(a, bodyType))
    const row = sorted[0]
    if (row && !seen.has(row.id)) {
      seen.add(row.id)
      picked.push(rowToApiProduct(row))
    }
  }

  const styleName = styleLineKo(styleKey)
  const parts = slots.map((s) => s.label.split('(')[1]?.replace(')', '') || s.subCategory).join(', ')
  const bt = bodyTypeGuide(bodyType)
  const text =
    picked.length > 0
      ? bt
        ? `${bt.mention} ${styleName} 기준 ${parts} 조합으로 추천드려요. ${bt.explain} ${bt.darkHint}`.trim()
        : `${styleName}으로 ${parts} 조합을 제안해요. 각 슬롯에서 조건(색상·가격)을 맞춘 상품을 골랐어요. 함께 매치해 보세요 😊`
      : `${styleName}에 맞는 조합을 찾기 어려워요. 색상이나 가격 조건을 완화해 보시겠어요?`

  return { text, products: picked.slice(0, 6) }
}

function weatherBandRule(temp) {
  if (temp >= 28) {
    return {
      subs: ['반팔티', '반바지', '미니 원피스', '스니커즈', '숄더백'],
      guide:
        `${temp}도 날씨에는 통기성이 좋은 반팔티나 얇은 원피스에 가벼운 하의를 매치하면 좋아요 😊 강한 햇볕을 고려해 너무 답답한 소재는 피하는 것을 추천드려요.`,
    }
  }
  if (temp >= 23) {
    return {
      subs: ['반팔티', '블라우스', '셔츠', '스커트', '데님', '가디건'],
      guide:
        `${temp}도 날씨에는 너무 두껍지 않은 블라우스나 얇은 셔츠에 데님 또는 스커트를 매치하면 좋아요 😊 가볍게 걸칠 가디건을 함께 보면 아침저녁 기온차에도 대응하기 좋아요.`,
    }
  }
  if (temp >= 18) {
    return {
      subs: ['셔츠', '니트', '가디건', '슬랙스', '데님'],
      guide:
        `${temp}도에는 셔츠·니트에 슬랙스나 데님을 매치한 레이어드 코디가 잘 맞아요 😊 얇은 가디건을 더하면 실내외 온도 차에 대응하기 좋아요.`,
    }
  }
  if (temp >= 12) {
    return {
      subs: ['자켓', '트렌치코트', '니트', '슬랙스'],
      guide:
        `${temp}도에는 자켓이나 트렌치코트 같은 아우터를 중심으로 니트·슬랙스를 매치하면 안정적인 코디가 돼요 😊`,
    }
  }
  if (temp >= 6) {
    return {
      subs: ['코트', '니트', '가디건', '슬랙스'],
      guide:
        `${temp}도에는 코트와 도톰한 니트를 중심으로 보온감을 챙긴 코디를 추천드려요 😊`,
    }
  }
  return {
    subs: ['코트', '니트', '가디건'],
    guide:
      `${temp}도 이하의 날씨에는 패딩/코트 계열 아우터와 보온성 높은 이너 조합이 좋아요 😊 체감 온도가 더 낮을 수 있어 머플러 같은 방한 아이템도 함께 추천드려요.`,
  }
}

function slotsForWeather(temp, styleKey) {
  const hasOffice = styleKey === 'office'
  const base = weatherBandRule(temp).subs
  if (temp >= 23) {
    return [
      { category: 'top', subCategory: hasOffice ? '블라우스' : (base.includes('블라우스') ? '블라우스' : '셔츠') },
      { category: 'bottom', subCategory: base.includes('스커트') ? '스커트' : '데님' },
      { category: 'outer', subCategory: base.includes('가디건') ? '가디건' : '' },
    ].filter((x) => x.subCategory)
  }
  if (temp >= 18) {
    return [
      { category: 'top', subCategory: base.includes('니트') ? '니트' : '셔츠' },
      { category: 'bottom', subCategory: hasOffice ? '슬랙스' : (base.includes('데님') ? '데님' : '슬랙스') },
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

export async function runWeatherCoordinationRecommend(message) {
  const f = parseRagKeywords(message)
  const n = norm(message)
  const temp = f.temperature
  if (temp == null) {
    return {
      text: '기온 정보를 함께 알려주시면 날씨에 맞는 코디를 더 정확히 추천드릴 수 있어요. 예: 23도 코디 추천',
      products: [],
    }
  }

  const styleKey = f.styleKeyword || (/출근|오피스|미팅/.test(n) ? 'office' : 'daily')
  const slots = slotsForWeather(temp, styleKey)
  const picked = []
  const seen = new Set()

  for (const slot of slots) {
    const sf = {
      ...f,
      categories: [slot.category],
      subCategories: [slot.subCategory],
      strictSubCategory: slot.subCategory,
    }
    const rows = await keywordStructuredSearch(sf)
    const ok = filterByHardConstraints(rows, sf)
    const { rows: valid } = await validateCandidates(ok.slice(0, 8), sf)
    const row = valid[0]
    if (row && !seen.has(row.id)) {
      seen.add(row.id)
      picked.push(rowToApiProduct(row))
    }
  }

  const baseGuide = weatherBandRule(temp).guide
  const officeHint = styleKey === 'office'
    ? '출근룩으로 입는 경우에는 구두/로퍼와 단정한 가방을 보조로 매치하면 깔끔해요.'
    : ''

  if (picked.length) {
    return { text: `${baseGuide} ${officeHint}`.trim(), products: picked.slice(0, 6) }
  }

  const fallbackF = { ...f, strictSubCategory: null, subCategories: weatherBandRule(temp).subs, categories: [] }
  const rows = await keywordStructuredSearch(fallbackF)
  const ok = filterByHardConstraints(rows, fallbackF)
  const { rows: valid } = await validateCandidates(ok.slice(0, 8), fallbackF)
  const fallback = valid.map(rowToApiProduct).slice(0, 4)
  return {
    text: `현재 ${temp}도 기준 정확히 맞는 조합이 적어 비슷한 계절감 상품으로 골라드렸어요. ${baseGuide}`,
    products: fallback,
  }
}
