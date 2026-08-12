# ==================================================
# Notification Platform - Frontend (Production)
# ==================================================

# --------------------------------------------------
# Build Stage
# --------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

ENV VITE_API_URL=/api/v1
ENV NODE_ENV=production

RUN npm run build

# --------------------------------------------------
# Production Stage — serve static files with nginx
# --------------------------------------------------
FROM nginx:stable-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf

COPY frontend-nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
