import { RPCOptions } from 'figma-plugin-api';

import { FIGMA_MIXED } from './constants';

export type FigmaSelectionListener = (selection: ReadonlyArray<SceneNode>) => void;

export type Mutable<T> = { -readonly [P in keyof T]: T[P] };

export interface ParentChainVisibleMixin {
  parentChainVisible: boolean;
}

export type SerializedNodeProperty<T> = T extends PluginAPI['mixed'] ? typeof FIGMA_MIXED : T;
export type SerializedNode<T extends SceneNode> = {
  [key in keyof T]: SerializedNodeProperty<T[key]>;
};

export type DeserializedNodeProperty<T> = T extends typeof FIGMA_MIXED ? PluginAPI['mixed'] : T;
export type DeserializedNode<T extends SerializedNode<SceneNode>> = {
  [key in keyof T]: DeserializedNodeProperty<T[key]>;
};

export type NodePropertyFilter = <T extends SceneNode>(key: keyof T, node: T) => boolean;

// https://github.com/microsoft/TypeScript/issues/17002#issuecomment-1529056512
type ArrayType<T> = Extract<true extends T & false ? unknown[] : T extends readonly unknown[] ? T : unknown[], T>;
export const isArray = Array.isArray as <T>(arg: T) => arg is ArrayType<T>;

export const isStrictObject = (arg: unknown): arg is Record<string | number, unknown> => {
  return arg != undefined && typeof arg === 'object' && arg.constructor === Object;
};

export const strictObjectKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>;

export const nodeCanHaveChildren = <T extends SceneNode>(node: T): node is T & ChildrenMixin => {
  return 'children' in node;
};

// eslint-disable-next-line @typescript-eslint/ban-types
type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];

export type SceneNodePropertyKey = NonFunctionPropertyNames<SceneNode>;

export type SceneNodeType = SceneNode['type'];

export interface FigmaSelectionHookOptions {
  /**
   * Only return specific types of nodes
   *
   * If left undefined, all nodes in the selection will be returned
   */
  nodeTypes?: ReadonlyArray<SceneNodeType>;
  /**
   * Resolve children nodes of the selection
   *
   * If used with `nodeTypes`, all nodes of the specified types will be returned as a flat array
   *
   * Default: `false`
   */
  resolveChildrenNodes?: boolean;
  /**
   * Figma node properties are lazy-loaded, so to use any property you have to resolve it first
   *
   * This causes a performance hit, so you can specify which properties you want to resolve
   *
   * If set to `[]`, no properties will be resolved and you will only get the ids of the nodes
   *
   * Properties that are functions (such as `getPluginData`) will never be resolved
   *
   * Default: `all`
   */
  resolveProperties?: ReadonlyArray<SceneNodePropertyKey> | 'all';
  /**
   * Resolve bound variables of the selection
   *
   * Default: `false`
   */
  resolveVariables?: boolean;
  /**
   * Add `parentChainVisible` property to nodes who have a hidden node in their parent chain
   *
   * Default: `false`
   */
  addParentChainVisibleProperty?: boolean;
  /**
   * Use `figma.mixed` in plugin UI instead of `FIGMA_MIXED`
   *
   * This causes a performance hit
   *
   * Default: `false`
   */
  useFigmaMixed?: boolean;
  /**
   * Options for figma-plugin-api
   */
  apiOptions?: RPCOptions;
}

export type ResolverOptions = Readonly<
  Pick<
    FigmaSelectionHookOptions,
    'nodeTypes' | 'resolveChildrenNodes' | 'resolveProperties' | 'resolveVariables' | 'addParentChainVisibleProperty'
  >
>;
