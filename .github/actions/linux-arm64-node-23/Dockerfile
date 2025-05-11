FROM --platform=linux/arm64 node:23-bullseye

RUN apt install python3 make gcc g++

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
