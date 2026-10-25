# ============================================================================
# ThaparElectiveAI Frontend — Multi-Stage Production Dockerfile (Nginx Alpine)
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL="https://thapar-elective-backend.onrender.com/api/v1"
ARG VITE_INSTITUTION_NAME="Thapar Institute of Engineering & Technology (TIET)"
ARG VITE_INSTITUTION_DOMAIN="thapar.edu"
ARG VITE_CURRICULUM_SCHEME_YEAR="2026"

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_INSTITUTION_NAME=$VITE_INSTITUTION_NAME
ENV VITE_INSTITUTION_DOMAIN=$VITE_INSTITUTION_DOMAIN
ENV VITE_CURRICULUM_SCHEME_YEAR=$VITE_CURRICULUM_SCHEME_YEAR

COPY package.json ./
RUN npm install

COPY tsconfig.json tsconfig.node.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY src ./src

RUN npm run build

# ----------------------------------------------------------------------------
# Production Nginx Web Server Stage (with SPA routing & gzip)
# ----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
