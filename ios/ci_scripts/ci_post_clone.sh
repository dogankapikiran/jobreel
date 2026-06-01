#!/bin/sh

set -e

# Install CocoaPods via gem (more reliable on Xcode Cloud than brew)
sudo gem install cocoapods --no-document

# Install pods
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
pod install
