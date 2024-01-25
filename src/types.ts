/* eslint-disable @typescript-eslint/no-unused-vars */

import { RPCOptions } from 'figma-plugin-api';

import { FIGMA_MIXED } from './constants';

// For typedoc
export { RPCOptions } from 'figma-plugin-api';
export { FIGMA_MIXED } from './constants';

export type ArrayElementOrUnknown<ArrayType extends readonly unknown[] | undefined> =
  ArrayType extends readonly unknown[] ? ArrayType[number] : undefined;

/**
 * Get all keys of a union type.
 *
 * Normally, `keyof` only returns the keys of the intersection of the union.
 */
export type KeysOfUnion<T> = T extends infer P ? keyof P : never;

/**
 * @internal
 */
export type Mutable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * Gets all property keys of an object that are not functions.
 *
 * When given a union type, it will return all possible property names from the union types.
 */
type NonFunctionPropertyKeys<T extends object> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in KeysOfUnion<T>]: T[K] extends Function ? never : K;
}[KeysOfUnion<T>];

type BareNode = {
  id: string;
};

/**
 * @internal
 */
export type FigmaSelectionListener = (selection: ReadonlyArray<SerializedResolvedNode>) => void;

export type SceneNodeType = SceneNode['type'];

/**
 * Utility type to get only matching node types from the SceneNode union type.
 */
export type ExtractedSceneNode<T extends SceneNodeType> = Extract<SceneNode, { type: T }>;

export type SceneNodePropertyKey<T extends SceneNodeType | undefined = undefined> = NonFunctionPropertyKeys<
  T extends SceneNodeType ? ExtractedSceneNode<T> : SceneNode
>;

type ApplicablePropertyKey<T extends object, K extends string | number | symbol> = K extends keyof T ? K : never;

/**
 * @internal
 * @typeParam T - Node property
 * @typeParam C - Children nodes resolved
 */
type SerializedNodeProperty<T, C extends boolean> = T extends PluginAPI['mixed']
  ? typeof FIGMA_MIXED
  : T extends readonly SceneNode[]
    ? C extends true
      ? readonly SerializedNode<T[number]>[]
      : readonly BareNode[]
    : T;

/**
 * @internal
 * @typeParam T - Node
 * @typeParam C - Children nodes resolved
 */
export type SerializedNode<
  T extends SceneNode,
  K extends KeysOfUnion<SceneNode> = KeysOfUnion<T>,
  C extends boolean = false
> = T extends SceneNode
  ? {
      [key in ApplicablePropertyKey<T, K>]: SerializedNodeProperty<T[key], C>;
    }
  : never;

type Test1_0 = SerializedNode<FrameNode>;
type Test1_1 = SerializedNode<TextNode, 'children' | 'id' | 'characters'>;
type Test1_2 = SerializedNode<FrameNode, 'children' | 'id' | 'characters'>;
// @ts-expect-error - 'characters' is not a property of FrameNode
type Test1_4 = Test1_2['characters'];

type Test1_3 = SerializedNode<FrameNode | TextNode, 'children' | 'id' | 'characters'>;

/**
 * @internal
 * @typeParam T - Node types
 * @typeParam K - Node properties to resolve
 */
type SerializedResolvedNodeBase<
  T extends SceneNodeType | undefined = undefined,
  K extends KeysOfUnion<T> | undefined = undefined
> = K extends keyof T
  ? SerializedNode<T extends SceneNodeType ? ExtractedSceneNode<T> : SceneNode, K>
  : SerializedNode<T extends SceneNodeType ? ExtractedSceneNode<T> : SceneNode>;

type Test2_0 = SerializedResolvedNodeBase<'FRAME'>;
type Test2_1 = SerializedResolvedNodeBase<'FRAME' | 'TEXT', 'id' | 'children' | 'characters'>;
type Test2_2 = SerializedResolvedNodeBase<'FRAME', 'children'>;
type Test2_3 = SerializedResolvedNodeBase<'TEXT', 'characters'>;
type Test2_4 = SerializedResolvedNodeBase<'FRAME' | 'TEXT'>;
type Test2_5 = Extract<Test2_1, { type: 'FRAME' }>;

type AncestorsVisibleMixin = {
  ancestorsVisible: boolean;
};

type ResolveVariablesMixin = {
  boundVariableInstances: readonly Variable[];
};

/**
 * All nodes are serialized into this type before sending to the plugin UI.
 *
 * To
 */
export type SerializedResolvedNode<
  A extends boolean = false,
  V extends boolean = false,
  T extends SceneNodeType | undefined = undefined,
  K extends SceneNodePropertyKey<T> | undefined = undefined
> = A extends true
  ? V extends true
    ? SerializedResolvedNodeBase<T, K> & AncestorsVisibleMixin & ResolveVariablesMixin
    : SerializedResolvedNodeBase<T, K> & AncestorsVisibleMixin
  : SerializedResolvedNodeBase<T, K>;

export type FigmaSelectionHookOptions = {
  /**
   * Only return specific types of nodes.
   *
   * If left undefined, all nodes in the selection will be returned.
   *
   * Default: `undefined`
   */
  nodeTypes?: ReadonlyArray<SceneNode['type']>;
  /**
   * Resolve children nodes of the selection.
   *
   * If used with `nodeTypes`, all nodes of the specified types will be returned as a flat array.
   *
   * Default: `false`
   */
  resolveChildrenNodes?: boolean;
  /**
   * Figma node properties are lazy-loaded, so to use any property you have to resolve it first.
   *
   * Resolving all node properties causes a performance hit, so you can specify which properties you want to resolve.
   *
   * If set to `[]`, no properties will be resolved and you will only get the ids of the nodes.
   *
   * Node methods (such as `getPluginData`) will never be resolved.
   *
   * Default: `all`
   */
  resolveProperties?: ReadonlyArray<SceneNodePropertyKey> | 'all';
  /**
   * Resolve bound variables of the selection.
   *
   * Default: `false`
   */
  resolveVariables?: boolean;
  /**
   * Add `ancestorsVisible` property to all nodes.
   *
   * This property is true if all ancestors of the node are visible.
   *
   * Default: `false`
   */
  addAncestorsVisibleProperty?: boolean;
  /**
   * Options for figma-plugin-api
   *
   * Default: see the RPCOptions type
   */
  apiOptions?: RPCOptions;
};

/**
 * @internal
 */
export type ResolverOptions = Readonly<
  Pick<
    FigmaSelectionHookOptions,
    'nodeTypes' | 'resolveChildrenNodes' | 'resolveProperties' | 'resolveVariables' | 'addAncestorsVisibleProperty'
  >
>;

// https://github.com/microsoft/TypeScript/issues/17002#issuecomment-1529056512
type ArrayType<T> = Extract<true extends T & false ? unknown[] : T extends readonly unknown[] ? T : unknown[], T>;
/**
 * @internal
 */
export const isArray = Array.isArray as <T>(arg: T) => arg is ArrayType<T>;

/**
 * @internal
 */
export const isStrictObject = (arg: unknown): arg is Record<string | number, unknown> => {
  return arg != undefined && typeof arg === 'object' && arg.constructor === Object;
};

/**
 * @internal
 */
export const strictObjectKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>;

/**
 * @internal
 */
export const nodeCanHaveChildren = <T extends SceneNode>(node: T): node is T & ChildrenMixin => {
  return 'children' in node;
};
