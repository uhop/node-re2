#! /bin/bash

PACKAGE_VERSION=$(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]')
echo "Building archives for $PACKAGE_VERSION"
docker pull kobelb/build-node-re2:alpha-3
docker run -t --name build --mount type=bind,source="$TRAVIS_BUILD_DIR",destination=/opt/app-root/src/node-re2 kobelb/build-node-re2:alpha-3 /bin/bash -c "cp -r ./node-re2 ./tmp; cd ./tmp; npm install"
mkdir -p ./target/
docker cp build:/opt/app-root/src/tmp/build/Release/re2.node ./target/
