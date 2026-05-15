FROM docker.io/library/alpine:3.23 AS packages
RUN apk upgrade --no-cache \
	&& apk add --no-cache npm
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --no-update-notifier --omit=dev


FROM docker.io/library/alpine:3.23 AS final
RUN apk upgrade --no-cache \
	&& apk add --no-cache nodejs git \
	&& addgroup -S -g 923 runner \
	&& adduser -S -D -u 923 -G runner runner \
	&& rm -f -- /etc/*-

WORKDIR /app
ENV NODE_ENV=production
ENV TZ=Europe/Berlin
VOLUME /app/eventfiles
VOLUME /app/mensa-data
VOLUME /app/userconfig

COPY package.json ./
COPY --from=packages /build/node_modules ./node_modules
COPY locales locales
COPY source ./

USER runner
ENTRYPOINT ["node", "--enable-source-maps"]
CMD ["hawhh-calendarbot-telegrambot.ts"]
