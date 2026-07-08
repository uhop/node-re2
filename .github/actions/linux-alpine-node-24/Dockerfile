FROM node:24-alpine

RUN apk add --no-cache python3 make gcc g++ linux-headers binutils # binutils: entrypoint strips the artifact

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
