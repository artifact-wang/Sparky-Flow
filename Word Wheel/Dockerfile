# Word Wheel - static site served by nginx
FROM nginx:alpine

# Cloud Run expects PORT 8080
RUN sed -i 's/listen\s*80;/listen 8080;/' /etc/nginx/conf.d/default.conf \
  && sed -i 's/listen\s*\[::\]:80;/listen [::]:8080;/' /etc/nginx/conf.d/default.conf

# Copy app files
WORKDIR /usr/share/nginx/html
COPY index.html .
COPY src ./src

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
