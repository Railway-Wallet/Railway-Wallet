const exclusionList = require('metro-config/src/defaults/exclusionList');
const extraNodeModules = require('node-libs-react-native');

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
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
