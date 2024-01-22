import { FIGMA_MIXED } from './constants';

import {
  Mutable,
  nodeCanHaveChildren,
  strictObjectKeys,
  ResolverOptions,
  SceneNodePropertyKey,
  SerializedResolvedNode
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

const resolveNodeProperties = <T extends SceneNode>(node: T, propertyKeys?: readonly SceneNodePropertyKey[]): T => {
  console.log(node);
  const descriptors = Object.getOwnPropertyDescriptors<T>(Object.getPrototypeOf(node));

  // In reality the type is string | number | keyof T from getOwnPropertyDescriptors
  // but we can safely assert a narrower type
  const getterKeys = strictObjectKeys(descriptors) as (keyof T)[];
  let getters = getterKeys.filter((key: keyof T) => typeof descriptors[key].get === 'function');

  // type is not included in the node prototype, so we have to add it to match the type definition
  getters.push('type');

  if (propertyKeys) {
    getters = getters.filter((key) => propertyKeys.includes(key as SceneNodePropertyKey));
  }

  getters = getters.filter((key) => defaultNodePropertyGetterFilter(key, node));

  const objectWithProperties: Mutable<T> = {
    ...node
  };
  for (const getter of getters) {
    objectWithProperties[getter] = node[getter];
  }

  console.log(objectWithProperties);

  return objectWithProperties;
};

const resolveAndSerializeNodeProperties = (
  object: SceneNode,
  propertyKeys?: readonly SceneNodePropertyKey[],
  ancestorsVisible: boolean = true
): SerializedResolvedNode => {
  // The type for resolvedNode is SceneNode, but we need to assert the Serialized type to allow the mixed type conversion
  const resolvedNode = resolveNodeProperties(object, propertyKeys) as Mutable<SerializedResolvedNode>;

  for (const key of strictObjectKeys(resolvedNode)) {
    // @ts-expect-error for union types, keyof only gives the common property keys of the union members
    // figma.mixed is not used in the common properties so this gives a TS 2367 (no overlap) error
    // If we use a utility type to 'smoosh' the union types together, we lose the exact property types
    if (resolvedNode[key] === figma.mixed) {
      // @ts-expect-error string is not assignable to never error
      // This could possibly be avoided if the above check was also a type guard
      resolvedNode[key] = FIGMA_MIXED;
    }
  }

  // TODO: Make this optional
  resolvedNode.ancestorsVisible = ancestorsVisible;

  return resolvedNode;
};

// TODO: Resolve variables
// TODO: make ancestorsVisible optional
export const resolveAndFilterNodes = (
  nodes: readonly SceneNode[],
  options: ResolverOptions,
  ancestorsVisible: boolean = true
): readonly SerializedResolvedNode[] => {
  const result: SerializedResolvedNode[] = [];
  const { nodeTypes, resolveChildrenNodes, resolveProperties: propertyKeys } = options;

  if (nodeTypes !== undefined) {
    nodes.forEach((node) => {
      if (nodeTypes.includes(node.type)) {
        result.push(resolveAndSerializeNodeProperties(node, propertyKeys === 'all' ? undefined : propertyKeys));
      } else if (nodeCanHaveChildren(node) && resolveChildrenNodes) {
        result.push(...resolveAndFilterNodes(node.children, options, ancestorsVisible && node.visible));
      }
    });
  } else {
    nodes.forEach((node) => {
      if (nodeCanHaveChildren(node) && resolveChildrenNodes) {
        const newNode = {
          ...resolveAndSerializeNodeProperties(node, propertyKeys === 'all' ? undefined : propertyKeys),
          children: resolveAndFilterNodes(node.children, options, ancestorsVisible && node.visible)
        } as SerializedResolvedNode;
        result.push(newNode);
      } else {
        result.push(resolveAndSerializeNodeProperties(node, propertyKeys === 'all' ? undefined : propertyKeys));
      }
    });
  }

  return result;
};
