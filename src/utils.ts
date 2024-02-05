import { FIGMA_MIXED } from './constants';
import { nodeCanHaveChildren, strictObjectKeys } from './typeUtils';

import {
  SceneNodePropertyKey,
  SerializedResolvedNode,
  SceneNodeFromTypes,
  OptNodeTypes,
  OptResolvedPropKeys,
  OptResolvedPropKeysToPropKeysOnly,
  ResolvedNode,
  ResolverOptions
} from './types';

const defaultNodePropertyGetterFilter = <T extends SceneNode>(key: keyof T, node: T): boolean => {
  return (
    // Can only get component property definitions of a component set or non-variant component
    !(key === 'componentPropertyDefinitions' && node.parent?.type === 'COMPONENT_SET') &&
    // reading horizontalPadding and verticalPadding is no longer supported as left and right padding may differ
    key !== 'horizontalPadding' &&
    key !== 'verticalPadding'
  );
};

const resolveNodeProperties = <T extends SceneNode, K extends readonly SceneNodePropertyKey[] | undefined>(
  node: T,
  propertyKeys?: K
): ResolvedNode<T, K> => {
  const descriptors = Object.getOwnPropertyDescriptors<T>(Object.getPrototypeOf(node));

  // In reality the type is string | number | keyof T from getOwnPropertyDescriptors
  // but we can safely assert a narrower type
  const getterKeys = strictObjectKeys(descriptors) as (keyof T)[];
  let getters = getterKeys.filter((key: keyof T) => typeof descriptors[key].get === 'function');

  // type has to be included manually as it doesn't have a getter but isn't a static property either
  getters.push('type');

  if (propertyKeys) {
    getters = getters.filter((key) => propertyKeys.includes(key as SceneNodePropertyKey));
  }

  getters = getters.filter((key) => defaultNodePropertyGetterFilter(key, node));

  const objectWithProperties: Partial<ResolvedNode<T, K>> = node;

  for (const getter of getters) {
    // @ts-expect-error TS gets confused by the getter type
    objectWithProperties[getter] = node[getter];
  }

  // TypeScript doesn't infer the type correctly on its own
  return objectWithProperties as ResolvedNode<T, K>;
};

const resolveAndSerializeNodeProperties = <
  T extends SceneNode,
  NodeTypes extends OptNodeTypes,
  ResolvedPropKeys extends OptResolvedPropKeys<NodeTypes>,
  ResolveChildren extends boolean,
  AddAncestorsVisibleProp extends boolean,
  ResolveVariables extends boolean,
  Options extends ResolverOptions<[T['type']]>
>(
  object: T,
  options: Options,
  propertyKeys?: readonly SceneNodePropertyKey[],
  ancestorsVisible: boolean = true
): SerializedResolvedNode<
  T,
  OptResolvedPropKeysToPropKeysOnly<[T['type']], ResolvedPropKeys>,
  ResolveChildren,
  AddAncestorsVisibleProp,
  ResolveVariables
> => {
  // TypeScript doesn't infer the type correctly on its own
  const resolvedNode = resolveNodeProperties(object, propertyKeys) as unknown as SerializedResolvedNode<
    T,
    OptResolvedPropKeysToPropKeysOnly<[T['type']], ResolvedPropKeys>,
    ResolveChildren,
    AddAncestorsVisibleProp,
    ResolveVariables
  >;

  for (const key of strictObjectKeys(resolvedNode)) {
    if (resolvedNode[key] === figma.mixed) {
      // @ts-expect-error needs a type guard
      resolvedNode[key] = FIGMA_MIXED;
    }
  }

  if (options.addAncestorsVisibleProperty) {
    // @ts-expect-error needs a type guard
    resolvedNode.ancestorsVisible = ancestorsVisible;
  }

  return resolvedNode;
};

// TODO: Resolve variables
export const resolveAndFilterNodes = <
  NodeTypes extends OptNodeTypes,
  ResolvedPropKeys extends OptResolvedPropKeys<NodeTypes>,
  ResolveChildren extends boolean,
  AddAncestorsVisibleProp extends boolean,
  ResolveVariables extends boolean,
  Options extends {
    nodeTypes?: NodeTypes;
    resolveChildrenNodes: ResolveChildren;
    resolveProperties: ResolvedPropKeys;
    resolveVariables: ResolveVariables;
    addAncestorsVisibleProperty: AddAncestorsVisibleProp;
  }
>(
  nodes: readonly SceneNode[],
  options: Options,
  ancestorsVisible: boolean = true
): readonly SerializedResolvedNode<
  SceneNodeFromTypes<NodeTypes>,
  OptResolvedPropKeysToPropKeysOnly<NodeTypes, ResolvedPropKeys>,
  ResolveChildren,
  AddAncestorsVisibleProp,
  ResolveVariables
>[] => {
  const result: SerializedResolvedNode<
    SceneNodeFromTypes<NodeTypes>,
    OptResolvedPropKeysToPropKeysOnly<NodeTypes, ResolvedPropKeys>,
    ResolveChildren,
    AddAncestorsVisibleProp,
    ResolveVariables
  >[] = [];
  const { nodeTypes, resolveChildrenNodes, resolveProperties: propertyKeys } = options;

  if (nodeTypes !== undefined) {
    nodes.forEach((node) => {
      if (nodeTypes.includes(node.type)) {
        result.push(
          resolveAndSerializeNodeProperties(node, options, propertyKeys === 'all' ? undefined : propertyKeys)
        );
      } else if (nodeCanHaveChildren(node) && resolveChildrenNodes) {
        result.push(...resolveAndFilterNodes(node.children, options, ancestorsVisible && node.visible));
      }
    });
  } else {
    nodes.forEach((node) => {
      if (nodeCanHaveChildren(node) && resolveChildrenNodes) {
        const newNode: SerializedResolvedNode<
          SceneNodeFromTypes<NodeTypes>,
          OptResolvedPropKeysToPropKeysOnly<NodeTypes, ResolvedPropKeys>,
          ResolveChildren,
          AddAncestorsVisibleProp,
          ResolveVariables
        > = {
          ...resolveAndSerializeNodeProperties(node, options, propertyKeys === 'all' ? undefined : propertyKeys),
          children: resolveAndFilterNodes(node.children, options, ancestorsVisible && node.visible)
        };
        result.push(newNode);
      } else {
        result.push(
          resolveAndSerializeNodeProperties(node, options, propertyKeys === 'all' ? undefined : propertyKeys)
        );
      }
    });
  }

  return result;
};
