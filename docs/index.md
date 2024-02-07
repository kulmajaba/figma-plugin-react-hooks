<!--- Do not edit README.md, it is overwritten by the build script. Edit docs/index.md instead. -->

Use Figma selection in your plugin UI via React hooks.

Supports TypeScript.

## Usage

`npm install figma-plugin-react-hooks`

You need to import the package in your plugin logic for the React hooks to work, as it sets up the other end of the communication pipeline.

plugin.ts (plugin logic):

```typescript
// Set up change handlers
import 'figma-plugin-react-hooks';
```

You can then use the hook in React like any other hook. Note the import from `figma-plugin-react-hooks/hook`.

React app (plugin UI):

```typescript
import { FC } from 'react';

import useFigmaSelection from 'figma-plugin-react-hooks/hook';

const SomeComponent: FC = () => {
  const [selection] = useFigmaSelection();

  // Do something with the selection, e.g. display node names
  return <div>{selection.map((node) => node.name).join(', ')}</div>;
};

export default SomeComponent;
```

## Configuring the hook

The hook can be configured by passing an options object to the hook call.

**Important: only one set of options, from the first time the hook is called in your app, will take presence.**

It is best to create the hook options as a constant that is imported into each of the files where the hook is used.

constants.ts:

```typescript
import { FigmaSelectionHookOptions } from 'figma-plugin-react-hooks/hook';

export const selectionHookOptions: FigmaSelectionHookOptions = {
  resolveChildrenNodes: true
};
```

React app:

```typescript
import { FC } from 'react';

import useFigmaSelection from 'figma-plugin-react-hooks/hook';

import { selectionHookOptions } from './constants';

const SomeComponent: FC = () => {
  const [selection] = useFigmaSelection(selectionHookOptions);

  ...
};

export default SomeComponent;
```
