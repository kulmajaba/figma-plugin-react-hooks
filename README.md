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

## TODO

- Use rpcOptions when creating APIs
- Make addParentChainVisibleProperty do stuff

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

### KeysOfUnion

Ƭ **KeysOfUnion**\<`T`\>: `T` extends infer P ? keyof `P` : `never`

Get all keys of a union type.

Normally, `keyof` only returns the keys of the intersection of the union.

#### Type parameters

| Name |
| :------ |
| `T` |

___

### SceneNodeType

Ƭ **SceneNodeType**: `SceneNode`[``"type"``]

___

### SceneNodeKeys

Ƭ **SceneNodeKeys**\<`T`\>: [`KeysOfUnion`](types.md#keysofunion)\<`T` extends [`SceneNodeType`](types.md#scenenodetype) ? `ExtractedSceneNode`\<`T`\> : `SceneNode`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`SceneNodeType`](types.md#scenenodetype) \| `undefined` = `undefined` |

___

### SerializedResolvedNode

Ƭ **SerializedResolvedNode**\<`T`, `K`\>: `SerializedNode`\<`T` extends [`SceneNodeType`](types.md#scenenodetype) ? `K` extends [`SceneNodeKeys`](types.md#scenenodekeys)\<`T`\> ? `Pick`\<`ExtractedSceneNode`\<`T`\>, `K`\> : `ExtractedSceneNode`\<`T`\> : `SceneNode`\> & \{ `ancestorsVisible?`: `boolean` ; `children`: readonly [`SerializedResolvedNode`](types.md#serializedresolvednode)[]  }

All nodes are serialized into this type before sending to the plugin UI.

To

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`SceneNodeType`](types.md#scenenodetype) \| `undefined` = `undefined` |
| `K` | extends [`SceneNodeKeys`](types.md#scenenodekeys)\<`T`\> \| `undefined` = `undefined` |

___

### FigmaSelectionHookOptions

Ƭ **FigmaSelectionHookOptions**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `nodeTypes?` | `ReadonlyArray`\<`SceneNode`[``"type"``]\> | Only return specific types of nodes. If left undefined, all nodes in the selection will be returned. Default: `undefined` |
| `resolveChildrenNodes?` | `boolean` | Resolve children nodes of the selection. If used with `nodeTypes`, all nodes of the specified types will be returned as a flat array. Default: `false` |
| `resolveProperties?` | `ReadonlyArray`\<`SceneNodePropertyKey`\> \| ``"all"`` | Figma node properties are lazy-loaded, so to use any property you have to resolve it first. Resolving all node properties causes a performance hit, so you can specify which properties you want to resolve. If set to `[]`, no properties will be resolved and you will only get the ids of the nodes. Node methods (such as `getPluginData`) will never be resolved. Default: `all` |
| `resolveVariables?` | `boolean` | Resolve bound variables of the selection. Default: `false` |
| `addAncestorsVisibleProperty?` | `boolean` | Add `ancestorsVisible` property to all nodes. This property is true if all ancestors of the node are visible. Default: `false` |
| `apiOptions?` | [`RPCOptions`](types.md#rpcoptions) | Options for figma-plugin-api Default: see the RPCOptions type |

## Variables

### FIGMA\_MIXED

• `Const` **FIGMA\_MIXED**: ``"57999e63-7384-42a1-acf8-d80b9f6c36a7"``

Used to replace `figma.mixed` during JSON serialization
