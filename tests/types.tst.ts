/// <reference types="@figma/plugin-typings" />

import { expect } from 'tstyche';

import {
  ApplicableNonFunctionPropertyKeys,
  ArrayHasElements,
  CombineObjects,
  ExtractProps,
  NonFunctionPropertyKeys
} from '../src/typePrimitives';
import {
  BareNode,
  SerializedNode,
  SerializedResolvedNode,
  SceneNodeFromTypes,
  BoundVariables,
  BoundVariableInstances
} from '../src/types';

// NonFunctionPropertyKeys should return all property keys of an object that are not functions
expect<NonFunctionPropertyKeys<{ id: 'asd'; type: 'asd'; getType: () => 'asd' }>>().type.toBe<'id' | 'type'>();

// NonFunctionPropertyKeys should work with unions
expect<
  NonFunctionPropertyKeys<
    { id: 'id'; type: 'type'; getType: () => 'asd' } | { id: 'id2'; type: 'type2'; getOtherProp: () => 'asd' }
  >
>().type.toBe<'id' | 'type'>();

// ApplicableNonFunctionPropertyKeys should return all property keys of an object that are not functions and exist in object
expect<
  ApplicableNonFunctionPropertyKeys<
    { id: 'asd'; type: 'asd'; getType: () => 'asd' },
    'id' | 'type' | 'getType' | 'doesNotExist'
  >
>().type.toBe<'id' | 'type'>();

// SceneNodeFromTypes should return only the SceneNode union members that match the types
expect<SceneNodeFromTypes<['TEXT']>>().type.toBe<TextNode>();
expect<SceneNodeFromTypes<['TEXT', 'FRAME']>>().type.toBe<TextNode | FrameNode>();
expect<SceneNodeFromTypes>().type.toBe<SceneNode>();

// SerializedNode should only return the configured node types and properties
expect<
  SerializedNode<
    TextNode,
    {
      nodeTypes: ['TEXT'];
      resolveProperties: ['characters'];
      resolveChildren: false;
      resolveVariables: [];
      addAncestorsVisibleProperty: false;
      pluginDataKeys: [];
      sharedPluginDataKeys: Record<string, never>;
    }
  >
>().type.toBe<
  {
    type: 'TEXT';
    id: string;
  } & {
    characters: string;
  }
>();

// SerializedNode should return only type and id if no properties are resolved
expect<
  SerializedNode<
    TextNode,
    {
      nodeTypes: ['TEXT'];
      resolveProperties: [];
      resolveChildren: false;
      resolveVariables: [];
      addAncestorsVisibleProperty: false;
      pluginDataKeys: [];
      sharedPluginDataKeys: Record<string, never>;
    }
  >
>().type.toBe<{
  type: 'TEXT';
  id: string;
}>();

// SerializedResolvedNode should only return the configured node types and properties
expect<
  SerializedResolvedNode<{
    nodeTypes: ['TEXT'];
    resolveProperties: ['characters'];
    resolveChildren: false;
    resolveVariables: [];
    addAncestorsVisibleProperty: false;
    pluginDataKeys: [];
    sharedPluginDataKeys: Record<string, never>;
  }>
>().type.toBe<
  {
    type: 'TEXT';
    id: string;
  } & {
    characters: string;
  }
>();

// SerializedResolvedNode should work with union types for Node
expect<
  SerializedResolvedNode<{
    nodeTypes: ['TEXT', 'FRAME'];
    resolveProperties: ['characters', 'children'];
    resolveChildren: false;
    resolveVariables: [];
    addAncestorsVisibleProperty: false;
    pluginDataKeys: [];
    sharedPluginDataKeys: Record<string, never>;
  }>
>().type.toBe<
  | ({
      type: 'TEXT';
      id: string;
    } & {
      characters: string;
    })
  | ({
      type: 'FRAME';
      id: string;
    } & {
      children: readonly BareNode[];
    })
>();

// SerializedResolvedNode should resolve children type
type TestTypeWithChildren = {
  type: 'FRAME';
  id: string;
} & {
  children: readonly TestTypeWithChildren[];
};
expect<
  SerializedResolvedNode<{
    nodeTypes: ['FRAME'];
    resolveProperties: ['children'];
    resolveChildren: true;
    resolveVariables: [];
    addAncestorsVisibleProperty: false;
    pluginDataKeys: [];
    sharedPluginDataKeys: Record<string, never>;
  }>
>().type.toBe<TestTypeWithChildren>();

// SerializedResolvedNode should resolve children type
type TestTypeWithChildren2 =
  | {
      type: 'TEXT';
      id: string;
    }
  | ({
      type: 'FRAME';
      id: string;
    } & {
      children: readonly TestTypeWithChildren2[];
    });
expect<
  SerializedResolvedNode<{
    nodeTypes: ['TEXT', 'FRAME'];
    resolveProperties: ['children'];
    resolveChildren: true;
    resolveVariables: [];
    addAncestorsVisibleProperty: false;
    pluginDataKeys: [];
    sharedPluginDataKeys: Record<string, never>;
  }>
>().type.toBe<TestTypeWithChildren2>();

// SerializedResolvedNode should return pluginData if configured
expect<
  SerializedResolvedNode<{
    nodeTypes: ['TEXT'];
    resolveProperties: ['characters'];
    resolveChildren: false;
    resolveVariables: [];
    addAncestorsVisibleProperty: false;
    pluginDataKeys: ['test'];
    sharedPluginDataKeys: Record<string, never>;
  }>
>().type.toBe<
  {
    type: 'TEXT';
    id: string;
  } & {
    characters: string;
  } & {
    pluginData: Record<'test', string>;
  }
>();

// SerializedResolvedNode should return sharedPluginData if configured
expect<
  SerializedResolvedNode<{
    nodeTypes: ['TEXT'];
    resolveProperties: ['characters'];
    resolveChildren: false;
    resolveVariables: [];
    addAncestorsVisibleProperty: false;
    pluginDataKeys: [];
    sharedPluginDataKeys: { testSpace: ['test'] };
  }>
>().type.toBe<
  {
    type: 'TEXT';
    id: string;
  } & {
    characters: string;
  } & {
    sharedPluginData: {
      testSpace: Record<'test', string>;
    };
  }
>();

// keyof BoundVariables and keyof BoundVariableInstances should be the same
expect<keyof BoundVariableInstances>().type.toBe<keyof BoundVariables>();

// ExtractProps should return the properties that match the given type
expect<ExtractProps<{ a: 1; b: [1, 2]; c: 'asd'; d: 'asd' }, string>>().type.toBe<{
  c: 'asd';
  d: 'asd';
}>();

// CombineObjects should merge the properties of two objects, using non-undefined properties from the second object
expect<CombineObjects<{ a: string; b: number; d: string }, { a?: number; b: undefined; c: boolean }>>().type.toBe<{
  a: number;
  b: number;
  c: boolean;
  d: string;
}>();

expect<ArrayHasElements<[1, 2, 3]>>().type.toBe<true>();
expect<ArrayHasElements<[]>>().type.toBe<false>();
