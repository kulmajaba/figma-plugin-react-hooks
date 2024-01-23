import { useEffect, useState } from 'react';

import useMountedEffect from './useMountedEffect';

import { api, listeners, setlisteners } from '.';

import { FigmaSelectionHookOptions, SceneNodeKeys, SerializedResolvedNode } from './types';

export { FigmaSelectionHookOptions } from './types';
export { FIGMA_MIXED } from './constants';

type FigmaSelectionReturnType<T extends SceneNode['type'], K extends SceneNodeKeys<T>> = [
  ReadonlyArray<SerializedResolvedNode<T, K>>,
  (selection: ReadonlyArray<SceneNode>) => void
];

const defaultOptions: Required<Omit<FigmaSelectionHookOptions, 'nodeTypes' | 'apiOptions'>> = {
  resolveChildrenNodes: false,
  resolveVariables: false,
  resolveProperties: 'all',
  addAncestorsVisibleProperty: false
};

/**
 * Only one config will take presence and it will be the config of the first hook that is mounted
 */
const useFigmaSelection = <T extends SceneNode['type'], K extends SceneNodeKeys<T>>(
  hookOptions?: FigmaSelectionHookOptions
): FigmaSelectionReturnType<T, K> => {
  const opts = { ...defaultOptions, ...hookOptions };

  const [selection, setSelection] = useState<ReadonlyArray<SerializedResolvedNode>>([]);

  useMountedEffect(() => {
    console.warn('useFigmaSelection: changing options once mounted will not affect the behavior of the hook');
  }, [hookOptions]);

  useEffect(() => {
    console.log('Hook mount');
    const mount = async () => {
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

  return [selection as ReadonlyArray<SerializedResolvedNode<T>>, api._setSelection];
};

export default useFigmaSelection;
