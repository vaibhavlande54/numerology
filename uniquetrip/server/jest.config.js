module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  verbose: true,
  collectCoverage: false,
  coverageDirectory: 'coverage',
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    '*.js',
    '!coverage/**',
    '!node_modules/**'
  ]
};
