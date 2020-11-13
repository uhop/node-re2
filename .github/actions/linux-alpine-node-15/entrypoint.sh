#!/bin/sh

npm config set unsafe-perm true
export DEVELOPMENT_SKIP_GETTING_ASSET=true
npm ci
npm run build --if-present
npm test
npm run save-to-github
