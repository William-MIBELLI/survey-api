FROM node:lts-alpine AS base

RUN mkdir /app
WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm install 
# COPY . .
EXPOSE 3000
# RUN apk --update --no-cache add curl

COPY src src
COPY tsconfig.json .
COPY jest.config.js .
COPY __tests__ __tests__
COPY .env .env

FROM base AS production

ENV NODE_PATH=;/build

RUN npm run build

# ENTRYPOINT ["npm", "run", "build"]
