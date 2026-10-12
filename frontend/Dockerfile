FROM node:20-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .

# BACKEND_URL is read by next.config.mjs at request time for the /api proxy,
# so it does not need to be present at build time.
RUN npm run build && npm prune --omit=dev

EXPOSE 3000
CMD ["npm", "start"]
