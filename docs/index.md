Use Figma selection in your plugin UI via React hooks.

Supports TypeScript.

<!--- Do not edit README.md, it is overwritten by the build script. Edit docs/index.md instead. -->

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

## Hook options

The hook can be configured by passing an options object to the hook call.

**Important: only one set of options will take presence in the hook.**
Whichever hook is the most recent to be mounted will override previous options.

It is best to create the hook options as a constant that is imported into each of the files where the hook is used.

constants.ts:

```typescript
import { FigmaSelectionHookOptions } from 'figma-plugin-react-hooks/hook';

// Using satisfies gives you type hints and autocomplete while retaining the exact inferred return type from the hook
export const selectionHookOptions = {
  resolveProperties: ['name', 'boundVariables', 'absoluteBoundingBox', 'visible']
  resolveChildrenNodes: true
} satisfies FigmaSelectionHookOptions;
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
```

### Performance

The more nodes the users selects and the more properties you want to resolve from the nodes, the worse the performance will be.
If you're resolving all node properties and children, the execution time will easily get to several seconds and beyond.
Do your best to only resolve the properties you need to keep the performance at an acceptable level.

### Type utilities

The library also exports a few utility types for you to use in your React components:

```typescript
import { FC } from 'react';

import { FigmaSelectionHookNode } from 'figma-plugin-react-hooks/hook';

// Your custom options
import { figmaSelectionHookOptions } from './constants';

// FigmaSelectionHookNode is the type of a single node returned from the hook, inferred from the options you pass to it
interface NodeListItemProps {
  node: FigmaSelectionHookNode<typeof figmaSelectionHookOptions>;
}

const NodeListItem: FC<NodeListItemProps> = ({ node }) => {
  ...
};
```

## Caveat

The hook is based on Figma's `selectionchange` and `nodechange` events, which currently do not support all changes in the selection.
Examples of missing events:

- Binding a text variable to a node
- Using "reset all changes" on a Component instance
