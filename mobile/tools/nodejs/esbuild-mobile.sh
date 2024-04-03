#!/bin/bash

set -eEu -o pipefail
shopt -s extdebug
IFS=$'\n\t'
trap 'onFailure $?' ERR

function onFailure() {
  echo "Unhandled script error $1 at ${BASH_SOURCE[0]}:${BASH_LINENO[0]}" >&2
  exit 1
}

cd ./nodejs-assets/nodejs-project;

../../node_modules/.bin/esbuild \
  main.js --bundle \
  --platform=node \
  --target=node18 \
  --alias:bindings=bindings-noderify-nodejs-mobile \
  --alias:default-gateway=no-op \
  --alias:@achingbrain/ssdp=no-op \
  --alias:@railgun-community/curve25519-scalarmult-wasm=@railgun-community/curve25519-scalarmult-rsjs \
  --alias:@railgun-community/poseidon-hash-wasm=@railgun-community/poseidon-hash-rsjs \
  --alias:urlpattern-polyfill=urlpattern-polyfill-no-unicode \
  --external:rn-bridge \
  --minify-whitespace \
  --minify-identifiers \
  --outfile=main.js.bundled

rm -rf main.js
mv main.js.bundled main.js

cd ../..;
