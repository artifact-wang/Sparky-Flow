# Serve Word Wheel static site on Cloud Run
FROM python:3.11-slim
WORKDIR /app
COPY . .
EXPOSE 8080
CMD python3 -c "import http.server, os; http.server.test(HandlerClass=http.server.SimpleHTTPRequestHandler, port=int(os.environ.get('PORT', 8080)))"
