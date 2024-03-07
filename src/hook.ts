/* eslint-disable react-hooks/rules-of-hooks */

import { useEffect, useState } from 'react';

import { DEFAULT_HOOK_OPTIONS, ListenerEventType } from './constants';
import useMountedEffect from './useMountedEffect';

import { api, listeners, setlisteners, updateApiWithOptions, updateUiApiWithOptions } from '.';

import { CombineObjects } from './typePrimitives';
import {
  FigmaSelectionHookOptions,
  FigmaSelectionListener,
  SerializedResolvedNode,
  FigmaSelectionHookType
} from './types';

export { FigmaSelectionHookOptions, FigmaSelectionHookNode, FigmaSelectionHookType } from './types';
export { FIGMA_MIXED } from './constants';

/**
 * Use the current Figma selection in React
 *
 * Only one config will take presence and it will be the config of the first hook that is mounted
 *
 * @returns A tuple with the current selection, a function to set the selection and a boolean indicating if a new selection is being resolved
 */
const useFigmaSelection = <const Options extends FigmaSelectionHookOptions>(
  hookOptions?: Options
): FigmaSelectionHookType<Options> => {
  const opts = { ...DEFAULT_HOOK_OPTIONS, ...hookOptions } as const;

  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<
    readonly SerializedResolvedNode<CombineObjects<typeof DEFAULT_HOOK_OPTIONS, Options>>[]
  >([]);

  const selectionListener: FigmaSelectionListener = (type, newSelection) => {
    if (type === ListenerEventType.Start) {
      setLoading(true);
    } else if (type === ListenerEventType.Finish) {
      setLoading(false);
      setSelection(newSelection as unknown as typeof selection);
      console.log('selectionListener finish at time', Date.now().toString().slice(-5));
    }
  };

  useMountedEffect(() => {
    console.warn('useFigmaSelection: changing options once mounted will not affect the behavior of the hook');
  }, [hookOptions]);

  useEffect(() => {
    const mount = async () => {
      // Typing the listeners  explicitly is difficult due to the architecture, so we have to assert
      listeners.push(selectionListener);

      // if it's the first listener, register for selection change
      if (listeners.length === 1) {
        try {
          if (opts.apiOptions) {
            updateApiWithOptions(opts.apiOptions);
            updateUiApiWithOptions(opts.apiOptions);
          }
          await api._registerForSelectionChange(opts);
        } catch (e) {
          console.error(e);
        }
      }
    };

    mount();

    return () => {
      setlisteners(listeners.filter((l) => l !== selectionListener));
      if (!listeners.length) {
        // if it was the last listener, then we don't have to listen to selection change anymore
        api._deregisterForSelectionChange();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [
    selection as readonly SerializedResolvedNode<CombineObjects<typeof DEFAULT_HOOK_OPTIONS, Options>>[],
    api._setSelection,
    loading
  ];
};

export default useFigmaSelection;
