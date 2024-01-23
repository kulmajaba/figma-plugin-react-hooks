import { RPCOptions } from 'figma-plugin-api';

import { FIGMA_MIXED } from './constants';

// For typedoc
export { RPCOptions } from 'figma-plugin-api';
export { FIGMA_MIXED } from './constants';

/**
 * @internal
 */
export type FigmaSelectionListener = (selection: ReadonlyArray<SerializedResolvedNode>) => void;

/**
 * @internal
 */
export type Mutable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * @internal
 */
export type SerializedNodeProperty<T> = T extends PluginAPI['mixed'] ? typeof FIGMA_MIXED : T;
/**
 * @internal
 */
export type SerializedNode<T extends SceneNode> = {
  [key in keyof T]: SerializedNodeProperty<T[key]>;
};

export type SerializedResolvedNode = SerializedNode<SceneNode> & {
  ancestorsVisible?: boolean;
  children?: readonly SerializedResolvedNode[];
};

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

// eslint-disable-next-line @typescript-eslint/ban-types
type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];

/**
 * @internal
 */
export type SceneNodePropertyKey = NonFunctionPropertyNames<SceneNode>;

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
