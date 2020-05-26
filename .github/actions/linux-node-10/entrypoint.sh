#!/bin/sh -l

echo "$HOME - $GITHUB_WORKSPACE - $1"

ls $HOME
ls $GITHUB_WORKSPACE

echo "Done"

NVM_DIR=$HOME/.nvm
PATH=$HOME/src/bin:$HOME/bin:$PATH

curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install $1

npm ci
npm run build --if-present
npm test
npm run create-binary-asset
