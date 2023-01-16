module.exports = {
  testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  globals: {
    'ts-jest': {
      diagnostics: true,
    },
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/test/', '/rollup.config.ts', '/src/index.ts'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts'],
  watchPathIgnorePatterns: ['dist', 'docs', 'node_modules'],
};
