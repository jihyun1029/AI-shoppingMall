# 프론트: Vite 빌드 → nginx ( /api 는 compose에서 api 서비스로 프록시 )
FROM node:22-bookworm-slim AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY index.html vite.config.js eslint.config.js ./
COPY public ./public
COPY src ./src

# Docker: 브라우저는 항상 Nginx(예: :8080)와 동일 출처 → 상대 경로 `/api` 사용 (nginx → api:4000)
# 절대 URL로 localhost:4000을 넣으면 LAN/IP 접속 시 챗봇·API가 동작하지 않습니다.
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
