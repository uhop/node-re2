FROM node:16-alpine

RUN apk add --no-cache python3 make gcc g++ linux-headers

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
