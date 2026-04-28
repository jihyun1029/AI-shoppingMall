/**
 * 날씨/기온 컨텍스트 에이전트.
 * @param {ReturnType<import('../chatbot/keywordParser.js').parseRagKeywords>} parsed
 * @returns {{ temperature: number, season: string, guide: string, recommendedSubs: string[] } | null}
 */
export function weatherAgent(parsed) {
  const temp = parsed.temperature
  if (temp == null) return null

  let season
  if (temp >= 28) season = '여름'
  else if (temp >= 23) season = '초여름'
  else if (temp >= 18) season = '봄/가을'
  else if (temp >= 12) season = '가을'
  else if (temp >= 6) season = '초겨울'
  else season = '겨울'

  let recommendedSubs, guide
  if (temp >= 28) {
    recommendedSubs = ['반팔티', '반바지', '미니 원피스', '스니커즈', '숄더백']
    guide = `${temp}도 날씨에는 통기성이 좋은 반팔티나 얇은 원피스에 가벼운 하의를 매치하면 좋아요 😊 강한 햇볕을 고려해 너무 답답한 소재는 피하는 것을 추천드려요.`
  } else if (temp >= 23) {
    recommendedSubs = ['반팔티', '블라우스', '셔츠', '스커트', '데님', '가디건']
    guide = `${temp}도 날씨에는 너무 두껍지 않은 블라우스나 얇은 셔츠에 데님 또는 스커트를 매치하면 좋아요 😊 가볍게 걸칠 가디건을 함께 보면 아침저녁 기온차에도 대응하기 좋아요.`
  } else if (temp >= 18) {
    recommendedSubs = ['셔츠', '니트', '가디건', '슬랙스', '데님']
    guide = `${temp}도에는 셔츠·니트에 슬랙스나 데님을 매치한 레이어드 코디가 잘 맞아요 😊 얇은 가디건을 더하면 실내외 온도 차에 대응하기 좋아요.`
  } else if (temp >= 12) {
    recommendedSubs = ['자켓', '트렌치코트', '니트', '슬랙스']
    guide = `${temp}도에는 자켓이나 트렌치코트 같은 아우터를 중심으로 니트·슬랙스를 매치하면 안정적인 코디가 돼요 😊`
  } else if (temp >= 6) {
    recommendedSubs = ['코트', '니트', '가디건', '슬랙스']
    guide = `${temp}도에는 코트와 도톰한 니트를 중심으로 보온감을 챙긴 코디를 추천드려요 😊`
  } else {
    recommendedSubs = ['코트', '니트', '가디건']
    guide = `${temp}도 이하의 날씨에는 패딩/코트 계열 아우터와 보온성 높은 이너 조합이 좋아요 😊 체감 온도가 더 낮을 수 있어 머플러 같은 방한 아이템도 함께 추천드려요.`
  }

  return { temperature: temp, season, guide, recommendedSubs }
}
