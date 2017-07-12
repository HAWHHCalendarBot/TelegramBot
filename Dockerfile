FROM node:8-alpine
WORKDIR /app
VOLUME /app/eventfiles
VOLUME /app/userconfig
VOLUME /app/tmp

ENV NODE_ENV=production
ADD package.json /app
RUN npm install

ADD . /app
CMD ["npm", "start"]
