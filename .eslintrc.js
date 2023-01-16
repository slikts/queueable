module.exports = {
  root: true,
  overrides: [
    {
      files: ['src/**/*.ts'],
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    },
    {
      files: ['src/**/*.spec.ts'],
      extends: ['plugin:jest/recommended'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
};
