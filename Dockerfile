# 앱 이미지 계약(homelab 공유 차트와 app-build가 기대하는 것):
# - amd64 단일 빌드. app-build가 --platform linux/amd64로 부른다. 아키텍처별 파일을 받아야 하면
#   ARG TARGETARCH를 기본값 없이 선언한다. 기본값이 있으면 그것이 플랫폼 인자를 이긴다.
# - test 단계가 있어야 한다. app-build가 --target test로 시험을 돌린다.
# - 비root uid 65532(공유 차트의 runAsUser와 같다). 루트 파일시스템은 읽기 전용이고 쓰기는 /tmp만 된다.
# 기반 이미지는 digest로 고정하고 Renovate가 올린다.
FROM oven/bun:1.4.4-slim@sha256:1846adf22496bd711036aae8be147e57bdebbaea2e5264e3e0b5af1db187d9a4 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM deps AS test
RUN bun install --frozen-lockfile
COPY . .
RUN bun test

FROM oven/bun:1.4.4-distroless@sha256:153a951ae40106e125898103e6e990ee0f38e6aee7f561029e26cf9fbed23470
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
USER 65532:65532
ENV PORT=8080
EXPOSE 8080
CMD ["src/server.ts"]
