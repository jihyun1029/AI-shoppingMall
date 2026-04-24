# Studio Line — 여성 패션 쇼핑몰 포트폴리오

React + Express 기반의 풀스택 쇼핑몰 포트폴리오 프로젝트입니다.  
여성 패션 상품 100종을 갖춘 커머스 UI와 AI 챗봇·추천 기능을 구현했습니다.

---

## 주요 기능

| 영역 | 기능 |
|------|------|
| 상품 | 카테고리·서브카테고리 필터, 정렬, 검색 |
| 상품 상세 | 색상·사이즈 선택, 이미지 폴백 처리 |
| 장바구니 | 수량 조절, 총액 계산 |
| 주문 | 주문 완료 페이지, 주문 내역 |
| 회원 | 회원가입 / 로그인 (JWT), 마이페이지 |
| AI 챗봇 | 플로팅 챗봇 패널, 빠른 질문 버튼, intent 기반 추천(상품/코디/장바구니/날씨), 상품별 추천 이유(reason) |
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
- better-sqlite3 (SQLite)
- JWT 인증 (jsonwebtoken · bcryptjs)

**인프라**
- Docker Compose (API 컨테이너 + Nginx 정적 서빙)
- SQLite named volume (`sqlite_data`)

---

## 시작하기

### Docker로 실행 (권장)

```bash
docker compose up --build
```

브라우저에서 http://localhost:8080 접속

**Docker에서 챗봇·API가 안 될 때**

- 프론트는 **같은 주소의** `/api/...`(상대 경로)로 호출합니다. `web` 이미지 빌드 시 `VITE_API_URL`을 비워 두므로, 브라우저는 `http://(접속한 호스트):8080/api/...` → Nginx → `api:4000` 으로 전달됩니다.
- **절대** 빌드에 `VITE_API_URL=http://localhost:4000` 처럼 넣지 마세요. 다른 PC나 `http://192.168.x.x:8080`으로 접속하면 브라우저의 `localhost`는 그 PC 자신을 가리켜 API가 열리지 않습니다.
- LAN IP로 접속하면서 API를 **직접** `:4000`에 붙이는 설정을 쓰는 경우에만, `api` 서비스의 `CORS_ORIGIN`에 해당 Origin을 추가하세요. (`docker-compose.yml` 주석 참고)

### 로컬 개발 서버

```bash
# 의존성 설치
npm install
cd server && npm install && cd ..

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
│   │   ├── chatbot/      # AI 챗봇 패널
│   │   ├── recommendation/ # 상품 추천
│   │   └── admin/        # 관리자 UI
│   ├── context/          # React Context (장바구니·인증)
│   ├── hooks/            # 커스텀 훅
│   ├── services/         # API 호출 함수
│   └── utils/            # 이미지 폴백 등 유틸
├── server/
│   ├── src/              # Express API 서버
│   └── data/             # SQLite DB · 시드 데이터
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
| `DATABASE_PATH` | SQLite DB 파일 경로 |
| `CORS_ORIGIN` | 허용할 Origin (쉼표 구분) |

---

## AI 챗봇 질의 예시

- `베이지 슬랙스 추천해줘` → `PRODUCT_RECOMMEND` (상품 필터 + 상품별 reason)
- `통통한 체형인데 코디 추천해줘` → `COORDINATION_RECOMMEND` (체형 보완 코디 설명)
- `23도의 날씨인데 추천룩은?` → `WEATHER_COORDINATION` (기온대별 코디/상품 추천)
- `장바구니에 담은 옷에 어울리는 코디 추천` → `CART_RECOMMEND`

---

## Docker 트러블슈팅

- 코드 수정 후 반영이 안 보이면: `docker compose up --build`
- BuildKit snapshot 에러(`parent snapshot ... does not exist`)가 나면:

```bash
docker builder prune -af
docker compose build --no-cache
docker compose up
```
