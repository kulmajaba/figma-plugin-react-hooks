import { FIGMA_MIXED } from './constants';

import {
  Mutable,
  nodeCanHaveChildren,
  strictObjectKeys,
  NodePropertyFilter,
  SerializedNodeProperty,
  ResolverOptions,
  SceneNodePropertyKey,
  SerializedResolvedNode
} from './types';

const defaultNodePropertyGetterFilter: NodePropertyFilter = (key, node) => {
  return (
    // Can only get component property definitions of a component set or non-variant component
    !(key === 'componentPropertyDefinitions' && node.parent?.type === 'COMPONENT_SET') &&
    // reading horizontalPadding and verticalPadding is no longer supported as left and right padding may differ
    key !== 'horizontalPadding' &&
    key !== 'verticalPadding'
  );
};

const resolveNodeProperties = <T extends SceneNode>(object: T, propertyKeys?: readonly SceneNodePropertyKey[]): T => {
  console.log(object);
  const descriptors = Object.getOwnPropertyDescriptors<T>(Object.getPrototypeOf(object));

  // In reality the type is string | number | keyof T from getOwnPropertyDescriptors
  // but we can safely assert a narrower type
  const getterKeys = strictObjectKeys(descriptors) as (keyof T)[];
  let getters = getterKeys.filter((key: keyof T) => typeof descriptors[key].get === 'function');

  // Type is not included in the node prototype and is only evaluated when necessary
  getters.push('type');

  if (propertyKeys) {
    getters = getters.filter((key) => propertyKeys.includes(key as SceneNodePropertyKey));
  }

  getters = getters.filter((key) => defaultNodePropertyGetterFilter(key, object));

  const objectWithProperties: Mutable<T> = {
    ...object
  };
  for (const getter of getters) {
    objectWithProperties[getter] = object[getter];
  }

  console.log(objectWithProperties);

  return objectWithProperties;
};

const resolveAndSerializeNodeProperties = (
  object: SceneNode,
  propertyKeys?: readonly SceneNodePropertyKey[],
  parentChainVisible: boolean = true
): SerializedResolvedNode => {
  // The type for resolvedNode is SceneNode, but we need to assert the Serialized type to allow the mixed type conversion
  const resolvedNode = resolveNodeProperties(object, propertyKeys) as Mutable<SerializedResolvedNode>;

  for (const key of strictObjectKeys(resolvedNode)) {
    // @ts-expect-error for union types, keyof only gives the common property keys of the union members
    // figma.mixed is not used in the common properties so this gives a 2367 (no overlap) error
    // If we use a utility type to 'smoosh' the union types together, we lose the property types
    if (resolvedNode[key] === figma.mixed) {
      // @ts-expect-error SerializedNodeProperty is not assignable to 'never' error
      resolvedNode[key] = FIGMA_MIXED as SerializedNodeProperty<SceneNode[keyof SceneNode]>;
    }
  }

  // TODO: Make this optional
  resolvedNode.parentChainVisible = parentChainVisible;

  return resolvedNode;
};

// TODO: Resolve variables
// TODO: make parentChainVisible optional
export const resolveAndFilterNodes = (
  nodes: readonly SceneNode[],
  options: ResolverOptions,
  parentChainVisible: boolean = true
): readonly SerializedResolvedNode[] => {
  const result: SerializedResolvedNode[] = [];
  const { nodeTypes, resolveChildrenNodes, resolveProperties: propertyKeys } = options;

  if (nodeTypes !== undefined) {
    nodes.forEach((node) => {
      if (nodeTypes.includes(node.type)) {
        result.push(resolveAndSerializeNodeProperties(node, propertyKeys === 'all' ? undefined : propertyKeys));
      } else if (nodeCanHaveChildren(node) && resolveChildrenNodes) {
        result.push(...resolveAndFilterNodes(node.children, options, parentChainVisible && node.visible));
      }
    });
  } else {
    nodes.forEach((node) => {
      if (nodeCanHaveChildren(node) && resolveChildrenNodes) {
        const newNode = {
          ...resolveAndSerializeNodeProperties(node, propertyKeys === 'all' ? undefined : propertyKeys),
          children: resolveAndFilterNodes(node.children, options, parentChainVisible && node.visible)
        } as SerializedResolvedNode;
        result.push(newNode);
      } else {
        result.push(resolveAndSerializeNodeProperties(node, propertyKeys === 'all' ? undefined : propertyKeys));
      }
    });
  }

  return result;
};
