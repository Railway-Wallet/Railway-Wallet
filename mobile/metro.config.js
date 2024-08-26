const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const exclusionList = require('metro-config/src/defaults/exclusionList');
const extraNodeModules = require('node-libs-react-native');

const config = {
  resolver: {
    extraNodeModules: {
      ...extraNodeModules,
      crypto: require.resolve('react-native-crypto'),
    },
    blacklistRE: exclusionList([
      /\/nodejs-assets\/.*/,
      /\/nodejs-src\/.*/,
      /\/android\/.*/,
      /\/ios\/.*/,
    ]),
  },
  server: {
    rewriteRequestUrl: url => {
      if (!url.endsWith('.bundle')) {
        return url;
      }
      return (url + '?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true');
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
