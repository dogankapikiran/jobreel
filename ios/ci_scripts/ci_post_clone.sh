#!/bin/sh

set -e

# node_modules must exist before pod install — Podfile resolves expo/react-native paths via node
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm install

cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
pod install
