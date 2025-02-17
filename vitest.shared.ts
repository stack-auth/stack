import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.test.{js,ts,jsx,tsx}'],
    includeSource: ['**/*.{js,ts,jsx,tsx}'], 
  },
})
