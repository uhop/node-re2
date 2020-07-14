#!/bin/sh

npm config set unsafe-perm true
npm ci
npm run build --if-present
npm test
npm run save-to-github
