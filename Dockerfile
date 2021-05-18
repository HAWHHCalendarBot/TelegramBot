FROM docker.io/library/node:14-alpine AS builder
WORKDIR /build

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

COPY source source
RUN node_modules/.bin/tsc


FROM docker.io/library/node:14-alpine AS packages
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --production


FROM docker.io/library/node:14-alpine
WORKDIR /app
VOLUME /app/eventfiles
VOLUME /app/mensa-data
VOLUME /app/tmp
VOLUME /app/userconfig

ENV NODE_ENV=production

RUN apk --no-cache upgrade \
    && apk --no-cache add git

COPY package.json ./
COPY --from=packages /build/node_modules ./node_modules
COPY locales locales
COPY --from=builder /build/dist ./

CMD node --unhandled-rejections=strict -r source-map-support/register index.js
