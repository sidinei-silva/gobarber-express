FROM node:lts-alpine

RUN apk add --no-cache tzdata

RUN mkdir -p /home/node/api/node_modules && chown -R node:node /home/node/api

WORKDIR /home/node/api

COPY package.json yarn.* ./

USER node

RUN yarn

COPY --chown=node:node . .
COPY src/config/database.docker.js src/config/database.js

EXPOSE 3333

CMD ["yarn", "start", "development"]
