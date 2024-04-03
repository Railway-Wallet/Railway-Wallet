#!/bin/bash

set -eEu -o pipefail
shopt -s extdebug
IFS=$'\n\t'
trap 'onFailure $?' ERR

function onFailure() {
  echo "Unhandled script error $1 at ${BASH_SOURCE[0]}:${BASH_LINENO[0]}" >&2
  exit 1
}

DIR="node_modules/leveldown-nodejs-mobile/build/Release";

SRC="tools/android/prebuilds"
DST="nodejs-assets/nodejs-project/node_modules/leveldown-nodejs-mobile/prebuilds"
mkdir -p $DST

if [ -f "$SRC/leveldown-nodejs-mobile-arm64-v8a.node" ]; then
  mkdir -p $DST/android-arm64
  cp $SRC/leveldown-nodejs-mobile-arm64-v8a.node $DST/android-arm64/leveldown.node
fi

if [ -f "$SRC/leveldown-nodejs-mobile-armeabi-v7a.node" ]; then
  mkdir -p $DST/android-arm
  cp $SRC/leveldown-nodejs-mobile-armeabi-v7a.node $DST/android-arm/leveldown.node
fi

if [ -f "$SRC/leveldown-nodejs-mobile-x86_64.node" ]; then
  mkdir -p $DST/android-x64
  cp $SRC/leveldown-nodejs-mobile-x86_64.node $DST/android-x64/leveldown.node
fi

