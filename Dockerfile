FROM docker.io/library/node:20-alpine AS builder
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
RUN node_modules/.bin/tsc


FROM docker.io/library/node:20-alpine AS packages
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --omit=dev


FROM docker.io/library/node:20-alpine
ENV NODE_ENV=production
RUN apk upgrade --no-cache \
    && apk --no-cache add git

WORKDIR /app
ENV TZ=Europe/Berlin
VOLUME /app/eventfiles
VOLUME /app/mensa-data
VOLUME /app/userconfig

COPY package.json ./
COPY --from=packages /build/node_modules ./node_modules
COPY locales locales
COPY --from=builder /build/dist ./

ENTRYPOINT ["node", "--enable-source-maps"]
CMD ["hawhh-calendarbot-telegrambot.js"]
