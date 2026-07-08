FROM node:22-bullseye

RUN apt install python3 make gcc g++ binutils # binutils: entrypoint strips the artifact

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
