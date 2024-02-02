import { useEffect, useState } from 'react';

import useMountedEffect from './useMountedEffect';

import { api, listeners, setlisteners } from '.';

import {
  BareNode,
  OptNodeTypes,
  OptResolvedPropKeys,
  OptResolvedPropKeysToPropKeysOnly,
  RPCOptions,
  SceneNodeFromTypes,
  SerializedResolvedNode
} from './types';

export { FigmaSelectionHookOptions } from './types';
export { FIGMA_MIXED } from './constants';

const defaultOptions = {
  resolveChildren: false,
  resolveVariables: false,
  resolveProperties: 'all',
  addAncestorsVisibleProperty: false
} as const;

/**
 * Only one config will take presence and it will be the config of the first hook that is mounted
 */
const useFigmaSelection = <
  NodeTypes extends OptNodeTypes,
  ResolvedPropKeys extends OptResolvedPropKeys<NodeTypes>,
  ResolveChildren extends boolean,
  AddAncestorsVisibleProp extends boolean,
  ResolveVariables extends boolean
>(hookOptions?: {
  nodeTypes?: NodeTypes;
  resolveChildren?: ResolveChildren;
  resolveProperties?: ResolvedPropKeys;
  resolveVariables?: ResolveVariables;
  addAncestorsVisibleProperty?: AddAncestorsVisibleProp;
  apiOptions?: RPCOptions;
}): [
  ReadonlyArray<
    SerializedResolvedNode<
      SceneNodeFromTypes<NodeTypes>,
      OptResolvedPropKeysToPropKeysOnly<NodeTypes, ResolvedPropKeys>,
      ResolveChildren,
      AddAncestorsVisibleProp,
      ResolveVariables
    >
  >,
  <N extends BareNode>(selection: ReadonlyArray<N>) => void
] => {
  const opts = { ...defaultOptions, ...hookOptions };

  type SelectionHookType = ReadonlyArray<
    SerializedResolvedNode<
      SceneNodeFromTypes<NodeTypes>,
      OptResolvedPropKeysToPropKeysOnly<NodeTypes, ResolvedPropKeys>,
      ResolveChildren,
      AddAncestorsVisibleProp,
      ResolveVariables
    >
  >;

  const [selection, setSelection] = useState<SelectionHookType>([]);

  useMountedEffect(() => {
    console.warn('useFigmaSelection: changing options once mounted will not affect the behavior of the hook');
  }, [hookOptions]);

  useEffect(() => {
    console.log('Hook mount');
    const mount = async () => {
      // TODO: if listeners can be strictly typed according to the options, this assert can be removed
      listeners.push(setSelection);

      // if it's the first listener, register for selection change
      if (listeners.length === 1) {
        try {
          await api._registerForSelectionChange(opts);
        } catch (e) {
          console.error(e);
        }
      }
    };

    mount();

    return () => {
      setlisteners(listeners.filter((l) => l !== setSelection));
      if (!listeners.length) {
        // if it was the last listener, then we don't have to listen to selection change anymore
        api._deregisterForSelectionChange();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [selection, api._setSelection];
};

// eslint-disable-next-line react-hooks/rules-of-hooks
const [selection] = useFigmaSelection({
  nodeTypes: ['TEXT', 'FRAME'],
  resolveProperties: ['textStyleId', 'fills'],
  addAncestorsVisibleProperty: true
});

selection.forEach((node) => {
  if (node.type === 'TEXT') {
    node.characters;
    node.ancestorsVisible;
  } else {
    node.children;
  }
});

export default useFigmaSelection;
