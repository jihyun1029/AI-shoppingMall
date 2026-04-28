# Studio Line — 여성 패션 쇼핑몰 포트폴리오

React + Express 기반의 풀스택 쇼핑몰 포트폴리오 프로젝트입니다.  
여성 패션 상품 100종을 갖춘 커머스 UI와 Agent 기반 AI 챗봇·추천 기능을 구현했습니다.

---

## 주요 기능

| 영역 | 기능 |
|------|------|
| 상품 | 카테고리·서브카테고리 필터, 정렬, 검색 |
| 상품 상세 | 색상·사이즈 선택, 이미지 폴백 처리 |
| 장바구니 | 수량 조절, 총액 계산 |
| 주문 | 주문 완료 페이지, 주문 내역 |
| 회원 | 회원가입 / 로그인 (JWT), 마이페이지 |
| AI 챗봇 | 플로팅 챗봇 패널, 빠른 질문 버튼, 10-Agent 파이프라인 기반 intent 추론, 다중 턴 대화 컨텍스트 유지, 상품별 추천 이유(reason) |
| 추천 | 장바구니 기반 연관 상품 추천 |
| 관리자 | 상품 CRUD (목록·등록·수정), 대시보드 |

---

## 기술 스택

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

## AI 챗봇 아키텍처

사용자 메시지를 10개의 Agent가 순차 처리하는 파이프라인 구조입니다.

```
Intent → Parser → Planner → Weather → BodyType → Style
      → Retrieval → Ranking → Validation → Response
```

| Agent | 역할 |
|-------|------|
| Intent | 메시지 의도 분류 (상품/코디/날씨/장바구니/일반) |
| Parser | 키워드 추출 (카테고리·색상·가격·체형·기온·바지/스커트 구분) |
| Planner | 전략 수립 (hybrid / coordination / weather / cart / general) |
| Weather | 기온 기반 계절·추천 아이템 도출 |
| BodyType | 체형별 보완 코디 힌트 생성 |
| Style | 스타일 슬롯 구성 (상의·하의·신발·가방 조합) |
| Retrieval | MongoDB 검색 (슬롯별 격리 필터 적용) |
| Ranking | 조건 일치도·평점 기반 재랭킹 |
| Validation | 슬롯별 결과 검증 및 폴백 처리 |
| Response | 누적 컨텍스트 반영 자연어 응답 생성 |

**다중 턴 대화 컨텍스트**  
`lastContext`를 프론트엔드에서 세션 단위로 유지하며 매 요청에 전달합니다.  
후속 질문을 자동 감지해 이전 조건(기온·바지 필터·체형 등)을 누적·병합합니다.

---

## 시작하기

### Docker로 실행 (권장)

```bash
docker compose up --build
```

브라우저에서 http://localhost:8080 접속

> MongoDB 컨테이너 (`mongo`)가 healthy 상태가 된 뒤 API 서버가 시작됩니다.

**Docker에서 챗봇·API가 안 될 때**

- 프론트는 **같은 주소의** `/api/...`(상대 경로)로 호출합니다. `web` 이미지 빌드 시 `VITE_API_URL`을 비워 두므로, 브라우저는 `http://(접속한 호스트):8080/api/...` → Nginx → `api:4000` 으로 전달됩니다.
- **절대** 빌드에 `VITE_API_URL=http://localhost:4000` 처럼 넣지 마세요. 다른 PC나 `http://192.168.x.x:8080`으로 접속하면 브라우저의 `localhost`는 그 PC 자신을 가리켜 API가 열리지 않습니다.
- LAN IP로 접속하면서 API를 **직접** `:4000`에 붙이는 설정을 쓰는 경우에만, `api` 서비스의 `CORS_ORIGIN`에 해당 Origin을 추가하세요. (`docker-compose.yml` 주석 참고)

### 로컬 개발 서버

```bash
# 의존성 설치
npm install
cd server && npm install && cd ..

# MongoDB 실행 (Docker 또는 로컬 설치)
docker compose up mongo -d

# 프론트 + 백 동시 실행
npm run dev:all
```

- 프론트엔드: http://localhost:5173  
- API 서버: http://localhost:4000

---

## 관리자 계정

| 항목 | 값 |
|------|----|
| 이메일 | admin@studio-line.com |
| 비밀번호 | admin1234 |

---

## 프로젝트 구조

```
shopping-mall/
├── src/                  # React 프론트엔드
│   ├── pages/            # 라우트별 페이지 컴포넌트
│   ├── components/       # 공통 UI 컴포넌트
│   │   ├── chatbot/      # AI 챗봇 패널 (ChatbotPanel, ChatbotHeader)
│   │   ├── recommendation/ # 상품 추천
│   │   └── admin/        # 관리자 UI
│   ├── context/          # React Context (장바구니·인증·챗봇)
│   ├── hooks/            # 커스텀 훅
│   ├── services/         # API 호출 함수
│   └── utils/            # 이미지 폴백 등 유틸
├── server/
│   ├── src/
│   │   ├── agents/       # 10개 Agent 모듈 (intent/parser/planner/…/response)
│   │   ├── chatbot/      # keyword parser, intent classifier, search/ranking service
│   │   ├── services/     # chatbotWorkflow 오케스트레이터
│   │   └── routes/       # Express 라우터
│   └── data/             # 시드 데이터
├── public/images/        # 상품 이미지 (JPG)
├── docker/               # Dockerfile (api / web)
└── docker-compose.yml
```

---

## 환경 변수

`.env.example`을 복사해 `.env`를 생성하세요.

```bash
cp .env.example .env
cp server/.env.example server/.env
```

| 변수 | 설명 |
|------|------|
| `JWT_SECRET` | JWT 서명 키 |
| `MONGODB_URI` | MongoDB 연결 URI (기본: `mongodb://localhost:27017/shopping-mall`) |
| `CORS_ORIGIN` | 허용할 Origin (쉼표 구분) |

---

## AI 챗봇 질의 예시

**단일 질문**
- `베이지 슬랙스 추천해줘` → 상품 필터 + 상품별 추천 이유
- `통통한 체형인데 코디 추천해줘` → 체형 보완 코디 설명
- `23도의 날씨인데 추천룩은?` → 기온대별 코디·상품 추천
- `장바구니에 담은 옷에 어울리는 코디 추천` → 장바구니 연관 추천

**다중 턴 (누적 컨텍스트)**
- `23도 날씨 코디 추천해줘` → `바지도 추천해줘` → `통통한 체형 코디는?`  
  → 기온 23도 + 바지 필터 + 체형 커버 조건이 모두 누적되어 반영됨

---

## Docker 트러블슈팅

- 코드 수정 후 반영이 안 보이면: `docker compose up --build`
- BuildKit snapshot 에러(`parent snapshot ... does not exist`)가 나면:

```bash
docker builder prune -af
docker compose build --no-cache
docker compose up
```

- MongoDB 연결 실패 시 (`ECONNREFUSED 127.0.0.1:27017`):  
  `docker compose up mongo -d` 로 MongoDB를 먼저 실행하세요.
