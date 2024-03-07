import { DEFAULT_HOOK_OPTIONS, FIGMA_MIXED, ListenerEventType } from './constants';

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

export type OptSharedPluginDataKeys = Record<string, string[]>;

/**
 * Use `satisfies` (for TS >= 4.9) with this type to allow for type checking the options object
 * while the type of the object remains exact.
 *
 * This allows the hook to infer the type of the returned nodes correctly.
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
   * The object keys are treated as namespaces and the array values as keys.
   *
   * Default: `{}`
   */
  sharedPluginDataKeys?: OptSharedPluginDataKeys;

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

// TODO: Add mainComponent resolving for component instances
type SerializedNodeProperty<Prop, Options extends ResolverOptions> = Prop extends PluginAPI['mixed']
  ? typeof FIGMA_MIXED
  : Prop extends readonly SceneNode[]
    ? Options['resolveChildren'] extends true
      ? readonly SerializedNode<SceneNodeFromTypes<Options['nodeTypes']>, Options>[]
      : readonly BareNode[]
    : Prop extends SceneNode
      ? BareNode
      : Prop;

type ApplicableNodeKeys<
  Node extends SceneNode,
  Properties extends OptSceneNodeProperties
> = Properties extends readonly SceneNodePropertyKey[]
  ? ApplicableNonFunctionPropertyKeys<Node, ArrayElementUnion<Properties>>
  : NonFunctionPropertyKeys<Node>;

type ResolvePropertiesDefined<
  Node extends SceneNode,
  Options extends ResolverOptions
> = Options['resolveProperties'] extends 'all'
  ? true
  : Options['resolveProperties'] extends SceneNodePropertyKey[]
    ? ApplicableNodeKeys<Node, Options['resolveProperties']> extends never
      ? false
      : true
    : false;

/**
 * @internal
 */
// TODO: Ensure the children prop gets picked up even if it's not included in resolveProperties
/*
& Options['resolveChildren'] extends true
    ?
      Node extends ChildrenMixin
      ? {
          children: SerializedNodeProperty<Node['children'], Options>;
        }
      : unknown
    : unknown
*/
export type SerializedNode<Node extends SceneNode, Options extends ResolverOptions> = Node extends SceneNode
  ? {
      type: Node['type'];
      id: Node['id'];
    } & (ResolvePropertiesDefined<Node, Options> extends true
      ? {
          [Key in Options['resolveProperties'] extends SceneNodePropertyKey[]
            ? ApplicableNodeKeys<Node, Options['resolveProperties']>
            : keyof Node]: SerializedNodeProperty<Node[Key], Options>;
        }
      : unknown)
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
export type SerializedResolvedNodeBase<Node extends SceneNode, Options extends ResolverOptions> = Node extends SceneNode
  ? SerializedNode<Node, Options>
  : never;

type AncestorsVisibleMixin<Options extends ResolverOptions> = Options['addAncestorsVisibleProperty'] extends true
  ? {
      ancestorsVisible: boolean;
    }
  : unknown;

type PluginDataMixin<Options extends ResolverOptions> =
  ArrayHasElements<Options['pluginDataKeys']> extends true
    ? {
        pluginData: Record<ArrayElementUnion<Options['pluginDataKeys']>, string>;
      }
    : unknown;

/**
 * @internal
 */
export type SharedPluginData<K extends OptSharedPluginDataKeys> = {
  [N in keyof K]: Record<ArrayElementUnion<K[N]>, string>;
};

type SharedPluginDataMixin<Options extends ResolverOptions> =
  Options['sharedPluginDataKeys'] extends Record<string, never>
    ? unknown
    : {
        sharedPluginData: SharedPluginData<Options['sharedPluginDataKeys']>;
      };

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

type SelectionListenerStartParams = [ListenerEventType.Start, undefined];
type SelectionListenerFinishParams = [ListenerEventType.Finish, readonly SerializedResolvedNode<ResolverOptions>[]];

/**
 * @internal
 */
export type FigmaSelectionListener = (...params: SelectionListenerStartParams | SelectionListenerFinishParams) => void;

/**
 * Utility type to get the inferred type of a node from the hook using the options object
 */
export type FigmaSelectionHookNode<Options extends FigmaSelectionHookOptions = Record<string, never>> =
  SerializedResolvedNode<CombineObjects<typeof DEFAULT_HOOK_OPTIONS, Options>>;

/**
 * Utility type to get the inferred return type of the hook using the options object
 *
 * [0] - Selected resolved nodes
 *
 * [1] - A function to set the selection
 *
 * [2] - Loading state
 */
export type FigmaSelectionHookType<Options extends FigmaSelectionHookOptions = Record<string, never>> = [
  readonly FigmaSelectionHookNode<Options>[],
  (selection: readonly BareNode[]) => void,
  boolean
];
