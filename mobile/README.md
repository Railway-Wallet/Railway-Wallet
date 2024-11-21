# Railway Mobile

# Setup instructions

## 1. Setup dev environment

Ensure you have Xcode installed, `nvm`, Node.js 18.17.1, yarn, Homebrew, and [other dependencies that React Native needs](https://reactnative.dev/docs/environment-setup). To build native dependencies such as the native-prover, you probably need:

```
brew install ruby
brew install pkg-config
brew install libsodium
brew install gmp
brew install ccache
```

## 2. Setup Rust cross-compilation

Install Rust and Cargo preferably through [Rustup](https://rustup.rs). **NOTE:** use a stable version greater than or equal to `1.67.0`. Then, use Rustup to install cross-compilation support, like this:

```
rustup target add aarch64-apple-ios
rustup target add x86_64-apple-ios
rustup target add aarch64-apple-ios-sim
rustup target add aarch64-linux-android
cargo install nj-cli
```

## 3. (iOS only) M1 Mac: Update Ruby gem dependency

```
gem install --user-install ffi -- --enable-libffi-alloc
```

## 4. Install node modules

1. Run `yarn` in root
2. Run `yarn` in ./nodejs-src/nodejs-project

## 5. (iOS only) iOS setup

If your Xcode build is still failing, you may need to add these contents `ios/.xcode.env.local`:

```
source ~/.nvm/nvm.sh;
nvm install 18.17.1;
```

Then, make sure Pods are installed:

```
cd ios && pod install && cd ..
```

And select a development team in Xcode.

## 6. (Android only) Android setup

- Create `android/keystore.properties`
- Create `android/app/debug.keystore` and/or `android/app/release.keystore`
- Install NDK version 25.2.9519653 (Android SDK Manager)
  If you have no keystore for android, see https://coderwall.com/p/r09hoq/android-generate-release-debug-keystores

# Build the project

- Ensure `python2 --version` and `python3 --version` gives outputs.
- If not, install pyenv, install a python2 and python3 version, run `pyenv global your_python_3_version your_python_2_version`, i.e. `pyenv global 3.11.2 2.7.18`

## Android

- `npm run build-nodejs-android`
- `npx react-native run-android`

## iOS

- `npm run build-nodejs-ios`
- `npx react-native run-ios`

---

# Troubleshooting

## hermes-engine: Command PhaseScriptExecution failed with a nonzero exit code

- Delete xcode.env.local
- pod install


Copyright (C) Right to Privacy Foundation
