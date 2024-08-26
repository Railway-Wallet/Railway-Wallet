module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
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
