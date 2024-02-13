import { DEFAULT_HOOK_OPTIONS, FIGMA_MIXED } from './constants';

import type { RPCOptions } from 'figma-plugin-api';

import {
  ApplicableNonFunctionPropertyKeys,
  ArrayElementUnion,
  ArrayHasElements,
  CombineObjects,
  ExtractProps,
  NonFunctionPropertyKeys
} from './typePrimitives';

// Allow esbuild to drop the import

// For typedoc
export type { RPCOptions } from 'figma-plugin-api';
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

export type BoundVariableKey = keyof NonNullable<SceneNode['boundVariables']>;

export type OptSceneNodeVariables = readonly BoundVariableKey[] | 'all';

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
 *   resolveProperties: ['name', 'characters', 'children']
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
   * Resolve bound variables of the selection.
   *
   * Similarly to `resolveProperties`, you can specify which variables you want to resolve to optimize performance.
   *
   * If set to `[]`, no properties will be resolved and you will only get the ids of the nodes.
   *
   * Default: `[]`
   */
  resolveVariables?: OptSceneNodeVariables;

  /**
   * Resolve children nodes of the selection.
   *
   * If `nodeTypes` is set, all nodes of the specified types will be returned as a flat array.
   *
   * Default: `false`
   */
  resolveChildren?: boolean;

  /**
   * Add `ancestorsVisible` property to all nodes.
   *
   * This property is true if all ancestors of the node are visible.
   *
   * Default: `false`
   */
  addAncestorsVisibleProperty?: boolean;

  /**
   * Get the corresponding plugin data for all nodes.
   *
   * Default: `[]`
   */
  pluginDataKeys?: string[];

  /**
   * Get the corresponding shared plugin data for all nodes.
   *
   * Default: `[]`
   */
  sharedPluginDataKeys?: string[];

  /**
   * Options for figma-plugin-api
   *
   * Default: see the RPCOptions type
   */
  apiOptions?: RPCOptions | undefined;
};

/**
 * @internal
 * With `"exactOptionalPropertyTypes": true` in tsconfig, this type would work by just using `Required<Omit<FigmaSelectionHookOptions, 'apiOptions'>>`.
 *
 * A lot of projects are not set up with it however, so this has better compatibility
 */
export type ResolverOptions = Required<Omit<FigmaSelectionHookOptions, 'nodeTypes' | 'apiOptions'>> &
  Pick<FigmaSelectionHookOptions, 'nodeTypes'>;

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
type AncestorsVisibleMixin<Options extends ResolverOptions> = Options['addAncestorsVisibleProperty'] extends true
  ? {
      ancestorsVisible: boolean;
    }
  : unknown;

/**
 * @internal
 */
type PluginDataMixin<Options extends ResolverOptions> =
  ArrayHasElements<Options['sharedPluginDataKeys']> extends true
    ? {
        pluginData: Record<ArrayElementUnion<Options['pluginDataKeys']>, string>;
      }
    : unknown;

/**
 * @internal
 */
type SharedPluginDataMixin<Options extends ResolverOptions> =
  ArrayHasElements<Options['sharedPluginDataKeys']> extends true
    ? {
        sharedPluginData: Record<ArrayElementUnion<Options['sharedPluginDataKeys']>, string>;
      }
    : unknown;

/**
 * @internal
 */
export type ReplaceTypeInObject<O extends object, T, R> = {
  [K in keyof O]?: O[K] extends T | undefined
    ? R
    : O[K] extends T[] | undefined
      ? R[]
      : O[K] extends object | undefined
        ? ReplaceTypeInObject<NonNullable<O[K]>, T, R>
        : O[K];
};

/**
 * @internal
 */
export type BoundVariables = NonNullable<SceneNode['boundVariables']>;

/**
 * @internal
 */
export type BoundVariablesBareAliases = ExtractProps<BoundVariables, Readonly<VariableAlias> | undefined>;

/**
 * @internal
 */
export type BoundVariablesAliasArrays = ExtractProps<BoundVariableInstances, readonly unknown[] | undefined>;

/**
 * @internal
 */
export type BoundVariableInstances = ReplaceTypeInObject<
  NonNullable<SceneNode['boundVariables']>,
  VariableAlias,
  Variable
>;

/**
 * @internal
 */
type ResolveVariablesMixin<Options extends ResolverOptions> =
  Options['resolveVariables'] extends readonly BoundVariableKey[]
    ? ArrayHasElements<Options['resolveVariables']> extends true
      ? {
          boundVariableInstances?: Pick<BoundVariableInstances, ArrayElementUnion<Options['resolveVariables']>>;
        }
      : unknown
    : {
        boundVariableInstances?: BoundVariableInstances;
      };

/**
 * @internal
 * All Figma nodes are converted to this type for serialization and sending to the plugin UI
 */
export type SerializedResolvedNode<Options extends ResolverOptions> = SerializedResolvedNodeBase<
  SceneNodeFromTypes<Options['nodeTypes']>,
  Options
> &
  AncestorsVisibleMixin<Options> &
  ResolveVariablesMixin<Options> &
  PluginDataMixin<Options> &
  SharedPluginDataMixin<Options>;

/**
 * @internal
 */
export type FigmaSelectionListener = (selection: readonly SerializedResolvedNode<ResolverOptions>[]) => void;

/**
 * Utility type to get the inferred type of the hook using the options object
 */
export type FigmaSelectionHookNode<Options extends FigmaSelectionHookOptions = Record<string, never>> =
  SerializedResolvedNode<CombineObjects<typeof DEFAULT_HOOK_OPTIONS, Options>>;

/**
 * Utility type to get the inferred return type of the hook using the options object
 */
export type FigmaSelectionHookType<Options extends FigmaSelectionHookOptions = Record<string, never>> = [
  readonly FigmaSelectionHookNode<Options>[],
  (selection: readonly BareNode[]) => void
];
