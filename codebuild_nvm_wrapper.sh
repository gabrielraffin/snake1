##
# https://gist.github.com/sandfox/e6154fd1058b7cbb3653aaeb9c4336d4
# You must source this file from the buildspec.yml
# for it to work properly
# Assumes you have a copy of nvm.sh in the root folder
##

#curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
#export NVM_DIR="$HOME/.nvm"
#[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
# nvm install node npm

NVM_DIR="$HOME/.nvm"
mkdir -p $NVM_DIR
cd $(mktemp -d) 
. $CODEBUILD_SRC_DIR/nvm.sh 
cd $CODEBUILD_SRC_DIR 
nvm install

npm ci
npm run build
