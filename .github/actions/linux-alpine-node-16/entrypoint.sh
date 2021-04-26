#!/bin/sh

npm config set unsafe-perm true
export DEVELOPMENT_SKIP_GETTING_ASSET=true
npm i
npm run build --if-present
npm test
npm run save-to-github
