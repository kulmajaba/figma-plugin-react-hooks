import { FIGMA_MIXED } from './constants';

import {
  Mutable,
  nodeCanHaveChildren,
  strictObjectKeys,
  NodePropertyFilter,
  SerializedNode,
  SerializedNodeProperty,
  DeserializedNode,
  DeserializedNodeProperty,
  ResolverOptions,
  SceneNodePropertyKey,
  ParentChainVisibleMixin
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
  const descriptors = Object.getOwnPropertyDescriptors<T>(Object.getPrototypeOf(object));

  // In reality the type is string | number | keyof T from getOwnPropertyNames
  // but we can safely assert a narrower type
  const getterKeys = strictObjectKeys(descriptors) as (keyof T)[];
  let getters = getterKeys.filter((key: keyof T) => typeof descriptors[key].get === 'function');

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

  return objectWithProperties as T;
};

const resolveAndSerializeNodeProperties = (
  object: SceneNode,
  propertyKeys?: readonly SceneNodePropertyKey[],
  parentChainVisible: boolean = true
): SerializedNode<SceneNode & ParentChainVisibleMixin> => {
  // The type for resolvedNode is SceneNode, but we need to assert the Serialized type to allow the mixed type conversion
  const resolvedNode = resolveNodeProperties(object, propertyKeys) as Mutable<
    SerializedNode<SceneNode & ParentChainVisibleMixin>
  >;

  const test: (typeof resolvedNode)['parentChainVisible'] = true;
  console.log(test);

  for (const key of strictObjectKeys(resolvedNode)) {
    // @ts-expect-error the type is asserted as serialized earlier
    if (resolvedNode[key] === figma.mixed) {
      // @ts-expect-error I don't know why this errors
      resolvedNode[key] = FIGMA_MIXED as SerializedNodeProperty<SceneNode[keyof SceneNode]>;
    }
  }

  resolvedNode.parentChainVisible = parentChainVisible;

  return resolvedNode;
};

export const deSerializeNode = <T extends SerializedNode<SceneNode>>(object: T): DeserializedNode<T> => {
  const deSerializedObject = {
    ...object
  } as DeserializedNode<T>;

  for (const key of strictObjectKeys(deSerializedObject)) {
    if (deSerializedObject[key] === FIGMA_MIXED) {
      deSerializedObject[key] = figma.mixed as DeserializedNodeProperty<T[keyof T]>;
    }
  }

  return deSerializedObject;
};

// TODO: Resolve variables
// TODO: make parentChainVisible optional
export const resolveAndFilterNodes = (
  nodes: readonly SceneNode[],
  options: ResolverOptions,
  parentChainVisible: boolean = true
): SerializedNode<SceneNode & ParentChainVisibleMixin>[] => {
  const result: SerializedNode<SceneNode & ParentChainVisibleMixin>[] = [];
  const { nodeTypes, resolveChildrenNodes, resolveProperties: propertyKeys } = options;

  console.log(options);

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
        result.push(...resolveAndFilterNodes(node.children, options, parentChainVisible && node.visible));
      } else {
        result.push(resolveAndSerializeNodeProperties(node, propertyKeys === 'all' ? undefined : propertyKeys));
      }
    });
  }

  return result;
};
