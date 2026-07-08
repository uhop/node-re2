FROM node:26-trixie

RUN apt install python3 make gcc g++ binutils # binutils: entrypoint strips the artifact

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
