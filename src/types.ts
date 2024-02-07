import { RPCOptions } from 'figma-plugin-api';

import { FIGMA_MIXED } from './constants';
import { ApplicableNonFunctionPropertyKeys, ArrayElementUnion, NonFunctionPropertyKeys } from './typePrimitives';

// For typedoc
export { RPCOptions } from 'figma-plugin-api';
export { FIGMA_MIXED } from './constants';

/**
 * @internal
 * Describes the properties of an unresolved node
 */
export type BareNode = Pick<SceneNode, 'id'>;

type SceneNodeType = SceneNode['type'];

/**
 * @internal
 */
export type SceneNodeFromTypes<T extends readonly SceneNodeType[] | undefined = undefined> = T extends undefined
  ? SceneNode
  : // @ts-expect-error If the check is flipped, the type widens to SceneNode. On simpler types this doesn't happen but it seems like Extract does this.
    ExtractedSceneNode<ArrayElementUnion<T>>;

/**
 * @internal
 * Utility type to get only matching node types from the SceneNode union type.
 */
type ExtractedSceneNode<T extends SceneNodeType> = Extract<SceneNode, { type: T }>;

/**
 * @internal
 * Get the non-function property keys for a SceneNode
 */
export type SceneNodePropertyKey<T extends SceneNodeType | undefined = undefined> = NonFunctionPropertyKeys<
  T extends SceneNodeType ? ExtractedSceneNode<T> : SceneNode
>;

export type OptSceneNodeProperties = readonly SceneNodePropertyKey[] | 'all';

/**
 * Use `satisfies` (for TS >= 4.9) with this type to allow for type checking the options object
 * while the type of the object remains exact.
 *
 * This allows us to infer the type of the returned nodes correctly.
 *
 * Example:
 * ```typescript
 * const options = {
 *   nodeTypes: ['TEXT', 'FRAME'],
 *   resolveProperties: ['name', 'characters', 'children]
 * } satisfies FigmaSelectionHookOptions;
 * ```
 */
export type FigmaSelectionHookOptions = {
  /**
   * Only return specific types of nodes.
   *
   * If left undefined, all nodes in the selection will be returned.
   *
   * Default: `undefined`
   */
  nodeTypes?: readonly SceneNodeType[] | undefined;
  /**
   * Figma node properties are lazy-loaded, so to use any property you have to resolve it first.
   *
   * Resolving all node properties causes a performance hit, so you can specify which properties you want to resolve.
   *
   * If set to `[]`, no properties will be resolved and you will only get the ids of the nodes.
   *
   * Node methods (such as `getPluginData`) will never be resolved.
   *
   * Default: `'all'`
   */
  resolveProperties?: OptSceneNodeProperties;
  /**
   * Resolve children nodes of the selection.
   *
   * If used with `nodeTypes`, all nodes of the specified types will be returned as a flat array.
   *
   * Default: `false`
   */
  resolveChildren?: boolean;
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
  apiOptions?: RPCOptions | undefined;
};

/**
 * @internal
 */
export type ResolverOptions = Omit<FigmaSelectionHookOptions, 'apiOptions'>;

type SerializedNodeProperty<
  Prop,
  Node extends SceneNode,
  Options extends ResolverOptions
> = Prop extends PluginAPI['mixed']
  ? typeof FIGMA_MIXED
  : Prop extends readonly SceneNode[]
    ? Options['resolveChildren'] extends true
      ? readonly SerializedNode<Node, Options>[]
      : readonly BareNode[]
    : Prop;

type ApplicableNodeKeys<
  Node extends SceneNode,
  Properties extends OptSceneNodeProperties
> = Properties extends readonly SceneNodePropertyKey[]
  ? ApplicableNonFunctionPropertyKeys<Node, ArrayElementUnion<Properties>>
  : NonFunctionPropertyKeys<Node>;

/**
 * @internal
 */
export type SerializedNode<Node extends SceneNode, Options extends ResolverOptions> = Node extends SceneNode
  ? {
      type: Node['type'];
      id: Node['id'];
    } & {
      [Key in Options['resolveProperties'] extends SceneNodePropertyKey[]
        ? ApplicableNodeKeys<Node, Options['resolveProperties']>
        : keyof Node]: SerializedNodeProperty<Node[Key], Node, Options>;
    }
  : never;

/**
 * @internal
 */
export type ResolvedNode<
  Node extends SceneNode,
  Keys extends readonly SceneNodePropertyKey[] | undefined = undefined
> = Pick<
  Node,
  Keys extends readonly SceneNodePropertyKey[]
    ? ApplicableNonFunctionPropertyKeys<Node, ArrayElementUnion<Keys>> | 'id' | 'type'
    : ApplicableNonFunctionPropertyKeys<Node, SceneNodePropertyKey>
>;

/**
 * @internal
 */
type SerializedResolvedNodeBase<Node extends SceneNode, Options extends ResolverOptions> = Node extends SceneNode
  ? SerializedNode<Node, Options>
  : never;

/**
 * @internal
 */
type AncestorsVisibleMixin = {
  ancestorsVisible: boolean;
};

/**
 * @internal
 */
type ResolveVariablesMixin = {
  boundVariableInstances: readonly Variable[];
};

/**
 * @internal
 * All Figma nodes are converted to this type for serialization and sending to the plugin UI
 */
export type SerializedResolvedNode<Options extends ResolverOptions> =
  Options['addAncestorsVisibleProperty'] extends true
    ? Options['resolveVariables'] extends true
      ? SerializedResolvedNodeBase<SceneNodeFromTypes<Options['nodeTypes']>, Options> &
          AncestorsVisibleMixin &
          ResolveVariablesMixin
      : SerializedResolvedNodeBase<SceneNodeFromTypes<Options['nodeTypes']>, Options> & AncestorsVisibleMixin
    : SerializedResolvedNodeBase<SceneNodeFromTypes<Options['nodeTypes']>, Options>;

/**
 * @internal
 */
export type FigmaSelectionListener = (selection: readonly SerializedResolvedNode<ResolverOptions>[]) => void;
