import { FIGMA_MIXED } from './constants';
import { nodeCanHaveChildren, strictObjectKeys } from './typeUtils';

import { ResolvedNode, ResolverOptions, SceneNodePropertyKey, SerializedResolvedNode } from './types';

const defaultNodePropertyGetterFilter = <Node extends SceneNode>(key: keyof Node, node: Node): boolean => {
  return (
    // Can only get component property definitions of a component set or non-variant component
    !(key === 'componentPropertyDefinitions' && node.parent?.type === 'COMPONENT_SET') &&
    // reading horizontalPadding and verticalPadding is no longer supported as left and right padding may differ
    key !== 'horizontalPadding' &&
    key !== 'verticalPadding'
  );
};

const resolveNodeProperties = <Node extends SceneNode, const Keys extends readonly SceneNodePropertyKey[]>(
  node: Node,
  propertyKeys?: Keys
): ResolvedNode<Node, Keys> => {
  // Narrow the type from the default which has a mapped type
  const descriptors = Object.getOwnPropertyDescriptors<Node>(Object.getPrototypeOf(node)) as {
    [P in keyof Node]: TypedPropertyDescriptor<Node[P]>;
  };

  // In reality the type is string | number | keyof T from getOwnPropertyDescriptors
  // but we can safely assert a narrower type
  const getterKeys = strictObjectKeys(descriptors);
  let getters = getterKeys.filter((key) => typeof descriptors[key].get === 'function');

  // type has to be included manually as it doesn't have a getter but isn't a static property either
  getters.push('type');

  if (propertyKeys) {
    getters = getters.filter((key) => propertyKeys.includes(key as SceneNodePropertyKey));
  }

  getters = getters.filter((key) => defaultNodePropertyGetterFilter(key, node));

  const objectWithProperties = node;

  for (const getter of getters) {
    objectWithProperties[getter] = node[getter];
  }

  // TypeScript doesn't infer the type correctly on its own
  return objectWithProperties;
};

const resolveAndSerializeNodeProperties = <Node extends SceneNode, const Options extends ResolverOptions>(
  object: Node,
  options: Options,
  ancestorsVisible: boolean
): SerializedResolvedNode<Options> => {
  const { resolveProperties, addAncestorsVisibleProperty } = options;
  // TypeScript doesn't infer the type correctly on its own
  const resolvedNode = resolveNodeProperties(
    object,
    resolveProperties === 'all' ? undefined : resolveProperties
  ) as Record<string, unknown>;

  for (const key of strictObjectKeys(resolvedNode)) {
    if (resolvedNode[key] === figma.mixed) {
      resolvedNode[key] = FIGMA_MIXED;
    }
  }

  if (addAncestorsVisibleProperty) {
    resolvedNode.ancestorsVisible = ancestorsVisible;
  }

  return resolvedNode as SerializedResolvedNode<Options>;
};

// TODO: Resolve variables
export const resolveAndFilterNodes = <const Options extends ResolverOptions>(
  nodes: readonly SceneNode[],
  options: Options,
  ancestorsVisible: boolean
): SerializedResolvedNode<Options>[] => {
  const result: SerializedResolvedNode<Options>[] = [];
  const { nodeTypes, resolveChildren } = options;

  if (nodeTypes !== undefined) {
    nodes.forEach((node) => {
      if (nodeTypes.includes(node.type)) {
        result.push(resolveAndSerializeNodeProperties(node, options, ancestorsVisible && node.visible));
      } else if (nodeCanHaveChildren(node) && resolveChildren) {
        result.push(...resolveAndFilterNodes(node.children, options, ancestorsVisible && node.visible));
      }
    });
  } else {
    nodes.forEach((node) => {
      if (nodeCanHaveChildren(node) && resolveChildren) {
        const newNode = {
          ...resolveAndSerializeNodeProperties(node, options, ancestorsVisible && node.visible),
          children: resolveAndFilterNodes(node.children, options, ancestorsVisible && node.visible)
        };
        result.push(newNode);
      } else {
        result.push(resolveAndSerializeNodeProperties(node, options, ancestorsVisible && node.visible));
      }
    });
  }

  return result;
};
