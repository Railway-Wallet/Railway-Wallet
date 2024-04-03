module.exports = {
  root: true,
  plugins: ['flowtype', 'react-native', 'import', 'simple-import-sort'],
  extends: [
    '@react-native-community',
    'eslint:recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  globals: {
    Optional: 'readonly',
    MapType: 'readonly',
    NodeJS: 'readonly',
    Response: 'readonly',
    Buffer: 'readonly',
    JSX: 'readonly',
    self: 'readonly',
  },
  rules: {
    'no-unused-vars': 0,
    'no-console': 1,
    '@typescript-eslint/no-unused-vars': 1,
    'no-shadow': 0,
    '@typescript-eslint/switch-exhaustiveness-check': 2,
    '@typescript-eslint/no-shadow': 0,
    'require-await': 0,
    '@typescript-eslint/no-explicit-any': 1,
    'import/no-duplicates': 1,
    'import/no-default-export': 2,
    '@typescript-eslint/no-floating-promises': 2,
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 0,
    '@typescript-eslint/no-unsafe-argument': 0,
    '@typescript-eslint/no-unsafe-assignment': 0,
    '@typescript-eslint/no-non-null-assertion': 2,
    '@typescript-eslint/no-duplicate-enum-values': 1,
    'no-warning-comments': 1,
    'eslint-comments/no-unlimited-disable': 0,
    'simple-import-sort/imports': [
      'warn',
      {
        groups: [
          [
            '^@railgun',
            '^react',
            `^[a-zA-Z]\\w*(?<!@|\\.\\.?\\/\\.?)$`,
            '^@?\\w',
            `^\\.+\\/`,
            `^\\.\\/`,
            'styles'
          ],
        ],
      },
    ],
    'simple-import-sort/exports': 'warn',
    'jest/valid-expect': [
      'error',
      {
        maxArgs: 2,
      },
    ],
    '@typescript-eslint/strict-boolean-expressions': 2,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    warnOnUnsupportedTypeScriptVersion: false,
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  overrides: [
    {
      files: ['**/__tests__/**', './src/tests/**'],
      rules: {
        'require-await': 0,
        '@typescript-eslint/no-explicit-any': 0,
        '@typescript-eslint/no-floating-promises': 0,
        '@typescript-eslint/no-unsafe-call': 0,
      },
    },
  ],
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@assets', './src/assets/'],
          ['@hooks', './src/hooks/'],
          ['@models', './src/models/'],
          ['@root', './src/root/'],
          ['@services', './src/services/'],
          ['@utils', './src/utils/'],
          ['@views', './src/views/'],
          ['@shared', './src/shared/'],
          ['@react-shared', './src/react-shared/src/index'],
          ['@components', './src/views/components/'],
          ['@screens', './src/views/screens/'],
        ],
        extensions: ['.js', '.ts', '.tsx', '.json'],
      },
    },
  },
};
