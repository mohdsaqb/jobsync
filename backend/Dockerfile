# The embedding model runs in-process, so this image bundles it rather than
# downloading on first request. Build for the host's architecture — on ARM
# (Graviton, Ampere, Apple silicon) pass `--platform linux/arm64`; the
# onnxruntime-node binary ships for both.

# ---- build: compile, and pull down the model files ----
FROM node:20-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY tsconfig.json ./
COPY src ./src

# tsc doesn't emit JSON, so the seed corpus is copied across explicitly.
RUN npm run build \
 && cp -r src/data dist/data \
 && node dist/scripts/prefetchModels.js

# ---- runtime: production deps plus the baked artefacts ----
FROM node:20-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# onnxruntime-node ships prebuilt binaries for every platform it supports;
# only the Linux one can ever run here and the rest are ~250MB.
RUN rm -rf node_modules/onnxruntime-node/bin/napi-v3/darwin \
           node_modules/onnxruntime-node/bin/napi-v3/win32

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/@xenova/transformers/.cache ./node_modules/@xenova/transformers/.cache
COPY --from=build /app/eng.traineddata ./eng.traineddata

# Upload scratch space and runtime bookkeeping (Adzuna budget, sync state).
RUN mkdir -p uploads data

EXPOSE 4000
CMD ["node", "dist/server.js"]
