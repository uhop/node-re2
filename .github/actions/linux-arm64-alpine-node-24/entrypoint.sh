#!/bin/sh

set -e

export USERNAME=`whoami`
export DEVELOPMENT_SKIP_GETTING_ASSET=true
npm i
npm run build --if-present
npm test
npm run save-to-github
