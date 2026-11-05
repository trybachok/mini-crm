# Этап 1: сборка статики.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Публичные параметры Supabase вшиваются в бандл на этапе сборки.
# Это не секреты: anon key виден в браузере, доступ ограничивает RLS.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
RUN npm run build

# Этап 2: раздача статики.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
