#!/bin/sh -l

echo "$HOME - $GITHUB_WORKSPACE - $1"

pwd

echo "Home"
ls $HOME

echo "Workspace"
ls $GITHUB_WORKSPACE

echo "Done"

NVM_DIR=$HOME/.nvm
PATH=$HOME/src/bin:$HOME/bin:$PATH

curl -sS -o- https://raw.githubusercontent.com/creationix/nvm/v0.35.3/install.sh | bash
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install $1

cd $GITHUB_WORKSPACE

npm ci
npm run build --if-present
npm test
npm run create-binary-asset
