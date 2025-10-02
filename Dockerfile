FROM node:lts-alpine

RUN mkdir /app
WORKDIR /app

COPY package.json .
RUN npm i 

RUN apk --update --no-cache add curl

COPY src src
COPY tsconfig.json .
COPY jest.config.js .
COPY __tests__ __tests__
COPY .env .env
EXPOSE 3000

ENTRYPOINT ["npm", "run", "dev"]