/* eslint-disable @typescript-eslint/ban-types */

import { RPCOptions } from 'figma-plugin-api';

import { FIGMA_MIXED } from './constants';

// For typedoc
export { RPCOptions } from 'figma-plugin-api';
export { FIGMA_MIXED } from './constants';

/**
 * @internal
 */
export type Mutable<T extends object> = { -readonly [P in keyof T]: T[P] };

/**
 * @internal
 * https://github.com/microsoft/TypeScript/issues/17002#issuecomment-1529056512
 */
type ArrayType<T> = Extract<true extends T & false ? unknown[] : T extends readonly unknown[] ? T : unknown[], T>;

/**
 * @internal
 * Returns array elements as union
 */
export type ArrayElementUnion<T extends readonly unknown[]> = T[number];

/**
 * @internal
 * Returns array elements as union or undefined
 */
export type ArrayElementUnionOrUndefined<T extends readonly unknown[] | undefined> = T extends readonly unknown[]
  ? ArrayElementUnion<T>
  : undefined;

/**
 * @internal
 * Get all keys of a union type, instead of just the common keys that `keyof` returns
 */
type KeysOfUnion<T> = T extends infer P ? keyof P : never;

/**
 * @internal
 * Gets all property keys of an object that are not functions.
 *
 * When given a union type, it will return all possible property names from the union types.
 */
export type NonFunctionPropertyKeys<T extends object> = {
  [K in KeysOfUnion<T>]: T[K] extends Function ? never : K;
}[KeysOfUnion<T>];

/**
 * @internal
 */
type SceneNodeType = SceneNode['type'];

/**
 * @internal
 * Utility type to get only matching node types from the SceneNode union type.
 */
type ExtractedSceneNode<T extends SceneNodeType> = Extract<SceneNode, { type: T }>;

/**
 * @internal
 * Get the a SceneNode subset from an array of SceneNode type strings
 */
export type SceneNodeFromTypes<T extends readonly SceneNodeType[] | undefined> = T extends readonly SceneNodeType[]
  ? ExtractedSceneNode<ArrayElementUnion<T>>
  : SceneNode;

/**
 * Get the non-function property keys for a SceneNode
 */
export type SceneNodePropertyKey<T extends SceneNodeType | undefined = undefined> = NonFunctionPropertyKeys<
  T extends SceneNodeType ? ExtractedSceneNode<T> : SceneNode
>;

/**
 * @internal
 * Get the non-function property keys for an object from a set of property keys that may be larger than the keys of the object
 *
 * Does not work with union types
 */
type ApplicableNonFunctionPropertyKey<T extends object, K extends string | number | symbol> = K extends keyof T
  ? T[K] extends Function
    ? never
    : K
  : never;

/**
 * @internal
 * Describes the properties of an unresolved node
 */
export type BareNode = Pick<SceneNode, 'id'>;

/**
 * @internal
 * Get the serialized property value type for a SceneNode property
 */
// TODO: add AddAncestorsVisibleProp and ResolveVariables
// TODO: Narrow children type to only the types that were configured
type SerializedNodeProperty<
  Prop,
  Node extends SceneNode,
  ResolvedPropKeys extends NonFunctionPropertyKeys<SceneNode>,
  ResolveChildren extends boolean
> = Prop extends PluginAPI['mixed']
  ? typeof FIGMA_MIXED
  : Prop extends readonly SceneNode[]
    ? ResolveChildren extends true
      ? readonly SerializedNode<Node, ResolvedPropKeys, ResolveChildren>[]
      : readonly BareNode[]
    : Prop;

/**
 * @internal
 */
export type SerializedNode<
  Node extends SceneNode,
  ResolvedPropKeys extends NonFunctionPropertyKeys<SceneNode>,
  ResolveChildren extends boolean
> = Node extends SceneNode
  ? {
      type: Node['type'];
      id: Node['id'];
    } & {
      [Key in ApplicableNonFunctionPropertyKey<Node, ResolvedPropKeys>]: SerializedNodeProperty<
        Node[Key],
        Node,
        ResolvedPropKeys,
        ResolveChildren
      >;
    }
  : never;

/**
 * @internal
 */
export type ResolvedNode<
  Node extends SceneNode,
  ResolvedPropKeys extends readonly SceneNodePropertyKey[] | undefined = undefined
> = Pick<
  Node,
  ResolvedPropKeys extends readonly SceneNodePropertyKey[]
    ? ApplicableNonFunctionPropertyKey<Node, ArrayElementUnion<ResolvedPropKeys>> | 'id' | 'type'
    : ApplicableNonFunctionPropertyKey<Node, SceneNodePropertyKey>
>;

/**
 * @internal
 */
export type SerializedResolvedNodeBase<
  Node extends SceneNode,
  ResolvedPropKeys extends NonFunctionPropertyKeys<SceneNode>,
  ResolveChildren extends boolean
> = Node extends SceneNode ? SerializedNode<Node, ResolvedPropKeys, ResolveChildren> : never;

type AncestorsVisibleMixin = {
  ancestorsVisible: boolean;
};

type ResolveVariablesMixin = {
  boundVariableInstances: readonly Variable[];
};

/**
 * All nodes are serialized into this type before sending to the plugin UI.
 */
export type SerializedResolvedNode<
  Node extends SceneNode = SceneNode,
  ResolvedPropKeys extends NonFunctionPropertyKeys<SceneNode> = NonFunctionPropertyKeys<Node>,
  ResolveChildren extends boolean = false,
  AddAncestorsVisibleProp extends boolean = false,
  ResolveVariables extends boolean = false
> = AddAncestorsVisibleProp extends true
  ? ResolveVariables extends true
    ? SerializedResolvedNodeBase<Node, ResolvedPropKeys, ResolveChildren> &
        AncestorsVisibleMixin &
        ResolveVariablesMixin
    : SerializedResolvedNodeBase<Node, ResolvedPropKeys, ResolveChildren> & AncestorsVisibleMixin
  : SerializedResolvedNodeBase<Node, ResolvedPropKeys, ResolveChildren>;

/**
 * @internal
 */
export type FigmaSelectionListener = <
  Node extends SceneNode,
  ResolvedPropKeys extends NonFunctionPropertyKeys<SceneNode>,
  ResolveChildren extends boolean,
  AddAncestorsVisibleProp extends boolean,
  ResolveVariables extends boolean
>(
  selection: ReadonlyArray<
    SerializedResolvedNode<Node, ResolvedPropKeys, ResolveChildren, AddAncestorsVisibleProp, ResolveVariables>
  >
) => void;

/**
 * @internal
 */
export type OptNodeTypes = readonly SceneNodeType[] | undefined;

/**
 * @internal
 */
export type OptResolvedPropKeys<T extends OptNodeTypes> =
  | SceneNodePropertyKey<ArrayElementUnion<T extends readonly SceneNode['type'][] ? T : never>>[]
  | 'all';

/**
 * @internal
 */
export type OptResolvedPropKeysToPropKeysOnly<
  T extends OptNodeTypes,
  K extends OptResolvedPropKeys<T>
> = K extends 'all'
  ? SceneNodePropertyKey<ArrayElementUnionOrUndefined<T>>
  : ArrayElementUnion<K extends 'all' ? never : K>;

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
  resolveChildren?: boolean;
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
  resolveProperties?: readonly SceneNodePropertyKey[] | 'all';
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

// Type guards

/**
 * @internal
 */
export const isArray = Array.isArray as <T>(arg: T) => arg is ArrayType<T>;

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
