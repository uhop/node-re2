#!/bin/sh -l

ldd --version

echo "$HOME - $GITHUB_REPOSITORY - $GITHUB_REF"
[ ! -z "$GITHUB_TOKEN" ] && echo "GITHUB_TOKEN is set" || echo "GITHUB_TOKEN is NOT set"

ls $HOME

# npm ci
# npm run build --if-present
# npm test
# npm run create-binary-asset
