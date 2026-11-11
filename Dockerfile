# Production image for the IELTS Wiz SPA (ielts-wiz.com + student.ielts-wiz.com).
# Built by Coolify on the Contabo VPS; REACT_APP_* values arrive as build args.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY
ARG REACT_APP_GOOGLE_CLIENT_ID
ARG REACT_APP_DESMOS_API_KEY
ARG REACT_APP_MAINTENANCE_MODE
ARG REACT_APP_MAINTENANCE_BYPASS_TOKEN
ENV CI=true GENERATE_SOURCEMAP=false
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
