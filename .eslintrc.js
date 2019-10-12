/* eslint-env node */

module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:node/recommended',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
  },
  globals: {
    process: false,
  },
  overrides: [
    {
      files: ['**/*.ts'],
      rules: {},
    },
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'dot-notation': 'error',
    eqeqeq: ['error', 'allow-null'],
    'no-console': 'warn',
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-implicit-coercion': [
      'error',
      {
        string: true,
        boolean: false,
        number: false,
      },
    ],
    'no-multi-str': 'error',
    'no-use-before-define': 'error',
    'no-with': 'error',
    'node/no-missing-import': [
      'error',
      {
        tryExtensions: ['.js', '.json', '.node', '.ts'],
      },
    ],
    'node/no-unsupported-features/es-syntax': [
      'error',
      {
        ignores: ['modules'],
      },
    ],
    'object-shorthand': ['error', 'always'],
    'one-var': ['error', 'never'],
    'spaced-comment': ['error', 'always', { block: { balanced: true } }],
  },
};
