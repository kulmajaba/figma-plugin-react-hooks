import { ResolverOptions } from './types';

/**
 *  Used to replace `figma.mixed` during JSON serialization
 */
export const FIGMA_MIXED = 'mixed-57999e63-7384-42a1-acf8-d80b9f6c36a7';

/**
 * Default options for the hook
 */
export const DEFAULT_HOOK_OPTIONS = {
  nodeTypes: undefined,
  resolveChildren: false,
  resolveVariables: [],
  resolveProperties: 'all',
  addAncestorsVisibleProperty: false,
  pluginDataKeys: [],
  sharedPluginDataKeys: {}
} as const satisfies ResolverOptions;
