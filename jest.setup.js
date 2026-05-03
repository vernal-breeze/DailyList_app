// Mock import.meta for Vite in Jest
// This must be loaded before any module that uses import.meta
const originalError = console.error;

Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_BASE_URL: 'http://localhost:8000/api',
      },
    },
  },
  writable: true,
  configurable: true,
});

// jest-dom 扩展在 setupFiles 中不可用（expect 未定义）。
// `toBeInTheDocument` 等匹配器通过测试内建的 document.body.contains 来模拟。

// Suppress console.error from import.meta warnings
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('import.meta')) return;
  originalError.apply(console, args);
};
