/** 카테고리 코드 (상품 데이터 `category` 필드) */
export const CATEGORY_CODES = ['top', 'outer', 'bottom', 'dress', 'shoes', 'bag']

/** 한글·영문 → category 코드 */
export const CATEGORY_TRIGGER = [
  { codes: ['top'], words: ['상의', '티', '셔츠', '맨투맨', '후드', '반팔', '긴팔', '탑'] },
  { codes: ['outer'], words: ['아우터', '자켓', '코트', '패딩', '점퍼', '재킷'] },
  { codes: ['bottom'], words: ['하의', '바지', '청바지', '데님', '슬랙스', '반바지', '팬츠'] },
  { codes: ['dress'], words: ['원피스', '드레스'] },
  { codes: ['shoes'], words: ['신발', '스니커즈', '스니커', '로퍼', '슈즈'] },
  { codes: ['bag'], words: ['가방', '백팩', '크로스백', '크로스'] },
]

/** 서브카테고리 키워드 (상품 `subCategory`와 매칭) */
export const SUBCATEGORY_TRIGGER = [
  '반팔티',
  '긴팔티',
  '셔츠',
  '맨투맨',
  '후드',
  '자켓',
  '코트',
  '패딩',
  '청바지',
  '슬랙스',
  '반바지',
  '스니커즈',
  '로퍼',
  '백팩',
  '크로스백',
  '원피스',
]

/** 색상 표기 → DB 색상명 `colors[].name` 후보 */
export const COLOR_ALIASES = [
  { names: ['블랙', '차콜'], words: ['블랙', '검정', '검은', 'black', 'blk', '다크'] },
  { names: ['화이트', '아이보리', '크림'], words: ['화이트', '흰', '하양', 'white', '아이보리', 'ivory', '크림'] },
  { names: ['네이비'], words: ['네이비', 'navy', '남색'] },
  { names: ['베이지', '카키', '올리브'], words: ['베이지', 'beige', '카키', 'khaki', '올리브', 'olive'] },
  { names: ['그레이', '멜란지', '차콜'], words: ['그레이', 'grey', 'gray', '멜란지', 'melange'] },
  { names: ['브라운', '버건디', '와인'], words: ['브라운', 'brown', '버건디', '와인', 'wine'] },
  { names: ['블루', '라이트블루', '인디고', '연청', '미디엄블루'], words: ['블루', 'blue', '청', '데님'] },
]

export const GENDER_TRIGGER = [
  { value: 'male', words: ['남성', '남자', '맨즈', "men's", 'mens', '맨'] },
  { value: 'female', words: ['여성', '여자', '우먼', "women's", 'womens', '우먼스'] },
  { value: 'unisex', words: ['공용', '유니섹스', 'unisex'] },
]

/** 계절 → 우선 서브카테고리 가중치 */
export const SEASON_SUBS = {
  spring: ['셔츠', '자켓', '슬랙스', '로퍼', '크로스백'],
  summer: ['반팔티', '반바지', '스니커즈', '크로스백', '셔츠'],
  autumn: ['맨투맨', '후드', '자켓', '청바지', '로퍼'],
  winter: ['패딩', '코트', '맨투맨', '후드', '스니커즈'],
}

/** 상황·스타일 → 서브카테고리 힌트 */
export const SITUATION_SUBS = {
  office: ['셔츠', '슬랙스', '로퍼', '자켓', '크로스백'],
  daily: ['반팔티', '맨투맨', '청바지', '스니커즈', '후드'],
  casual: ['후드', '맨투맨', '청바지', '반바지', '스니커즈'],
}

export const SITUATION_WORDS = {
  office: ['출근', '오피스', '비즈니스', '포멀', '미팅'],
  daily: ['데일리', '일상', '편한', '무난'],
  casual: ['캐주얼', '스트릿', '힙', '루즈'],
}

export const SEASON_WORDS = {
  spring: ['봄'],
  summer: ['여름', '시원', '더운'],
  autumn: ['가을'],
  winter: ['겨울', '따뜻', '보온', '방한'],
}
