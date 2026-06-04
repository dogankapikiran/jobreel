#!/bin/sh

set -e

# Install Node.js via nvm (Xcode Cloud does not include node by default)
export NVM_DIR="$HOME/.nvm"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts

# Install JS dependencies (required by Podfile to resolve expo/react-native paths)
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm install

# Install CocoaPods dependencies (--clean-install prevents stale hermes-engine rsync errors)
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
pod install --clean-install
