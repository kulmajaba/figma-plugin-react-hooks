import { useEffect, useState } from 'react';

import useMountedEffect from './useMountedEffect';

import { api, listeners, setlisteners } from '.';

import { FigmaSelectionHookOptions } from './types';

export { FigmaSelectionHookOptions } from './types';
export { FIGMA_MIXED } from './constants';

type FigmaSelectionReturnType = [ReadonlyArray<SceneNode>, (selection: ReadonlyArray<SceneNode>) => void];

const defaultOptions: Required<Omit<FigmaSelectionHookOptions, 'nodeTypes' | 'apiOptions'>> = {
  resolveChildrenNodes: false,
  resolveVariables: false,
  resolveProperties: 'all',
  addParentChainVisibleProperty: false,
  useFigmaMixed: false
};

/**
 * Only one config will take presence and it will be the config of the first hook that is mounted
 */
const useFigmaSelection = (hookOptions?: FigmaSelectionHookOptions): FigmaSelectionReturnType => {
  const opts = { ...defaultOptions, ...hookOptions };

  const [selection, setSelection] = useState<ReadonlyArray<SceneNode>>([]);

  useMountedEffect(() => {
    console.warn('useFigmaSelection: changing options once mounted will not affect the behavior of the hook');
  }, [hookOptions]);

  useEffect(() => {
    console.log('Hook mount');
    const mount = async () => {
      if (!listeners.length) {
        // if it's the first listener, register for selection change
        try {
          await api._registerForSelectionChange(opts);
        } catch (e) {
          console.error(e);
        }
      }
      listeners.push(setSelection);
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

export default useFigmaSelection;
