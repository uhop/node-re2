#! /bin/bash

docker build -t kobelb/build-node-re2 .
(cd ../../ && docker run --rm -v "$(pwd)"://opt/app-root/src/node-re2 kobelb/build-node-re2:latest yarn)
