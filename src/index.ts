import { createUIAPI, createPluginAPI } from 'figma-plugin-api';

import { deSerializeNode, resolveAndFilterNodes } from './utils';

import { FigmaSelectionHookOptions, FigmaSelectionListener, SerializedNode } from './types';

export { FIGMA_MIXED } from './constants';

declare global {
  interface Window {
    _figma_onSelectionChange?: (selection: ReadonlyArray<SceneNode>) => void;
  }
}

export const uiApi = createUIAPI({
  _onSelectionChange(selection: ReadonlyArray<SerializedNode<SceneNode>>) {
    if (typeof window._figma_onSelectionChange !== 'undefined') {
      const deSerializedSelection = selection.map(deSerializeNode);
      window._figma_onSelectionChange(deSerializedSelection);
    }
  }
});

const selectionChangeHandler = () => {
  console.log('Selection change handler', figma.currentPage.selection);
  console.log('Filtered selection:', resolveAndFilterNodes(figma.currentPage.selection, options));
  uiApi._onSelectionChange(resolveAndFilterNodes(figma.currentPage.selection, options));
};

const documentChangeHandler = (e: DocumentChangeEvent) => {
  if (figma.currentPage.selection.length > 0) {
    const selection = figma.currentPage.selection;

    // Rudimentary check to see if changes affect selection
    const changesApplyToSelectedNodes = e.documentChanges.some((change) =>
      selection.findIndex((node) => node.id === change.id)
    );

    if (changesApplyToSelectedNodes) {
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
