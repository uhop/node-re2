FROM node:12-alpine3.9

RUN apk add --no-cache python make gcc g++

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
