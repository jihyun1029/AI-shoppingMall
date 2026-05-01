# Studio Line — 여성 패션 쇼핑몰 포트폴리오

---

## 개요

React + Express 기반으로 구현한 풀스택 쇼핑몰 포트폴리오 프로젝트입니다.  
여성 패션 상품 100종을 갖춘 커머스 UI와 함께, "오늘 뭐 입지?"라는 질문에 답하는  
Agent 기반 AI 챗봇을 직접 설계·구현했습니다.

---

## 주요 기능

- 상품 목록 필터링·검색·정렬 (카테고리, 서브카테고리, 색상)
- 상품 상세 페이지 (색상·사이즈 선택, 이미지 폴백)
- 장바구니 (수량 조절, 총액 계산)
- 회원가입·로그인 (JWT 인증), 마이페이지
- 주문 완료 및 주문 내역
- AI 챗봇 — 기온·체형·스타일 기반 코디 추천, 다중 턴 대화 컨텍스트 유지
- 관리자 페이지 — 상품 CRUD, 대시보드

---

## 기술 스택

- **프론트엔드**: React 19, React Router v7, Tailwind CSS v4, Vite
- **백엔드**: Node.js, Express 4, MongoDB, Mongoose, JWT
- **인프라**: Docker Compose, Nginx

---

## 기여도

개인 프로젝트 (기여도 100%)

- 프론트엔드 전체 설계 및 구현 (React 컴포넌트, Context, 커스텀 훅)
- 백엔드 API 설계 및 구현 (Express 라우터, Mongoose 모델, JWT 인증)
- AI 챗봇 Agent 파이프라인 설계 (10개 Agent, 다중 턴 컨텍스트 누적 로직)
- MongoDB 마이그레이션 (SQLite → MongoDB)
- Docker Compose 기반 배포 환경 구성

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

**Intent 분류: LLM vs 키워드 점수 기반**

LLM을 사용하면 자연어 이해도가 높아지지만, 외부 API 비용과 응답 지연이 발생합니다.  
포트폴리오 환경에서 외부 의존성 없이 일관된 동작을 보장하기 위해 키워드 점수 기반 분류를 선택했습니다.  
대신 Intent별 키워드 패턴을 세밀하게 설계해 오분류를 줄였습니다.

**DB: SQLite → MongoDB**

초기에는 SQLite로 빠르게 구현했지만, 상품 속성(색상 배열, 서브카테고리 등) 표현이 어색하고  
Docker 구성 시 파일 마운트 관리가 번거로웠습니다.  
MongoDB로 전환하면서 비정형 데이터를 자연스럽게 표현하고, `mongo` 서비스 추가만으로 Docker 구성이 단순해졌습니다.

**컨텍스트 저장: 서버 세션 vs 프론트엔드 상태**

서버에서 세션을 관리하면 구현이 복잡해지고 서버가 상태를 갖게 됩니다.  
`lastContext`를 프론트엔드 `useState`에 보관하고 매 요청마다 함께 전송하는 방식을 선택해  
서버를 무상태로 유지하면서도 다중 턴 대화를 구현했습니다.

**후속 질문 감지: 문장 길이 기준 vs 명시적 마커 + 스레드 유무**

처음에는 20자 이하 짧은 문장을 후속 질문으로 판별했으나, "통통한 체형 코디는?"처럼 체형 질문이  
짧아도 새 조건을 포함하는 경우를 놓쳤습니다.  
명시적 마커("바지도", "말고", "그럼" 등)와 이전 스레드 유무를 함께 판단하는 방식으로 개선했습니다.

**폴백 전략: 결과 없음 안내 vs 조건 완화 후 재검색**

조건에 맞는 상품이 없을 때 "결과가 없습니다"로 끝내면 사용자가 다시 처음부터 입력해야 합니다.  
조건을 완화한 뒤 인기순으로 차선 상품을 추천하고, 조건과 다를 수 있음을 안내하는 방식을 택했습니다.

---

## 4. 시스템 아키텍처

```
┌─────────────────────────────────────────────┐
│                 브라우저                     │
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

1. 사용자가 메시지를 입력하면 프론트엔드가 `message` + `lastContext`를 함께 POST로 전송
2. `chatbotWorkflow`가 10개 Agent를 순서대로 실행
3. 후속 질문으로 감지되면 `lastContext`와 현재 파싱 결과를 병합해 조건 누적
4. Retrieval Agent가 MongoDB에서 슬롯별로 독립 필터를 적용해 상품 검색
5. 랭킹 → 검증 → 자연어 응답 생성 후 `{ intent, keywords, text, products }` 반환
6. 프론트엔드가 응답의 `keywords`에서 다음 요청용 `lastContext`를 추출해 세션에 저장

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

**1단계 — 초기 구현 (룰베이스)**

- 단일 함수(`parseChatQuery` + `recommendProducts`)로 키워드 매칭 후 로컬 필터링
- 서버 없이 프론트엔드에서 전체 추천 로직 실행

**2단계 — RAG + SQLite**

- Express 서버 + SQLite DB 도입, 서버에서 상품 검색 처리
- 색상·카테고리 필터, 상품별 추천 이유(reason) UI 추가
- 서브카테고리 strict 필터 도입

**3단계 — Agent 파이프라인 + MongoDB**

- SQLite(better-sqlite3) → MongoDB(Mongoose) 마이그레이션
- 단일 함수에서 10-Agent 순차 파이프라인으로 전환
- 체형 Intent 분류 개선, 장바구니 빈 상태 자연어 처리 추가

**4단계 — 다중 턴 대화 컨텍스트**

- `lastContext`를 프론트엔드 세션에 보관하고 매 요청마다 전달
- 바지/스커트 필터 명시적 분리 (`allowedSubCategories` / `excludedSubCategories`)
- 후속 질문 감지 로직 재설계: 짧은 문장 기준 → 명시적 마커 + 스레드 유무 판별
- 코디 슬롯별 필터 격리, 누적 조건을 반영한 자연어 응답 생성

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

> MongoDB 컨테이너가 healthy 상태가 된 뒤 API 서버가 자동으로 시작됩니다.

### 로컬 개발 서버

```bash
# 1. 의존성 설치
npm install
cd server && npm install && cd ..

# 2. 환경 변수 설정
cp .env.example .env
cp server/.env.example server/.env

# 3. MongoDB 실행
docker compose up mongo -d

# 4. 프론트 + 백 동시 실행
npm run dev:all
```

- 프론트엔드: http://localhost:5173
- API 서버: http://localhost:4000

### 환경 변수

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

### 트러블슈팅

| 증상 | 해결 방법 |
|------|----------|
| 코드 수정 후 반영 안 됨 | `docker compose up --build` |
| MongoDB 연결 실패 (`ECONNREFUSED 27017`) | `docker compose up mongo -d` 로 먼저 실행 |
| API가 응답하지 않음 (LAN 환경) | `VITE_API_URL`에 절대 경로를 넣지 말 것. 프론트는 `/api/...` 상대 경로로 호출됨 |
| BuildKit snapshot 에러 | 아래 명령 실행 |

```bash
docker builder prune -af
docker compose build --no-cache
docker compose up
```
