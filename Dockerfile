# ── Stage 1: Build ──────────────────────────────────────────
FROM node:22-alpine AS build
ARG VITE_APP_RELEASE=dev
ARG VITE_TELEMETRY_ENDPOINT=
ENV VITE_APP_RELEASE=$VITE_APP_RELEASE
ENV VITE_TELEMETRY_ENDPOINT=$VITE_TELEMETRY_ENDPOINT
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────────
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*

# Copy Vite build output (content-hashed assets)
COPY --from=build /app/dist ./
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
