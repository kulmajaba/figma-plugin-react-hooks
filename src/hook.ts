import { useEffect, useState } from 'react';

import useMountedEffect from './useMountedEffect';

import { api, listeners, setlisteners } from '.';

import {
  ArrayElement,
  ArrayElementOrUndefined,
  BareNode,
  ExtractedSceneNode,
  FigmaSelectionHookOptions,
  FigmaSelectionListener,
  KeysOfUnion,
  RPCOptions,
  SceneNodePropertyKey,
  SerializedResolvedNode
} from './types';

export { FigmaSelectionHookOptions } from './types';
export { FIGMA_MIXED } from './constants';

type SceneNodeFromTypes<T extends readonly SceneNode['type'][] | undefined> = T extends undefined
  ? SceneNode
  : ExtractedSceneNode<ArrayElement<T>>;

type FigmaSelectionReturnType<
  T extends SceneNode = SceneNode,
  K extends KeysOfUnion<SceneNode> = KeysOfUnion<T>,
  C extends boolean = false,
  A extends boolean = false,
  V extends boolean = false
> = [ReadonlyArray<SerializedResolvedNode<T, K, C, A, V>>, <N extends BareNode>(selection: ReadonlyArray<N>) => void];

interface UseFigmaSelection {
  <
    T extends readonly SceneNode['type'][] | undefined = undefined,
    K extends SceneNodePropertyKey<ArrayElementOrUndefined<T>> | undefined = undefined,
    C extends boolean = false,
    A extends boolean = false,
    V extends boolean = false
  >(hookOptions?: {
    nodeTypes?: T;
    resolveChildrenNodes?: C;
    resolveProperties?: ReadonlyArray<SceneNodePropertyKey<ArrayElementOrUndefined<T>>> | 'all';
    resolveVariables?: V;
    addAncestorsVisibleProperty?: A;
    apiOptions?: RPCOptions;
  }): FigmaSelectionReturnType<SceneNodeFromTypes<T>, K, C, A, V>;
}

const defaultOptions: Required<Omit<FigmaSelectionHookOptions, 'nodeTypes' | 'apiOptions'>> = {
  resolveChildrenNodes: false,
  resolveVariables: false,
  resolveProperties: 'all',
  addAncestorsVisibleProperty: false
};

/**
 * Only one config will take presence and it will be the config of the first hook that is mounted
 */
const useFigmaSelection: UseFigmaSelection = <
  T extends readonly SceneNode['type'][] | undefined = undefined,
  K extends SceneNodePropertyKey<ArrayElementOrUndefined<T>> | undefined = undefined,
  C extends boolean = false,
  A extends boolean = false,
  V extends boolean = false
>(
  hookOptions?: FigmaSelectionHookOptions
): FigmaSelectionReturnType<SceneNodeFromTypes<T>, K, C, A, V> => {
  const opts = { ...defaultOptions, ...hookOptions };

  type SelectionHookType = ReadonlyArray<
    SerializedResolvedNode<T extends undefined ? SceneNode : ArrayElement<T>, K, C, A, V>
  >;

  const [selection, setSelection] = useState<SelectionHookType>([]);

  useMountedEffect(() => {
    console.warn('useFigmaSelection: changing options once mounted will not affect the behavior of the hook');
  }, [hookOptions]);

  useEffect(() => {
    console.log('Hook mount');
    const mount = async () => {
      // TODO: if listeners can be strictly typed according to the options, this assert can be removed
      listeners.push(setSelection as FigmaSelectionListener);

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
