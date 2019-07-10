FROM node:12-alpine
WORKDIR /app
VOLUME /app/eventfiles
VOLUME /app/meals
VOLUME /app/tmp
VOLUME /app/userconfig

ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci

COPY . ./
CMD node index.js
