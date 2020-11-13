FROM node:15-alpine

RUN apk add --no-cache python make gcc g++

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
