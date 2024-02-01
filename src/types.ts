/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { RPCOptions } from 'figma-plugin-api';

import { FIGMA_MIXED } from './constants';

// For typedoc
export { RPCOptions } from 'figma-plugin-api';
export { FIGMA_MIXED } from './constants';

export type ArrayElementOrUndefined<ArrayType extends readonly unknown[] | undefined> =
  ArrayType extends readonly unknown[] ? ArrayType[number] : undefined;

export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType[number];

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
export type NonFunctionPropertyKeys<T extends object> = {
  [K in KeysOfUnion<T>]: T[K] extends Function ? never : K;
}[KeysOfUnion<T>];

export type BareNode = {
  id: SceneNode['id'];
};

/**
 * @internal
 */
export type FigmaSelectionListener = (selection: ReadonlyArray<SerializedResolvedNode>) => void;

export type SceneNodeType = SceneNode['type'];

export type SceneNodeFromTypes<T extends readonly SceneNodeType[] | undefined> = T extends readonly SceneNodeType[]
  ? ExtractedSceneNode<ArrayElement<T>>
  : SceneNode;

/**
 * Utility type to get only matching node types from the SceneNode union type.
 */
export type ExtractedSceneNode<T extends SceneNodeType> = Extract<SceneNode, { type: T }>;

export type SceneNodePropertyKey<T extends SceneNodeType | undefined = undefined> = NonFunctionPropertyKeys<
  T extends SceneNodeType ? ExtractedSceneNode<T> : SceneNode
>;

type ApplicableNonFunctionPropertyKey<T extends object, K extends string | number | symbol> = K extends keyof T
  ? T[K] extends Function
    ? never
    : K
  : never;

/**
 * @internal
 * @typeParam P - Node property
 * @typeParam T - Node
 * @typeParam K - Node properties to resolve
 * @typeParam C - Children nodes resolved
 */
// TODO: add A and V
// TODO: Narrow children type to only the types that were configured
type SerializedNodeProperty<
  P,
  T extends SceneNode,
  K extends NonFunctionPropertyKeys<T>,
  C extends boolean
> = T extends PluginAPI['mixed']
  ? typeof FIGMA_MIXED
  : P extends readonly SceneNode[]
    ? C extends true
      ? readonly SerializedNode<T, K, C>[]
      : readonly BareNode[]
    : P;

/**
 * @internal
 * @typeParam T - Node
 * @typeParam K - Node properties to resolve
 * @typeParam C - Children nodes resolved
 */
export type SerializedNode<
  T extends SceneNode,
  K extends NonFunctionPropertyKeys<SceneNode> = NonFunctionPropertyKeys<T>,
  C extends boolean = false
> = T extends SceneNode
  ? {
      type: T['type'];
      id: T['id'];
    } & {
      [key in ApplicableNonFunctionPropertyKey<T, K>]: SerializedNodeProperty<T[key], T, K, C>;
    }
  : never;

type Test1_0 = SerializedNode<FrameNode>;
type Test1_1 = SerializedNode<TextNode, 'children' | 'characters'>;
type Test1_2 = SerializedNode<FrameNode, 'children' | 'characters'>;
// @ts-expect-error - 'characters' is not a property of FrameNode
type Test1_4 = Test1_2['characters'];
type Test1_3 = SerializedNode<FrameNode | TextNode, 'name' | 'characters'>;
type Test1_5 = SerializedNode<FrameNode, 'children', true>;

/**
 * @internal
 * @typeParam T - Node
 * @typeParam K - Node properties to resolve
 * @typeParam C - Children nodes resolved
 */
type SerializedResolvedNodeBase<
  T extends SceneNode,
  K extends NonFunctionPropertyKeys<SceneNode> = NonFunctionPropertyKeys<T>,
  C extends boolean = false
> = T extends SceneNode ? SerializedNode<T, K, C> : never;

type Test2_1 = SerializedResolvedNodeBase<FrameNode | TextNode, 'children' | 'characters'>;
type Test2_2 = SerializedResolvedNodeBase<FrameNode, 'children'>;
type Test2_3 = SerializedResolvedNodeBase<TextNode, 'characters'>;
type Test2_4 = SerializedResolvedNodeBase<FrameNode | TextNode>;
type Test2_5 = Extract<Test2_1, { type: 'FRAME' }>;
type Test2_6 = Extract<Test2_1, { type: 'TEXT' }>;

type AncestorsVisibleMixin = {
  ancestorsVisible: boolean;
};

type ResolveVariablesMixin = {
  boundVariableInstances: readonly Variable[];
};

/**
 * All nodes are serialized into this type before sending to the plugin UI.
 *
 * @typeParam T - Node
 * @typeParam K - Node properties to resolve
 * @typeParam C - Children nodes resolved
 * @typeParam A - Add `ancestorsVisible` property to all nodes
 * @typeParam V - Resolve bound variables of the selection
 */
export type SerializedResolvedNode<
  T extends SceneNode = SceneNode,
  K extends NonFunctionPropertyKeys<SceneNode> = NonFunctionPropertyKeys<T>,
  C extends boolean = false,
  A extends boolean = false,
  V extends boolean = false
> = A extends true
  ? V extends true
    ? SerializedResolvedNodeBase<T, K, C> & AncestorsVisibleMixin & ResolveVariablesMixin
    : SerializedResolvedNodeBase<T, K, C> & AncestorsVisibleMixin
  : SerializedResolvedNodeBase<T, K, C>;

type Test3_1 = SerializedResolvedNode<FrameNode | TextNode, 'children' | 'characters', true>;
type Test3_2 = SerializedResolvedNode<FrameNode, 'children'>;
type Test3_3 = SerializedResolvedNode<TextNode, 'characters'>;
type Test3_4 = SerializedResolvedNode<FrameNode | TextNode>;
type Test3_5 = Extract<Test3_1, { type: 'FRAME' }>;
type Test3_6 = Extract<Test3_1, { type: 'TEXT' }>;

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
