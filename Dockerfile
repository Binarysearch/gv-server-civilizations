FROM node:10

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY ./src/ ./src/
COPY ./tsconfig.json ./tsconfig.json


RUN npm run build


EXPOSE 3001

CMD [ "node", "./dist/index.js" ]