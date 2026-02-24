# Sparkli Trail - React/Vite app, build then serve with nginx
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve static files
FROM nginx:alpine

# Cloud Run expects PORT 8080
RUN sed -i 's/listen\s*80;/listen 8080;/' /etc/nginx/conf.d/default.conf \
  && sed -i 's/listen\s*\[::\]:80;/listen [::]:8080;/' /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist .

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
