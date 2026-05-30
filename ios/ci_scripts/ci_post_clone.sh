#!/bin/sh

set -e

# Install Homebrew if not present
if ! command -v brew &>/dev/null; then
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install CocoaPods
brew install cocoapods

# Install pods
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
pod install
