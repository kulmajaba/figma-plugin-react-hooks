/// <reference types="@figma/plugin-typings" />

import { expectType } from 'tsd';

import {
  ApplicableNonFunctionPropertyKeys,
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
expectType<'id' | 'type'>({} as NonFunctionPropertyKeys<{ id: 'asd'; type: 'asd'; getType: () => 'asd' }>);

// ApplicableNonFunctionPropertyKeys should return all property keys of an object that are not functions and exist in object
expectType<'id' | 'type'>(
  {} as ApplicableNonFunctionPropertyKeys<
    { id: 'asd'; type: 'asd'; getType: () => 'asd' },
    'id' | 'type' | 'getType' | 'doesNotExist'
  >
);

// SceneNodeFromTypes should return only the SceneNode union members that match the types
expectType<TextNode>({} as SceneNodeFromTypes<['TEXT']>);
expectType<TextNode | FrameNode>({} as SceneNodeFromTypes<['TEXT', 'FRAME']>);
expectType<SceneNode>({} as SceneNodeFromTypes);

// SerializedNode should only return the configured node types and properties
expectType<
  {
    type: 'TEXT';
    id: string;
  } & {
    characters: string;
  }
>(
  {} as SerializedNode<
    TextNode,
    {
      nodeTypes: ['TEXT'];
      resolveProperties: ['characters'];
      resolveChildren: false;
      resolveVariables: [];
      addAncestorsVisibleProperty: false;
    }
  >
);

// SerializedResolvedNode should only return the configured node types and properties
expectType<
  {
    type: 'TEXT';
    id: string;
  } & {
    characters: string;
  }
>(
  {} as SerializedResolvedNode<{
    nodeTypes: ['TEXT'];
    resolveProperties: ['characters'];
    resolveChildren: false;
    resolveVariables: [];
    addAncestorsVisibleProperty: false;
  }>
);

// SerializedResolvedNode should work with union types for Node
expectType<
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
>(
  {} as SerializedResolvedNode<{
    nodeTypes: ['TEXT', 'FRAME'];
    resolveProperties: ['characters', 'children'];
    resolveChildren: false;
    resolveVariables: [];
    addAncestorsVisibleProperty: false;
  }>
);

// keyof BoundVariables and keyof BoundVariableInstances should be the same
expectType<keyof BoundVariables>('' as keyof BoundVariableInstances);

// ExtractProps should return the properties that match the given type
expectType<{
  c: 'asd';
  d: 'asd';
}>({} as ExtractProps<{ a: 1; b: [1, 2]; c: 'asd'; d: 'asd' }, string>);

// CombineObjects should merge the properties of two objects, using non-undefined properties from the second object
expectType<{
  a: number;
  b: number;
  c: boolean;
  d: string;
}>({} as CombineObjects<{ a: string; b: number; d: string }, { a?: number; b: undefined; c: boolean }>);
