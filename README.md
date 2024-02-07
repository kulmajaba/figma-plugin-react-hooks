# figma-plugin-react-hooks

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

## Types

### RPCOptions

Ƭ **RPCOptions**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `timeoutMs?` | `number` | Timeout in milliseconds Default: `3000` |
| `pluginId?` | `string` | If your plugin UI is hosted (non-null origin), pluginId must be defined to allow messages to be sent |
| `logicTargetOrigin?` | `string` | Specifies what the origin of the plugin UI must be for a message to be dispatched from plugin logic to UI If defined, add `http://localhost:<port>` to this field in your local environment to allow messaging while running on a dev server Default: `'*'` |
| `uiTargetOrigin?` | `string` | Specifies what the origin of the plugin logic must be for a message to be dispatched from UI to plugin logic Usually `'https://www.figma.com'` Default: `'*'` |

___

### OptSceneNodeProperties

Ƭ **OptSceneNodeProperties**: readonly `SceneNodePropertyKey`[] \| ``"all"``

___

### FigmaSelectionHookOptions

Ƭ **FigmaSelectionHookOptions**: `Object`

Use `satisfies` (for TS >= 4.9) with this type to allow for type checking the options object
while the type of the object remains exact.

This allows us to infer the type of the returned nodes correctly.

Example:
```typescript
const options = {
  nodeTypes: ['TEXT', 'FRAME'],
  resolveProperties: ['name', 'characters', 'children]
} satisfies FigmaSelectionHookOptions;
```

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `nodeTypes?` | readonly `SceneNodeType`[] | Only return specific types of nodes. If left undefined, all nodes in the selection will be returned. Default: `undefined` |
| `resolveProperties?` | [`OptSceneNodeProperties`](types.md#optscenenodeproperties) | Figma node properties are lazy-loaded, so to use any property you have to resolve it first. Resolving all node properties causes a performance hit, so you can specify which properties you want to resolve. If set to `[]`, no properties will be resolved and you will only get the ids of the nodes. Node methods (such as `getPluginData`) will never be resolved. Default: `'all'` |
| `resolveChildren?` | `boolean` | Resolve children nodes of the selection. If used with `nodeTypes`, all nodes of the specified types will be returned as a flat array. Default: `false` |
| `resolveVariables?` | `boolean` | Resolve bound variables of the selection. Default: `false` |
| `addAncestorsVisibleProperty?` | `boolean` | Add `ancestorsVisible` property to all nodes. This property is true if all ancestors of the node are visible. Default: `false` |
| `apiOptions?` | [`RPCOptions`](types.md#rpcoptions) | Options for figma-plugin-api Default: see the RPCOptions type |

## Variables

### FIGMA\_MIXED

• `Const` **FIGMA\_MIXED**: ``"mixed-57999e63-7384-42a1-acf8-d80b9f6c36a7"``

Used to replace `figma.mixed` during JSON serialization
