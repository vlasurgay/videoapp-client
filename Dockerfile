FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build -- --configuration production \
 && if [ -d dist/videoapp-client/browser ]; then \
      cp -r dist/videoapp-client/browser /out; \
    else \
      cp -r dist/videoapp-client /out; \
    fi

FROM nginx:alpine as videoapp-client

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /out /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1