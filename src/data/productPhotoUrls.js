/**
 * subCategory·카테고리에 맞는 실사진(원격 JPG) URL.
 * images.unsplash.com 은 id별로 404가 많아, 응답 200만 모았습니다.
 */
const q = 'w=800&h=1000&fit=crop&q=82'

const U = {
  tee: `https://images.unsplash.com/photo-1503341504253-dff4815485f1?${q}`,
  fashion: `https://images.unsplash.com/photo-1483985988355-763728e1935b?${q}`,
  rack: `https://images.unsplash.com/photo-1445205170230-053b83016050?${q}`,
  dress: `https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?${q}`,
  jacket: `https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?${q}`,
  coat: `https://images.unsplash.com/photo-1608231387042-66d1773070a5?${q}`,
  layer: `https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?${q}`,
  outfit: `https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?${q}`,
  sneaker: `https://images.unsplash.com/photo-1523381210434-271e8be1f52b?${q}`,
  sneaker2: `https://images.unsplash.com/photo-1549298916-b41d501d3772?${q}`,
  street: `https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1000&q=80`,
  flatlay: `https://images.unsplash.com/photo-1512436991641-6745cdb1723f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1000&q=80`,
  accessories: `https://images.unsplash.com/photo-1603252109303-2751441dd157?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1000&q=80`,
  bag: `https://images.unsplash.com/photo-1558171813-4c088753af8f?${q}`,
  // 여성 패션 추가
  blouse: `https://images.unsplash.com/photo-1551489186-cf8726f514f8?${q}`,
  knit: `https://images.unsplash.com/photo-1434389677669-e08b4cac3105?${q}`,
  trench: `https://images.unsplash.com/photo-1562157873-818bc0726f68?${q}`,
  longdress: `https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?${q}`,
  minidress: `https://images.unsplash.com/photo-1496217590455-aa63a8550c23?${q}`,
  skirt: `https://images.unsplash.com/photo-1583496661160-fb5218cceea7?${q}`,
  denim: `https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?${q}`,
  flats: `https://images.unsplash.com/photo-1543163521-1bf539c55dd2?${q}`,
  heels: `https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?${q}`,
  loafer: `https://images.unsplash.com/photo-1556906781-9a412961a28c?${q}`,
  tote: `https://images.unsplash.com/photo-1548036328-c9fa89d128fa?${q}`,
  shoulder: `https://images.unsplash.com/photo-1584917865442-de89df76afd3?${q}`,
  earrings: `https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?${q}`,
  necklace: `https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?${q}`,
  scarf: `https://images.unsplash.com/photo-1590548784585-643d2b9f2925?${q}`,
}

/** 소분류 → [메인 컷, 호버/보조 컷] */
const BY_SUB = {
  // 상의
  반팔티: [U.tee, U.fashion],
  긴팔티: [U.rack, U.tee],
  블라우스: [U.blouse, U.fashion],
  셔츠: [U.tee, U.flatlay],
  니트: [U.knit, U.fashion],
  가디건: [U.knit, U.rack],
  맨투맨: [U.layer, U.fashion],
  후드: [U.layer, U.rack],
  // 아우터
  자켓: [U.jacket, U.outfit],
  코트: [U.coat, U.jacket],
  트렌치코트: [U.trench, U.coat],
  패딩: [U.coat, U.layer],
  // 하의
  청바지: [U.outfit, U.street],
  데님: [U.denim, U.outfit],
  슬랙스: [U.outfit, U.flatlay],
  스커트: [U.skirt, U.fashion],
  반바지: [U.fashion, U.dress],
  // 드레스
  '미니 원피스': [U.minidress, U.dress],
  '롱 원피스': [U.longdress, U.trench],
  // 신발
  스니커즈: [U.sneaker, U.sneaker2],
  로퍼: [U.loafer, U.sneaker2],
  플랫슈즈: [U.flats, U.sneaker2],
  힐: [U.heels, U.flats],
  // 가방
  백팩: [U.accessories, U.bag],
  토트백: [U.tote, U.bag],
  숄더백: [U.shoulder, U.bag],
  크로스백: [U.bag, U.tote],
  // 액세서리
  귀걸이: [U.earrings, U.accessories],
  목걸이: [U.necklace, U.accessories],
  스카프: [U.scarf, U.rack],
}

const FALLBACK = [U.fashion, U.rack]

/** @param {{ subCategory: string; category: string; id: number }} m */
export function remoteImagesForMock(m) {
  const pair = BY_SUB[m.subCategory]
  if (pair) return pair
  if (m.category === '신발') return [U.sneaker, U.sneaker2]
  if (m.category === '가방') return [U.bag, U.accessories]
  if (m.category === '아우터') return [U.jacket, U.coat]
  if (m.category === '하의') return [U.outfit, U.street]
  if (m.category === '상의') return [U.tee, U.fashion]
  return FALLBACK
}
