module.exports = {
  env: {
    browser: true,
    node: true,
    es2024: true
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    'no-underscore-dangle': 'off',
    'no-param-reassign': ['error', { props: false }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'linebreak-style': 'off',
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }]
  },
  overrides: [
    {
      files: ['src/server/**/*.js'],
      rules: {
        'import/no-extraneous-dependencies': 'off'
      }
    }
  ]
};
