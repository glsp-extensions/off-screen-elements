FROM node:16.16.0-alpine3.15

WORKDIR /usr/src/app/client

COPY . ./

RUN yarn install


FROM nginx:1.22.0-alpine

WORKDIR /usr/src/app/client

COPY --from=0 /usr/src/app/client ./
COPY ./.docker/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080