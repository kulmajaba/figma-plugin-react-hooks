import { createUIAPI, createPluginAPI } from 'figma-plugin-api';

import { nodeCanHaveChildren } from './typeUtils';
import { resolveAndFilterNodes } from './utils';

// Allow esbuild to drop the import
import type { RPCOptions } from 'figma-plugin-api';

import {
  BareNode,
  FigmaSelectionHookOptions,
  FigmaSelectionListener,
  ResolverOptions,
  SerializedResolvedNode
} from './types';

export { FIGMA_MIXED } from './constants';

let currentPage: PageNode | undefined;
let registeredForChanges = false;

declare global {
  interface Window {
    _figma_onSelectionChange?: (selection: readonly SerializedResolvedNode<ResolverOptions>[]) => void;
  }
}

const uiApiMethods = {
  _onSelectionChange(selection: readonly SerializedResolvedNode<ResolverOptions>[]) {
    if (typeof window._figma_onSelectionChange !== 'undefined') {
      window._figma_onSelectionChange(selection);
    }
  }
};

export let uiApi = createUIAPI(uiApiMethods);

export const updateUiApiWithOptions = (rpcOptions: RPCOptions) => {
  uiApi = createUIAPI(uiApiMethods, rpcOptions);
};

const selectionChangeHandler = async () => {
  const resolvedSelection = await resolveAndFilterNodes(figma.currentPage.selection, options);
  uiApi._onSelectionChange(resolvedSelection);
};

const changesApplyToSelectedNodesOrDescendants = (e: NodeChangeEvent, nodes: readonly SceneNode[]): boolean => {
  const changesApplyToNodes = e.nodeChanges.some((change) => nodes.findIndex((node) => node.id === change.id) !== -1);

  if (changesApplyToNodes) {
    return true;
  }

  const descendants: SceneNode[] = [];

  for (const node of nodes) {
    if (nodeCanHaveChildren(node)) {
      descendants.push(...node.children);
    }
  }

  if (descendants.length === 0) {
    return false;
  }

  return changesApplyToSelectedNodesOrDescendants(e, descendants);
};

const nodeChangeHandler = (e: NodeChangeEvent) => {
  if (figma.currentPage.selection.length > 0) {
    const selection = figma.currentPage.selection;

    if (changesApplyToSelectedNodesOrDescendants(e, selection)) {
      selectionChangeHandler();
    }
  }
};

const pageChangeHandler = () => {
  if (registeredForChanges) {
    currentPage?.off('nodechange', nodeChangeHandler);
    currentPage = figma.currentPage;
    currentPage.on('nodechange', nodeChangeHandler);
  }
};

const apiMethods = {
  _registerForSelectionChange(opts: ResolverOptions & FigmaSelectionHookOptions) {
    options = opts;

    const apiOptions = opts.apiOptions;
    if (apiOptions) {
      updateUiApiWithOptions(apiOptions);
      updateApiWithOptions(apiOptions);
    }

    if (!registeredForChanges) {
      figma.on('selectionchange', selectionChangeHandler);

      currentPage = figma.currentPage;
      currentPage.on('nodechange', nodeChangeHandler);

      registeredForChanges = true;
    }

    selectionChangeHandler();
  },
  _deregisterForSelectionChange() {
    figma.off('selectionchange', selectionChangeHandler);
    currentPage?.off('nodechange', nodeChangeHandler);

    registeredForChanges = false;
  },
  _setSelection<N extends readonly BareNode[]>(newSelection: N) {
    figma.currentPage.selection = newSelection as unknown as readonly SceneNode[];
  }
};

export let api = createPluginAPI(apiMethods);

export const updateApiWithOptions = (rpcOptions: RPCOptions) => {
  api = createPluginAPI(apiMethods, rpcOptions);
};

let options: ResolverOptions & FigmaSelectionHookOptions;

export let listeners: FigmaSelectionListener[] = [];

export const setlisteners = (newListeners: FigmaSelectionListener[]) => {
  listeners = newListeners;
};

// In plugin UI, add a global function to receive selection change events
if (typeof window !== 'undefined') {
  window._figma_onSelectionChange = (selection) => {
    listeners.forEach((l) => {
      l(selection);
    });
  };
}

// In plugin logic, set a listener for current page change
if (typeof figma !== 'undefined') {
  figma.on('currentpagechange', () => {
    pageChangeHandler();
  });

  figma.on('close', () => {
    figma.off('currentpagechange', pageChangeHandler);
    figma.off('selectionchange', selectionChangeHandler);
    currentPage?.off('nodechange', nodeChangeHandler);
  });
}
