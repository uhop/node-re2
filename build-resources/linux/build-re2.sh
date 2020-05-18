#! /bin/bash

NODE_VERSION=$1
if [ "$NODE_VERSION" = "10" ]; then
  DOCKER_IMAGE="kobelb/build-node-re2-centos6:alpha-1"
else
  DOCKER_IMAGE="kobelb/build-node-re2-centos7:alpha-1"
fi
echo "Building for Node $NODE_VERSION using $DOCKER_IMAGE"
rm -f ./binding/*
rm -rf ./build
docker pull $DOCKER_IMAGE
docker run -t --name build --mount type=bind,source="$(pwd)",destination=/opt/app-root/node-re2 $DOCKER_IMAGE /bin/bash -c "cp -r ./node-re2 ./tmp; cd ./tmp; nvm use $NODE_VERSION; npm install --build-from-source --fallback-to-build=false"
docker cp build:/opt/app-root/tmp/binding/re2.node ./binding/
docker rm -f build
