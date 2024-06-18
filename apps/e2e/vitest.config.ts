import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    testTimeout: 20_000,
    globalSetup: './tests/global-setup.ts',
  },
})
