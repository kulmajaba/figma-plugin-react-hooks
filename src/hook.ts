/* eslint-disable react-hooks/rules-of-hooks */

import { useEffect, useState } from 'react';

import useMountedEffect from './useMountedEffect';

import { api, listeners, setlisteners } from '.';

import { BareNode, FigmaSelectionHookOptions, ResolverOptions, SerializedResolvedNode } from './types';

export { FigmaSelectionHookOptions } from './types';
export { FIGMA_MIXED } from './constants';

const defaultOptions = {
  nodeTypes: undefined,
  resolveChildren: false,
  resolveVariables: false,
  resolveProperties: 'all',
  addAncestorsVisibleProperty: false
} as const satisfies ResolverOptions;

/**
 * Only one config will take presence and it will be the config of the first hook that is mounted
 */
const useFigmaSelection = <const Options extends FigmaSelectionHookOptions>(
  hookOptions?: Options
): [readonly SerializedResolvedNode<Options>[], (selection: readonly BareNode[]) => void] => {
  const opts = { ...defaultOptions, ...hookOptions } as const;

  const [selection, setSelection] = useState<readonly SerializedResolvedNode<Options>[]>([]);

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

  return [selection as readonly SerializedResolvedNode<Options>[], api._setSelection];
};

export default useFigmaSelection;
