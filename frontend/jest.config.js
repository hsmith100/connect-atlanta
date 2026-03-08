const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });
module.exports = createJestConfig({
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  testMatch: ['**/*.test.{ts,tsx}'],
  coverageReporters: ['lcov', 'text-summary'],
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.test.{ts,tsx}',
    '!**/node_modules/**',
  ],
});
