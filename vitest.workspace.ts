import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/*',
  'apps/*',
  'examples/*',
  'docs',
  {
    test: {
      include: ['**/*.test.ts'],
      includeSource: ['**/*.{js,ts,jsx,tsx}'],
      name: 'unit-tests',
    },
  },
]);
