module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
    mocha: true,
  },
  extends: [
    'airbnb-base',
    'eslint:recommended',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  globals: {
    Optional: 'readonly',
    MapType: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.test.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'no-console': 1,
    'arrow-body-style': 0,
    'import/extensions': 0,
    'no-unused-vars': 1,
    'no-use-before-define': 0,
    'import/prefer-default-export': 0,
    'import/no-unresolved': 0,
    'no-restricted-syntax': 0,
    'no-shadow': 0,
    'eslintimport/order': 0,
    'import/order': 0,
    'import/no-duplicates': 1,
    'import/no-default-export': 2,
    '@typescript-eslint/no-floating-promises': 2,
    '@typescript-eslint/ban-ts-comment': 1,
    '@typescript-eslint/no-empty-function': 0,
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 0,
    '@typescript-eslint/no-unsafe-argument': 0,
    '@typescript-eslint/no-unsafe-assignment': 0,
    'eslint-comments/no-unused-disable': 0,
    '@typescript-eslint/no-duplicate-enum-values': 1,
    'no-warning-comments': 1,
  },
};
