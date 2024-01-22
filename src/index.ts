import { createUIAPI, createPluginAPI } from 'figma-plugin-api';

import { resolveAndFilterNodes } from './utils';

import {
  FigmaSelectionHookOptions,
  FigmaSelectionListener,
  SerializedResolvedNode,
  nodeCanHaveChildren
} from './types';

export { FIGMA_MIXED } from './constants';

declare global {
  interface Window {
    _figma_onSelectionChange?: (selection: ReadonlyArray<SerializedResolvedNode>) => void;
  }
}

export const uiApi = createUIAPI({
  _onSelectionChange(selection: ReadonlyArray<SerializedResolvedNode>) {
    if (typeof window._figma_onSelectionChange !== 'undefined') {
      window._figma_onSelectionChange(selection);
    }
  }
});

const selectionChangeHandler = () => {
  console.log('Selection change handler', figma.currentPage.selection);
  console.log('Filtered selection:', resolveAndFilterNodes(figma.currentPage.selection, options));
  uiApi._onSelectionChange(resolveAndFilterNodes(figma.currentPage.selection, options));
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

export const api = createPluginAPI({
  _registerForSelectionChange(opts: FigmaSelectionHookOptions) {
    console.log('Register');
    options = opts;
    figma.on('selectionchange', selectionChangeHandler);
    figma.on('documentchange', documentChangeHandler);
  },
  _deregisterForSelectionChange() {
    figma.off('selectionchange', selectionChangeHandler);
    figma.off('documentchange', documentChangeHandler);
  },
  _setSelection(newSelection: ReadonlyArray<SceneNode>) {
    figma.currentPage.selection = newSelection;
  }
});

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
