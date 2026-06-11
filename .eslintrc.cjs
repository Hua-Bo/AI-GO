module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: ['alloy', 'alloy/vue', 'alloy/typescript', '.eslintrc-auto-import.json'],
  parser: 'vue-eslint-parser',
  ignorePatterns: ['dist', '.eslintrc.cjs', '*.json'],
  parserOptions: {
    parser: {
      js: '@babel/eslint-parser',
      jsx: '@babel/eslint-parser',
      ts: '@typescript-eslint/parser',
      tsx: '@typescript-eslint/parser',
    },
  },
  rules: {
    // 不关掉这项规则checker会报错
    '@typescript-eslint/consistent-type-assertions': 'off',
    'vue/no-duplicate-attributes': ["error", {"allowCoexistClass": true, "allowCoexistStyle": true}],
    "max-params": ["error", 4]
  },
}
