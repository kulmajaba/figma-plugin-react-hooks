import { useEffect, useState } from 'react';

import useMountedEffect from './useMountedEffect';

import { api, listeners, setlisteners } from '.';

import {
  ArrayElementOrUnknown,
  FigmaSelectionHookOptions,
  FigmaSelectionListener,
  RPCOptions,
  SceneNodePropertyKey,
  SerializedResolvedNode
} from './types';

export { FigmaSelectionHookOptions } from './types';
export { FIGMA_MIXED } from './constants';

type FigmaSelectionReturnType<
  A extends boolean,
  V extends boolean,
  T extends readonly SceneNode['type'][] | undefined = undefined,
  K extends SceneNodePropertyKey<ArrayElementOrUnknown<T>> | undefined = undefined
> = [
  ReadonlyArray<SerializedResolvedNode<A, V, ArrayElementOrUnknown<T>, K>>,
  (selection: ReadonlyArray<SceneNode>) => void
];

type Test = FigmaSelectionReturnType<false, false, ['FRAME'], 'children' | 'fills'>;
type Test2 = Test[0][number];

interface UseFigmaSelection {
  <
    A extends boolean = false,
    V extends boolean = false,
    T extends readonly SceneNode['type'][] | undefined = undefined,
    K extends SceneNodePropertyKey<ArrayElementOrUnknown<T>> | undefined = undefined
  >(hookOptions?: {
    nodeTypes?: T;
    resolveChildrenNodes?: boolean;
    resolveProperties?: ReadonlyArray<SceneNodePropertyKey<ArrayElementOrUnknown<T>>> | 'all';
    resolveVariables?: V;
    addAncestorsVisibleProperty?: A;
    apiOptions?: RPCOptions;
  }): FigmaSelectionReturnType<A, V, T, K>;
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
  A extends boolean = false,
  V extends boolean = false,
  T extends readonly SceneNode['type'][] | undefined = undefined,
  K extends SceneNodePropertyKey<ArrayElementOrUnknown<T>> | undefined = undefined
>(
  hookOptions?: FigmaSelectionHookOptions
): FigmaSelectionReturnType<A, V, T, K> => {
  const opts = { ...defaultOptions, ...hookOptions };

  const [selection, setSelection] = useState<ReadonlyArray<SerializedResolvedNode<A, V, ArrayElementOrUnknown<T>, K>>>(
    []
  );

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
