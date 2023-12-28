import { useEffect, useState } from 'react';

import { api, listeners, setlisteners } from './figmaSelectionApi';
import useMountedEffect from './useMountedEffect';

import { FigmaSelectionHookOptions } from './types';

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
const useFigmaSelection = (options: FigmaSelectionHookOptions): FigmaSelectionReturnType => {
  const opts = { ...defaultOptions, ...options };

  const [selection, setSelection] = useState<ReadonlyArray<SceneNode>>([]);

  useMountedEffect(() => {
    console.warn('useFigmaSelection: changing options once mounted will not affect the behavior of the hook');
  }, [options]);

  useEffect(() => {
    if (!listeners.length) {
      // if it's the first listener, register for selection change
      api._registerForSelectionChange(opts);
    }
    listeners.push(setSelection);
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
