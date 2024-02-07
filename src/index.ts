import { createUIAPI, createPluginAPI, RPCOptions } from 'figma-plugin-api';

import { nodeCanHaveChildren } from './typeUtils';
import { resolveAndFilterNodes } from './utils';

import {
  BareNode,
  FigmaSelectionHookOptions,
  FigmaSelectionListener,
  ResolverOptions,
  SerializedResolvedNode
} from './types';

export { FIGMA_MIXED } from './constants';

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

const selectionChangeHandler = () => {
  const resolvedSelection = resolveAndFilterNodes(figma.currentPage.selection, options);
  uiApi._onSelectionChange(resolvedSelection);
};

const changesApplyToSelectedNodesOrDescendants = (e: DocumentChangeEvent, nodes: readonly SceneNode[]): boolean => {
  const changesApplyToNodes = e.documentChanges.some(
    (change) => nodes.findIndex((node) => node.id === change.id) !== -1
  );

  if (changesApplyToNodes) {
    return true;
  }

  const descendants: SceneNode[] = [];

  nodes.forEach((node) => {
    if (nodeCanHaveChildren(node)) {
      descendants.push(...node.children);
    }
  });

  if (descendants.length === 0) {
    return false;
  }

  return changesApplyToSelectedNodesOrDescendants(e, descendants);
};

const documentChangeHandler = (e: DocumentChangeEvent) => {
  if (figma.currentPage.selection.length > 0) {
    const selection = figma.currentPage.selection;

    if (changesApplyToSelectedNodesOrDescendants(e, selection)) {
      selectionChangeHandler();
    }
  }
};

const apiMethods = {
  _registerForSelectionChange(opts: FigmaSelectionHookOptions) {
    options = opts;

    const apiOptions = opts.apiOptions;
    if (apiOptions) {
      updateUiApiWithOptions(apiOptions);
      updateApiWithOptions(apiOptions);
    }

    figma.on('selectionchange', selectionChangeHandler);
    figma.on('documentchange', documentChangeHandler);
    selectionChangeHandler();
  },
  _deregisterForSelectionChange() {
    figma.off('selectionchange', selectionChangeHandler);
    figma.off('documentchange', documentChangeHandler);
  },
  _setSelection<N extends readonly BareNode[]>(newSelection: N) {
    figma.currentPage.selection = newSelection as unknown as readonly SceneNode[];
  }
};

export let api = createPluginAPI(apiMethods);

export const updateApiWithOptions = (rpcOptions: RPCOptions) => {
  api = createPluginAPI(apiMethods, rpcOptions);
};

let options: FigmaSelectionHookOptions;

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
