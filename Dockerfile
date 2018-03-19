FROM node:9-alpine
WORKDIR /app
VOLUME /app/additionalEvents
VOLUME /app/eventfiles
VOLUME /app/meals
VOLUME /app/tmp
VOLUME /app/userconfig

ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm install

COPY . ./
CMD ["npm", "start"]
