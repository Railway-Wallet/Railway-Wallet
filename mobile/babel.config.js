module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    '@babel/plugin-proposal-logical-assignment-operators',
    '@babel/plugin-transform-flow-strip-types',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-private-methods',
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@assets': './src/assets/',
          '@hooks': './src/hooks/',
          '@models': './src/models/',
          '@root': './src/root/',
          '@services': './src/services/',
          '@utils': './src/utils/',
          '@views': './src/views/',
          '@shared': './src/shared/',
          '@react-shared': './src/react-shared/src/index',
          '@components': './src/views/components/',
          '@screens': './src/views/screens/',
        },
      },
    ],
  ],
};
