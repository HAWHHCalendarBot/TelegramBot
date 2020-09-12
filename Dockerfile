FROM node:14-alpine
WORKDIR /build

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

COPY source source
RUN node_modules/.bin/tsc

RUN rm -rf node_modules && \
  npm ci --production && \
  npm i source-map-support


FROM node:14-alpine
WORKDIR /app
VOLUME /app/eventfiles
VOLUME /app/mensa-data
VOLUME /app/tmp
VOLUME /app/userconfig

RUN apk --no-cache add git

ENV NODE_ENV=production

COPY --from=0 /build/node_modules ./node_modules
COPY --from=0 /build/dist ./

CMD node -r source-map-support/register --unhandled-rejections=strict index.js
