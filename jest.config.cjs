module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
      diagnostics: {
        ignoreCodes: [1343],
      },
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  collectCoverage: true,
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/src/main.tsx',
    '/src/vite-env.d.ts',
    '/src/lib/utils.ts',
    '/src/api/client.ts',
    '/src/api/taskApi.ts',
  ],
  moduleNameMapper: {
    // Mock API modules to avoid import.meta in client.ts
    '\\./api/taskApi$': '<rootDir>/src/api/__mocks__/taskApi.ts',
    '\\.\\/api/taskApi$': '<rootDir>/src/api/__mocks__/taskApi.ts',
    '../api/taskApi': '<rootDir>/src/api/__mocks__/taskApi.ts',
    '../../api/taskApi': '<rootDir>/src/api/__mocks__/taskApi.ts',
    '@/api/taskApi': '<rootDir>/src/api/__mocks__/taskApi.ts',
    '@/api/client': '<rootDir>/src/api/__mocks__/client.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['./jest.setup.js'],
};
