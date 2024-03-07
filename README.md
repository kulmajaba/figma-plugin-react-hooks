# figma-plugin-react-hooks

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

### BoundVariableKey

Ƭ **BoundVariableKey**: keyof `NonNullable`\<`SceneNode`[``"boundVariables"``]\>

___

### OptSceneNodeVariables

Ƭ **OptSceneNodeVariables**: readonly [`BoundVariableKey`](types.md#boundvariablekey)[] \| ``"all"``

___

### OptSharedPluginDataKeys

Ƭ **OptSharedPluginDataKeys**: `Record`\<`string`, `string`[]\>

___

### FigmaSelectionHookOptions

Ƭ **FigmaSelectionHookOptions**: `Object`

Use `satisfies` (for TS >= 4.9) with this type to allow for type checking the options object
while the type of the object remains exact.

This allows the hook to infer the type of the returned nodes correctly.

Example:
```typescript
const options = {
  nodeTypes: ['TEXT', 'FRAME'],
  resolveProperties: ['name', 'characters', 'children']
} satisfies FigmaSelectionHookOptions;
```

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `nodeTypes?` | readonly `SceneNodeType`[] | Only return specific types of nodes. If left undefined, all nodes in the selection will be returned. Default: `undefined` |
| `resolveProperties?` | [`OptSceneNodeProperties`](types.md#optscenenodeproperties) | Figma node properties are lazy-loaded, so to use any property you have to resolve it first. Resolving all node properties causes a performance hit, so you can specify which properties you want to resolve. If set to `[]`, no properties will be resolved and you will only get the ids of the nodes. Node methods (such as `getPluginData`) will never be resolved. Default: `'all'` |
| `resolveVariables?` | [`OptSceneNodeVariables`](types.md#optscenenodevariables) | Resolve bound variables of the selection. Similarly to `resolveProperties`, you can specify which variables you want to resolve to optimize performance. If set to `[]`, no properties will be resolved and you will only get the ids of the nodes. Default: `[]` |
| `resolveChildren?` | `boolean` | Resolve children nodes of the selection. If `nodeTypes` is set, all nodes of the specified types will be returned as a flat array. Default: `false` |
| `addAncestorsVisibleProperty?` | `boolean` | Add `ancestorsVisible` property to all nodes. This property is true if all ancestors of the node are visible. Default: `false` |
| `pluginDataKeys?` | `string`[] | Get the corresponding plugin data for all nodes. Default: `[]` |
| `sharedPluginDataKeys?` | [`OptSharedPluginDataKeys`](types.md#optsharedplugindatakeys) | Get the corresponding shared plugin data for all nodes. The object keys are treated as namespaces and the array values as keys. Default: `{}` |
| `apiOptions?` | [`RPCOptions`](types.md#rpcoptions) | Options for figma-plugin-api Default: see the RPCOptions type |

___

### FigmaSelectionHookNode

Ƭ **FigmaSelectionHookNode**\<`Options`\>: `SerializedResolvedNode`\<`CombineObjects`\<typeof `DEFAULT_HOOK_OPTIONS`, `Options`\>\>

Utility type to get the inferred type of a node from the hook using the options object

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Options` | extends [`FigmaSelectionHookOptions`](types.md#figmaselectionhookoptions) = `Record`\<`string`, `never`\> |

___

### FigmaSelectionHookType

Ƭ **FigmaSelectionHookType**\<`Options`\>: [readonly [`FigmaSelectionHookNode`](types.md#figmaselectionhooknode)\<`Options`\>[], (`selection`: readonly `BareNode`[]) => `void`, `boolean`]

Utility type to get the inferred return type of the hook using the options object

[0] - Selected resolved nodes

[1] - A function to set the selection

[2] - Loading state

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Options` | extends [`FigmaSelectionHookOptions`](types.md#figmaselectionhookoptions) = `Record`\<`string`, `never`\> |

## Variables

### FIGMA\_MIXED

• `Const` **FIGMA\_MIXED**: ``"mixed-57999e63-7384-42a1-acf8-d80b9f6c36a7"``

Used to replace `figma.mixed` during JSON serialization
