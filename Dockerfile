FROM node:8-alpine
WORKDIR /app
VOLUME /app/changes
VOLUME /app/eventfiles
VOLUME /app/meals
VOLUME /app/tmp
VOLUME /app/userconfig

ENV NODE_ENV=production
ADD package.json /app
RUN npm install

ADD . /app
CMD ["npm", "start"]
