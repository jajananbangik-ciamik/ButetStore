import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const appsScriptGlobals = {
  CacheService: 'readonly',
  DriveApp: 'readonly',
  HtmlService: 'readonly',
  LockService: 'readonly',
  MailApp: 'readonly',
  PropertiesService: 'readonly',
  ScriptApp: 'readonly',
  Session: 'readonly',
  SpreadsheetApp: 'readonly',
  Utilities: 'readonly',
  UrlFetchApp: 'readonly',
}

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'coverage'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['**/*.js'],
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-redeclare': 'off',
      'preserve-caught-error': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['**/appsscript/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...appsScriptGlobals,
        ContentService: 'readonly',
        SpreadsheetApp: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-redeclare': 'off',
      'preserve-caught-error': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['*.config.js', '*.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
)
