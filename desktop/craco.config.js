const CracoAlias = require('craco-alias');
const webpack = require('webpack');
const {
  addAfterLoader,
  getLoaders,
  removeLoaders,
  loaderByName,
} = require('@craco/craco');

const { EsbuildPlugin } = require('esbuild-loader');

const { log } = console;

module.exports = {
  plugins: [
    {
      plugin: CracoAlias,
      options: {
        source: 'tsconfig',
        baseUrl: './src',
        tsConfigPath: './tsconfig.paths.json',
      },
    },
  ],
  webpack: {
    configure: (config, { env }) => {
      log(`building for env: ${env}`);
      const isDev = env === 'development';
      config.devtool = isDev ? 'source-map' : false;
      log(`devtool: ${config.devtool ?? 'none'}`);
      config.resolve.alias = {
        ...config.resolve.alias,
        '@achingbrain/nat-port-mapper': false,
        '@achingbrain/ssdp': false,
      };
      config.resolve.fallback = {
        url: require.resolve('url'),
        fs: false,
        net: false,
        path: require.resolve('path-browserify'),
        assert: require.resolve('assert'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        buffer: require.resolve('buffer'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        constants: require.resolve('constants-browserify'),
        zlib: require.resolve('browserify-zlib'),
      };

      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        }),
      );

      config.module.rules.push({
        test: /assets\/libs\/snarkjs\.min\.js$/,
        loader: 'exports-loader',
        options: {
          exports: 'default snarkjs',
        },
      });

      const esbuildLoader = {
        test: /\.(cjs|js|mjs|jsx|ts|tsx)$/,
        loader: 'esbuild-loader',
        options: {
          target: 'esnext',
        },
        resolve: {
          fullySpecified: false,
        },
      };
      replaceBabel(config, esbuildLoader);

      config.optimization = {
        splitChunks: {
          chunks: isDev ? 'async' : 'initial',
        },
      };

      return config;
    },
  },
};

const replaceBabel = (config, loader, onlySrc = false) => {
  log(`replacing babel-loader with ${loader.loader}`);
  const { matches } = getLoaders(config, loaderByName('babel-loader'));

  const babelLoader = matches[1];

  const { isAdded } = addAfterLoader(
    config,
    loaderByName('babel-loader'),
    loader,
  );

  if (!isAdded) {
    throw new Error(`${loader.loader} was not added!`);
  }
  log('removing babel-loader');
  const { removedCount } = removeLoaders(config, loaderByName('babel-loader'));
  if (removedCount !== 2)
    throw new Error('had expected to remove 2 babel loader instances');

  if (onlySrc) {
    const index = findLoader(config, loader);
    config.module.rules[1].oneOf.splice(index + 1, 0, babelLoader.loader);
  }
};

const findLoader = (config, loader) => {
  const test = el => el.loader === loader.loader;
  const index = config.module.rules[1].oneOf.findIndex(test);
  return index;
};
