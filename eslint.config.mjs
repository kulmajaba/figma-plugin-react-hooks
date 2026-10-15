import js from '@eslint/js';
import figmaPlugins from '@figma/eslint-plugin-figma-plugins';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { configs as tsConfigs, plugin as tsPlugin } from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['lib']),
  {
    files: ['**/*.{js,mjs,ts}'],
    plugins: { js },
    extends: ['js/recommended'],
    settings: {
      react: { version: 'detect' }
    }
  },
  {
    files: ['**/*.ts'],
    extends: [tsConfigs.recommended]
  },
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  figmaPlugins.flatConfigs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  reactHooks.configs.flat.recommended,
  // Must come after all other rule sets so it can turn off conflicting formatting rules.
  // Formatting itself is handled by Prettier directly (npm run format), not through ESLint.
  prettierConfig,
  {
    plugins: { '@typescript-eslint': tsPlugin },
    settings: {
      'import/resolver': {
        typescript: true
      }
    },
    rules: {
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true }],
      'import/order': [
        'warn',
        {
          alphabetize: {
            order: 'asc'
          },
          'newlines-between': 'always',
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
          pathGroups: [
            {
              pattern: 'react',
              group: 'builtin',
              position: 'before'
            },
            {
              pattern: '{.,..,../..}/**/type{s,Primitives}',
              group: 'type',
              position: 'after'
            }
          ],
          pathGroupsExcludedImportTypes: ['react']
        }
      ],
      'import/no-unresolved': 'error',
      '@figma/figma-plugins/await-requires-async': 'off',
      'react/jsx-fragments': ['warn', 'syntax'],
      'react/destructuring-assignment': ['warn', 'always'],
      'react/function-component-definition': ['warn', { namedComponents: 'arrow-function' }],
      'react/jsx-sort-props': [
        'warn',
        {
          callbacksLast: true,
          shorthandFirst: true,
          ignoreCase: true,
          reservedFirst: true
        }
      ]
    }
  }
]);
