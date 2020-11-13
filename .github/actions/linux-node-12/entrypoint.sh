#!/bin/bash -l

NVM_DIR=$HOME/.nvm

curl -sS -o- https://raw.githubusercontent.com/creationix/nvm/v0.35.3/install.sh | bash
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install --no-progress $1

npm config set unsafe-perm true
export DEVELOPMENT_SKIP_GETTING_ASSET=true
npm i
npm run build --if-present
npm test
npm run save-to-github
