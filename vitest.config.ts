import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/__tests__/**/*.test.ts'],
    environment: 'node',
    // タイムゾーン依存のバグを検出するため、テストは常にUTCで実行する
    env: {
      TZ: 'UTC',
    },
  },
});
