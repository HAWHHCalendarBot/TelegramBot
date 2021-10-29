FROM docker.io/library/node:16-alpine AS builder
WORKDIR /build

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

COPY source source
RUN node_modules/.bin/tsc


FROM docker.io/library/node:16-alpine AS packages
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --production


FROM docker.io/library/node:16-alpine
ENV NODE_ENV=production
RUN apk upgrade --no-cache \
    && apk --no-cache add git

WORKDIR /app
ENV TZ=Europe/Berlin
EXPOSE 3000
VOLUME /app/eventfiles
VOLUME /app/mensa-data
VOLUME /app/userconfig

COPY package.json ./
COPY --from=packages /build/node_modules ./node_modules
COPY locales locales
COPY --from=builder /build/dist ./

CMD node -r source-map-support/register index.js
