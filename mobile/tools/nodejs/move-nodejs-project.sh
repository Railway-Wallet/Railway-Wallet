#!/bin/bash

set -eEu -o pipefail
shopt -s extdebug
IFS=$'\n\t'
trap 'onFailure $?' ERR

function onFailure() {
  echo "Unhandled script error $1 at ${BASH_SOURCE[0]}:${BASH_LINENO[0]}" >&2
  exit 1
}

ORIG=./nodejs-src/nodejs-project
DEST=./nodejs-assets/nodejs-project

rm -rf $DEST
mkdir -p $DEST

cp -r $ORIG/src $DEST
cp -r $ORIG/patches $DEST
cp $ORIG/package.json $DEST
if [ -f $ORIG/yarn.lock ]; then
  cp $ORIG/yarn.lock $DEST
fi
cp $ORIG/tsconfig.json $DEST
cp $ORIG/.eslintrc.js $DEST

find "$DEST" -type d -name "__tests__" -prune -exec rm -rf "{}" \;
