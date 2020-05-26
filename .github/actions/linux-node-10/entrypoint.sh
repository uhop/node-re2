#!/bin/sh -l

echo "$GITHUB_REPOSITORY - $GITHUB_REF"
[ -z "$GITHUB_TOKEN" ] && echo "GITHUB_TOKEN is set" || echo "GITHUB_TOKEN is NOT set"

npm ci
npm run build --if-present
npm test
npm run create-binary-asset
