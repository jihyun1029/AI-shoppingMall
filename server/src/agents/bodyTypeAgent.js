import { preferredSubCategoriesForBodyType } from '../chatbot/keywordParser.js'

const BODY_TYPE_GUIDES = {
  보통: {
    mention: '보통 체형 기준으로',
    explain: '상의는 살짝 여유 있고 하의는 스트레이트/세미와이드 실루엣으로 맞추면 전체 균형을 깔끔하게 유지하기 좋아요.',
    colorHints: [],
    styleHints: ['스트레이트', '세미와이드', '레이어드'],
  },
  '상체통통': {
    mention: '상체가 도드라지는 체형을 고려해',
    explain: '어깨선이 부드러운 루즈핏 상의와 세로로 떨어지는 하의를 매치하면 상체 부담을 줄이기 좋아요.',
    colorHints: ['블랙', '네이비', '차콜'],
    styleHints: ['루즈핏', '오버핏', '브이넥'],
  },
  '하체통통': {
    mention: '하체 커버를 고려해',
    explain: '허벅지 라인을 덜 드러내는 세미 와이드/스트레이트 하의가 체형 보완에 도움이 돼요.',
    colorHints: ['블랙', '네이비', '차콜'],
    styleHints: ['와이드', '스트레이트', '세미와이드'],
  },
  '어깨넓은': {
    mention: '어깨가 넓은 체형을 고려해',
    explain: '드롭 숄더 느낌의 여유 있는 상의와 하의 포인트를 주면 시선 분산에 좋아요.',
    colorHints: [],
    styleHints: ['드롭숄더', '루즈', '브이넥'],
  },
  '골반넓은': {
    mention: '골반이 도드라지는 체형을 고려해',
    explain: '하체는 와이드/스트레이트 실루엣으로 정리하고 상의는 단정하게 맞추면 균형감이 좋아져요.',
    colorHints: [],
    styleHints: ['와이드', '스트레이트'],
  },
  '통통': {
    mention: '통통한 체형을 고려해',
    explain: '루즈한 상의와 세미 와이드/와이드 하의 조합이 실루엣을 자연스럽게 커버하고 세로 라인을 살리기 좋아요.',
    colorHints: ['블랙', '네이비', '차콜'],
    styleHints: ['와이드', '루즈', '여유핏'],
  },
  '마른': {
    mention: '마른 체형을 고려해',
    explain: '슬림핏 이너에 가디건·셔츠 레이어드를 더하면 볼륨감과 균형을 살리기 좋아요.',
    colorHints: [],
    styleHints: ['슬림', '레이어드'],
  },
  '키작은': {
    mention: '키가 작은 체형을 고려해',
    explain: '상하 비율을 길어 보이게 하는 하이웨스트·짧은 상의 중심으로 고르면 비율 보완에 도움이 돼요.',
    colorHints: [],
    styleHints: ['하이웨스트', '크롭', '미니'],
  },
  '키큰': {
    mention: '키가 큰 체형을 고려해',
    explain: '롱 기장과 와이드 실루엣을 섞으면 전체 비율을 안정감 있게 살리기 좋아요.',
    colorHints: [],
    styleHints: ['롱', '와이드', '맥시'],
  },
}

/**
 * 체형 컨텍스트 에이전트.
 * @param {ReturnType<import('../chatbot/keywordParser.js').parseRagKeywords>} parsed
 * @returns {{ bodyType: string, preferredSubs: string[], colorHints: string[], styleHints: string[], mention: string, explain: string } | null}
 */
export function bodyTypeAgent(parsed) {
  const bodyType = parsed.bodyType
  if (!bodyType) return null

  const guide = BODY_TYPE_GUIDES[bodyType] || {
    mention: '',
    explain: '',
    colorHints: [],
    styleHints: [],
  }

  return {
    bodyType,
    preferredSubs: preferredSubCategoriesForBodyType(bodyType),
    ...guide,
  }
}
