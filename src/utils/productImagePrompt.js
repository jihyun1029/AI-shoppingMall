/**
 * 외부 이미지 생성 API(예: Imagen, DALL·E, Midjourney)에 넣을 상품 일치 프롬프트 빌더.
 * @typedef {{ brand: string; name: string; category: string; subCategory: string; color?: string; colors?: string }} ProductLike
 */

/** 서브카테고리 → 영문 상품 타입 (모델이 카테고리를 정확히 맞추도록) */
export const SUBCATEGORY_EN = {
  반팔티: 'short-sleeve t-shirt',
  블라우스: 'blouse',
  셔츠: 'shirt',
  니트: 'knit sweater',
  가디건: 'cardigan',
  자켓: 'jacket',
  코트: 'coat',
  트렌치코트: 'trench coat',
  패딩: 'puffer jacket',
  슬랙스: 'tailored slacks',
  데님: 'denim jeans',
  스커트: 'skirt',
  반바지: 'shorts',
  '미니 원피스': 'mini dress',
  '롱 원피스': 'long dress',
  플랫슈즈: 'flat shoes',
  힐: 'heels',
  로퍼: 'loafers',
  스니커즈: 'sneakers',
  토트백: 'tote bag',
  숄더백: 'shoulder bag',
  크로스백: 'crossbody bag',
  귀걸이: 'earrings',
  목걸이: 'necklace',
  스카프: 'scarf',
}

/** 카테고리별 촬영·구도 규칙 (영문, 상품 일치 강조) */
export const CATEGORY_SHOT_RULES = {
  top:
    'Upper-body garment only or upper-focused editorial wear shot; lower body only as minimal secondary if visible. Full top silhouette, product must be clearly a top.',
  outer:
    'Outerwear only; emphasize full outer silhouette and length. No unrelated garment as hero.',
  bottom:
    'Bottom-focused from waist to hem; legs and hemline clearly visible. No dress or full outfit stealing focus.',
  dress:
    'Dress only; full length and fit visible; clearly mini OR long dress as specified. No separates as main subject.',
  shoes:
    'Footwear product shot only; side or 45-degree three-quarter view; single pair centered. No clothing as hero.',
  bag:
    'Handbag only, centered; optional natural carry shot but bag must dominate frame. No other fashion category as focus.',
  accessory:
    'Accessory macro product shot; fine detail visible; single jewelry or scarf item. No apparel as main subject.',
}

function firstColorFromProduct(product) {
  if (product.color && String(product.color).trim()) return String(product.color).trim()
  try {
    const arr = JSON.parse(String(product.colors || '[]'))
    if (Array.isArray(arr) && arr[0]) return String(arr[0]).trim()
  } catch {
    /* ignore */
  }
  return 'neutral'
}

function subEn(subCategory) {
  return SUBCATEGORY_EN[subCategory] || String(subCategory || 'women fashion item')
}

/**
 * 단일 상품용 이미지 생성 프롬프트 (요청하신 형식 + 카테고리 락)
 * @param {ProductLike} product
 * @returns {string}
 */
export function buildProductImagePrompt(product) {
  const brand = String(product.brand || '').trim()
  const name = String(product.name || '').trim()
  const category = String(product.category || 'top').trim()
  const subCategory = String(product.subCategory || '').trim()
  const color = firstColorFromProduct(product)
  const typeEn = subEn(subCategory)
  const shot = CATEGORY_SHOT_RULES[category] || CATEGORY_SHOT_RULES.top

  const core = [
    `${brand} mood`,
    `${color} ${typeEn}`,
    `women's ${typeEn}`,
    'minimal 29CM and W-Concept inspired aesthetic',
    'product-centered ecommerce photography',
    'must match the product exactly — wrong category forbidden',
    `hero item is ONLY: ${typeEn} (${subCategory})`,
    `Korean product name reference: ${name}`,
    shot,
    'centered composition, full silhouette readable',
    'white or bright neutral background, clean and simple',
    'soft natural lighting, subtle realistic shadow',
    'photorealistic, high resolution, editorial quality',
    'square 1:1 aspect ratio, thumbnail suitable',
    'no brand logo text, no watermark, no typography',
    'no unrelated props; nothing obscuring the product',
  ].join(', ')

  return core
}

/**
 * 요청하신 한 줄형 프롬프트(짧은 템플릿 + 카테고리 락 문장)
 * @param {ProductLike} product
 * @returns {string}
 */
export function buildCompactImagePrompt(product) {
  const brand = String(product.brand || '').trim()
  const name = String(product.name || '').trim()
  const category = String(product.category || 'top').trim()
  const sub = String(product.subCategory || '').trim()
  const color = firstColorFromProduct(product)
  const typeEn = subEn(sub)
  const shot = CATEGORY_SHOT_RULES[category] || CATEGORY_SHOT_RULES.top

  return [
    `${brand} mood, ${color} ${sub} (${typeEn}), women fashion item, minimal 29CM style, product-centered ecommerce image, must match the product exactly, clean background, soft lighting, realistic, high quality, square 1:1, no logo, no text`,
    shot,
    `Korean listing title: ${name}. The generated image must strictly match this product category only. Do not generate unrelated clothing or items.`,
  ].join('. ')
}
