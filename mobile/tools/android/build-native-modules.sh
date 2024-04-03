#!/bin/bash

set -eEu -o pipefail
shopt -s extdebug
IFS=$'\n\t'
trap 'onFailure $?' ERR

function onFailure() {
  echo "Unhandled script error $1 at ${BASH_SOURCE[0]}:${BASH_LINENO[0]}" >&2
  exit 1
}

declare -a archs=(
  "armeabi-v7a"
  "arm64-v8a"

)

cd android;
if [ -f ./gradlew ]
then
  GRADLE_EXEC="./gradlew"
else
  GRADLE_EXEC="gradle"
fi
echo $GRADLE_EXEC;
for arch in "${archs[@]}"
do
  echo "Building native modules for $arch...";
  NODEJS_MOBILE_BUILD_NATIVE_MODULES=1 $GRADLE_EXEC nodejs-mobile-react-native:GenerateNodeNativeAssetsLists$arch -PreactNativeArchitectures=$arch
done
cd ..;