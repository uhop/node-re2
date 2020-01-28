#! /bin/bash

docker pull kobelb/build-node-re2:alpha-3
docker run -t --name build --mount type=bind,source="$(pwd)",destination=/opt/app-root/src/node-re2 kobelb/build-node-re2:alpha-3 /bin/bash -c "cp -r ./node-re2 ./tmp; cd ./tmp; npm install"
mkdir -p ./target/
docker cp build:/opt/app-root/src/tmp/build/Release/re2.node ./target/
