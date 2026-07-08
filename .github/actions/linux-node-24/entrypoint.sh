#!/bin/sh

set -e

export USERNAME=`whoami`
export DEVELOPMENT_SKIP_GETTING_ASSET=true
npm i
npm run build --if-present
# must precede tests: the suite validates the shipped binary
strip --strip-unneeded build/Release/re2.node
npm test
npm run save-to-github
