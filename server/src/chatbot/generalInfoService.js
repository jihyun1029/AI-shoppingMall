/** @typedef {'PRODUCT_RECOMMEND'|'COORDINATION_RECOMMEND'|'CART_RECOMMEND'|'GENERAL_INFO'} ChatIntent */

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * FAQ 고정 응답 (상품 검색 없음).
 * @param {string} message
 * @returns {{ text: string, faqKey: string | null }}
 */
export function answerGeneralInfo(message) {
  const n = norm(message)

  if (/배송|택배|도착|언제\s*와|몇\s*일|영업일/.test(n)) {
    return {
      faqKey: 'shipping',
      text:
        '주문 후 영업일 기준 2~4일 안에 출고되며, 지역에 따라 배송은 보통 1~2일 정도 더 걸릴 수 있어요. 정확한 일정은 주문서에서 배송 안내를 확인해 주세요.',
    }
  }

  if (/환불|교환|반품|취소/.test(n)) {
    return {
      faqKey: 'refund',
      text:
        '상품 수령 후 7일 이내 단순 변심 교환·반품이 가능해요(일부 위생/세일 상품 제외). 맞춤 문의는 고객센터로 연락 주시면 안내드릴게요.',
    }
  }

  if (/고객센터|문의|전화|연락/.test(n)) {
    return {
      faqKey: 'contact',
      text: '고객센터는 평일 10:00~17:00 운영이며, 채팅·이메일 문의도 받고 있어요. 주문번호를 함께 알려주시면 더 빠르게 도와드릴 수 있어요.',
    }
  }

  if (/이\s*쇼핑몰|뭐\s*하는|사이트\s*소개|이게\s*뭐|무슨\s*몰/.test(n)) {
    return {
      faqKey: 'about',
      text:
        '29CM / W CONCEPT 무드의 여성 패션 쇼핑몰이에요. 데일리부터 오피스, 데이트룩까지 미니멀한 실루엣의 아이템을 골라볼 수 있어요.',
    }
  }

  return {
    faqKey: null,
    text:
      '쇼핑·스타일 관련해서는 “가방 추천해줘”, “출근룩 코디”처럼 물어봐 주시면 맞춤으로 도와드릴게요. 배송·환불은 “배송 얼마나 걸려?”처럼 질문해 주세요.',
  }
}
