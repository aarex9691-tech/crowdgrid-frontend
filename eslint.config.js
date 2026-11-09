import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // e2e/ is a separate Node package (Playwright tests) with its own settings
  globalIgnores(['dist', 'e2e']),
  // Build tool config runs in Node, not the browser
  {
    files: ['vite.config.js', 'postcss.config.js', 'tailwind.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Screens load their data in an effect (fetch -> setState); keep this visible but non-blocking
      'react-hooks/set-state-in-effect': 'warn',
      // Only affects hot reload of files that also export helpers
      'react-refresh/only-export-components': 'warn',
    },
  },
])
