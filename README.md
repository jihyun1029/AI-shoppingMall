# Studio Line — 여성 패션 쇼핑몰 포트폴리오

React + Express 기반의 풀스택 쇼핑몰 포트폴리오 프로젝트입니다.  
여성 패션 상품 100종을 갖춘 커머스 UI와 Agent 기반 AI 챗봇·추천 기능을 구현했습니다.

---

## 1. 문제 정의

쇼핑몰을 이용할 때 **"어떤 옷을 입어야 할지 모르겠다"** 는 상황은 누구나 경험합니다.  
상품 목록을 직접 탐색하는 것만으로는 코디 조합을 떠올리기 어렵고, 날씨나 체형 같은 개인 조건을 반영한 추천을 받기는 더욱 어렵습니다.

이 문제를 해결하기 위해 **대화형 AI 챗봇** 기능을 추가했습니다.  
단순 상품 검색을 넘어, 기온·체형·스타일 등 사용자의 상황에 맞는 코디를 자연어로 추천받을 수 있도록 구현했습니다.

---

## 2. 해결 방향

**개념적 접근 — 사용자 관점**

"오늘 뭐 입지?"라는 질문에 답할 수 있는 대화형 챗봇을 목표로 했습니다.  
사용자가 기온·체형·스타일 등 자신의 상황을 자연어로 말하면, 그에 맞는 코디 조합을 추천받을 수 있도록 설계했습니다.  
대화가 이어질수록 조건이 누적되어, 여러 번 주고받을수록 더 정확한 추천이 가능합니다.

**기술적 접근 — 구현 방식**

단일 함수 룰베이스에서 **10-Agent 순차 파이프라인**으로 전환해 각 판단 단계를 독립 모듈로 분리했습니다.

- **Intent Agent** — 질문 유형(상품/코디/날씨/장바구니/FAQ)을 먼저 분류
- **Parser Agent** — 카테고리·색상·가격·체형·기온 등을 구조화된 객체로 추출
- **`allowedSubCategories` / `excludedSubCategories`** — "바지"와 "하의"를 다르게 처리하는 명시적 필터 분리
- **`lastContext`** — 프론트엔드 세션에 이전 조건을 보관하고 매 요청마다 전달해 후속 질문에 누적 반영

**혼합 — 사용자 경험과 기술의 연결**

사용자가 "23도 날씨에 바지 코디 추천해줘, 통통한 체형도 고려해줘"처럼 조건을 여러 턴에 걸쳐 추가해도,  
Agent 파이프라인이 이전 컨텍스트와 병합해 자연스럽게 조건을 이어갑니다.  
LLM 없이 키워드 기반으로 구현해 외부 API 의존성 없이 빠른 응답을 유지했습니다.

---

## 3. 트레이드오프 및 설계 결정

| 결정 | 선택 | 이유 |
|------|------|------|
| Intent 분류 방식 | 키워드 점수 기반 (LLM 없음) | 외부 API 의존성 없이 빠른 응답, 포트폴리오 환경에서 비용 0 |
| DB | SQLite → MongoDB | 비정형 상품 속성(색상 배열 등) 표현이 자연스럽고 Docker 구성이 단순해짐 |
| 컨텍스트 저장 위치 | 프론트엔드 세션 (`useState`) | 서버 세션 없이도 다중 턴 유지 가능, 서버 무상태 유지 |
| 후속 질문 감지 | 명시적 마커 + 스레드 유무 판별 | 짧은 문장 단순 판별보다 오탐 감소 |
| 코디 슬롯 격리 | 슬롯마다 `allowedSubCategories: []` 초기화 | 바지 필터가 상의·신발 슬롯에 전파되는 버그 방지 |
| 폴백 전략 | 조건 완화 후 인기순 재검색 | 결과 0건보다 차선 추천이 UX상 낫다고 판단 |

---

## 4. 시스템 아키텍처

```
┌─────────────────────────────────────────────┐
│                 Browser                     │
│  React 19 + Tailwind CSS                    │
│  ChatbotProvider (lastContext 세션 보관)     │
│        │ POST /api/chatbot                  │
│        │ { message, cartProductIds,         │
│        │   lastContext }                    │
└────────┼────────────────────────────────────┘
         │
┌────────▼────────────────────────────────────┐
│            Express API  :4000               │
│  chatbotController → chatbotWorkflow        │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  10-Agent Pipeline (순차 실행)        │   │
│  │  Intent → Parser → Planner           │   │
│  │  → Weather / BodyType / Style        │   │
│  │  → Retrieval → Ranking               │   │
│  │  → Validation → Response             │   │
│  └──────────────────────────────────────┘   │
│        │ Mongoose ODM                        │
└────────┼────────────────────────────────────┘
         │
┌────────▼──────────┐
│   MongoDB :27017  │
│  products / users │
│  orders / carts   │
└───────────────────┘
```

**요청 흐름 요약**

1. 프론트엔드가 `message` + `lastContext` 를 POST로 전송
2. `chatbotWorkflow`가 10개 Agent를 순서대로 실행
3. 후속 질문 감지 시 `lastContext`와 현재 파싱 결과를 병합
4. MongoDB에서 슬롯별 상품 검색 → 랭킹 → 검증
5. `{ intent, keywords, text, products }` 응답 반환
6. 프론트엔드가 `keywords`에서 다음 요청용 `lastContext`를 추출·저장

---

## 5. 에이전트 파이프라인

```
사용자 메시지
     │
     ▼
┌─────────────┐
│ intentAgent │ → PRODUCT / COORDINATION / WEATHER / CART / GENERAL
└──────┬──────┘
       ▼
┌─────────────┐
│ parserAgent │ → { categories, subCategories, colors, price,
└──────┬──────┘     temperature, bodyType,
       │            allowedSubCategories, excludedSubCategories }
       ▼
┌──────────────┐
│ plannerAgent │ → { strategy, useWeather, useBodyType, useStyle }
└──────┬───────┘
       ├──────────────────────────────────┐
       ▼                                  ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ weatherAgent│  │bodyTypeAgent│  │  styleAgent │
│ 기온→시즌   │  │체형→보완힌트│  │슬롯구성(상의│
│ 추천서브카테│  │선호색상/서브│  │하의·신발·백)│
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       └─────────────────┴─────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │ retrievalAgent   │
              │ MongoDB 검색     │
              │ 슬롯별 필터 격리 │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │  rankingAgent    │
              │ 조건 일치도+평점 │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │ validationAgent  │
              │ 슬롯별 검증+폴백 │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │ responseAgent    │
              │ 누적 조건 반영   │
              │ 자연어 응답 생성 │
              └──────────────────┘
```

| Agent | 주요 입력 | 출력 |
|-------|----------|------|
| Intent | message | intent 레이블 |
| Parser | message | 구조화된 키워드 객체 |
| Planner | intent | 실행 전략 + 사용 Agent 플래그 |
| Weather | temperature | 계절·추천 서브카테고리·가이드 문구 |
| BodyType | bodyType | 선호 서브카테고리·색상 힌트·설명 문구 |
| Style | message, parsed, bodyTypeCtx | 슬롯 목록 (상의/하의/신발/가방) |
| Retrieval | parsed, plan, context | 슬롯별 MongoDB 검색 결과 |
| Ranking | candidates, parsed | 점수 정렬된 후보 목록 |
| Validation | ranked, parsed, slots | 검증 통과 상품 + 폴백 여부 |
| Response | validationResult, parsed, context | `{ text, products }` |

**다중 턴 컨텍스트 누적 예시**

```
① "23도 날씨 코디 추천해줘"
   → lastContext: { temperature: 23, intent: WEATHER_COORDINATION }

② "바지도 추천해줘"  (후속 감지 → merge)
   → lastContext: { temperature: 23,
                    allowedSubCategories: ['슬랙스','데님','반바지','와이드 팬츠'],
                    excludedSubCategories: ['스커트'] }

③ "통통한 체형 코디는?"  (후속 감지 → merge)
   → merged: { temperature: 23, allowedSubCategories: [...], bodyType: '통통' }
   → 응답: "앞서 말씀하신 23도 날씨 기준으로, 바지 코디에 통통한 체형 커버 조건까지 반영해 추천드릴게요 😊"
```

---

## 6. 프로젝트 진화 경로

```
[1단계] 초기 구현
  단일 함수 룰베이스 추천
  → parseChatQuery + recommendProducts (로컬 필터)

[2단계] RAG + SQLite
  SQLite DB에서 상품 검색
  → 색상·카테고리 필터, 추천 이유(reason) UI 추가
  → 서브카테고리 strict 필터 도입

[3단계] Agent 파이프라인 + MongoDB
  better-sqlite3 → MongoDB(Mongoose) 마이그레이션
  10-Agent 순차 파이프라인 구현
  → 체형 Intent 개선, 장바구니 빈 상태 처리

[4단계] 다중 턴 대화 컨텍스트
  lastContext 프론트엔드 세션 보관
  → 바지/스커트 필터 분리 (allowedSubCategories / excludedSubCategories)
  → isFollowUpMessage 재설계: 명시적 마커 + 스레드 유무 판별
  → 코디 슬롯별 필터 격리, 누적 조건 응답 텍스트 반영
```

---

## 7. 기술 스택

**Frontend**
- React 19 · React Router v7
- Tailwind CSS v4
- Vite 8

**Backend**
- Node.js · Express 4
- MongoDB 7 · Mongoose (ODM)
- JWT 인증 (jsonwebtoken · bcryptjs)

**인프라**
- Docker Compose (MongoDB + API 컨테이너 + Nginx 정적 서빙)
- MongoDB named volume (`mongo_data`)

---

## 8. 실행 방법

### Docker로 실행 (권장)

```bash
docker compose up --build
```

브라우저에서 http://localhost:8080 접속

> MongoDB 컨테이너가 healthy 상태가 된 뒤 API 서버가 시작됩니다.

**API가 응답하지 않을 때**

- 프론트는 같은 호스트의 `/api/...` (상대 경로)로 호출합니다. 빌드 시 `VITE_API_URL`을 비워 두므로, 브라우저는 `http://(접속 호스트):8080/api/...` → Nginx → `api:4000` 으로 전달됩니다.
- `VITE_API_URL=http://localhost:4000` 처럼 절대 경로를 넣으면 LAN 환경에서 동작하지 않습니다.

### 로컬 개발 서버

```bash
# 의존성 설치
npm install
cd server && npm install && cd ..

# MongoDB 실행
docker compose up mongo -d

# 환경 변수 설정
cp .env.example .env
cp server/.env.example server/.env

# 프론트 + 백 동시 실행
npm run dev:all
```

- 프론트엔드: http://localhost:5173
- API 서버: http://localhost:4000

**환경 변수**

| 변수 | 설명 |
|------|------|
| `JWT_SECRET` | JWT 서명 키 |
| `MONGODB_URI` | MongoDB 연결 URI (기본: `mongodb://localhost:27017/shopping-mall`) |
| `CORS_ORIGIN` | 허용할 Origin (쉼표 구분) |

### 관리자 계정

| 항목 | 값 |
|------|----|
| 이메일 | admin@studio-line.com |
| 비밀번호 | admin1234 |

---

## Docker 트러블슈팅

- 코드 수정 후 반영이 안 보이면: `docker compose up --build`
- MongoDB 연결 실패(`ECONNREFUSED 27017`): `docker compose up mongo -d` 로 먼저 실행
- BuildKit snapshot 에러 시:

```bash
docker builder prune -af
docker compose build --no-cache
docker compose up
```
