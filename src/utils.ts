import { FIGMA_MIXED } from './constants';
import { isArray, nodeCanHaveChildren, strictObjectKeys } from './typeUtils';

import { Mutable, NonFunctionPropertyKeys } from './typePrimitives';
import {
  BoundVariableInstances,
  BoundVariablesAliasArrays,
  BoundVariablesBareAliases,
  OptSharedPluginDataKeys,
  ResolvedNode,
  ResolverOptions,
  SceneNodePropertyKey,
  SerializedResolvedNode,
  SharedPluginData
} from './types';

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
    [K in keyof Node]: TypedPropertyDescriptor<Node[K]>;
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

  const objectWithProperties = {
    id: node.id
  } as Node;

  for (const getter of getters) {
    objectWithProperties[getter] = node[getter];
  }

  return objectWithProperties;
};

const resolveVariableProperties = (variable: Variable): Variable => {
  // Narrow the type from the default which has a mapped type
  const descriptors = Object.getOwnPropertyDescriptors<Variable>(Object.getPrototypeOf(variable)) as {
    [K in keyof Variable]: TypedPropertyDescriptor<Variable[K]>;
  };

  // In reality the type is string | number | keyof T from getOwnPropertyDescriptors
  // but we can safely assert a narrower type
  const getterKeys = strictObjectKeys(descriptors);
  const getters = getterKeys.filter(
    (key) => typeof descriptors[key].get === 'function'
  ) as NonFunctionPropertyKeys<Variable>[];

  getters.push('id');

  const objectWithProperties = {} as Mutable<Variable>;

  for (const getter of getters) {
    // @ts-expect-error For some reason this gives a "not assignable to never" error with this way of accessing the object
    objectWithProperties[getter] = variable[getter];
  }

  return objectWithProperties;
};

const resolveBoundVariables = <
  BoundVariables extends NonNullable<SceneNode['boundVariables']>,
  const Options extends ResolverOptions
>(
  boundVariables: BoundVariables,
  options: Options
): BoundVariableInstances => {
  const { resolveVariables } = options;
  const result: Mutable<BoundVariableInstances> = {};

  for (const boundVariableKey of strictObjectKeys(boundVariables)) {
    if (
      resolveVariables === 'all' ||
      (isArray(resolveVariables) && resolveVariables.includes(boundVariableKey as keyof SceneNode['boundVariables']))
    ) {
      const boundVariable = boundVariables[boundVariableKey];

      // TODO: there is a lot of type assertions going on that could be avoided with smarter type guards
      if (Array.isArray(boundVariable)) {
        const aliases: VariableAlias[] = boundVariable;
        const variableInstances: Variable[] = [];

        for (const variableAlias of aliases) {
          const variable = figma.variables.getVariableById(variableAlias.id);
          if (variable) {
            variableInstances.push(resolveVariableProperties(variable));
          }
        }

        variableInstances.length > 0 &&
          (result[boundVariableKey as keyof BoundVariablesAliasArrays] = variableInstances);
      } else if (boundVariableKey === 'componentProperties') {
        const aliasObject = boundVariable as NonNullable<BoundVariables['componentProperties']>;
        const instanceObject: Record<string, Variable> = {};

        for (const componentPropertyKey of Object.keys(aliasObject)) {
          const variable = figma.variables.getVariableById(aliasObject[componentPropertyKey].id);
          variable && (instanceObject[componentPropertyKey] = resolveVariableProperties(variable));
        }

        Object.keys(instanceObject).length > 0 && (result[boundVariableKey as 'componentProperties'] = instanceObject);
      } else {
        const alias = boundVariable as VariableAlias;
        const variableInstance = figma.variables.getVariableById(alias.id);

        variableInstance &&
          (result[boundVariableKey as keyof BoundVariablesBareAliases] = resolveVariableProperties(variableInstance));
      }
    }
  }

  return result;
};

const resolvePluginData = (node: SceneNode, pluginDataKeys: string[]): Record<string, string> => {
  const pluginData: Record<string, string> = {};

  for (const key of pluginDataKeys) {
    const value = node.getPluginData(key);
    if (value !== undefined) {
      pluginData[key] = value;
    }
  }

  return pluginData;
};

const resolveSharedPluginData = <K extends OptSharedPluginDataKeys>(
  node: SceneNode,
  sharedPluginDataKeys: K
): SharedPluginData<K> => {
  const sharedPluginData: Partial<Record<keyof K, Record<string, string>>> = {};

  for (const namespace of strictObjectKeys(sharedPluginDataKeys)) {
    sharedPluginData[namespace] = {};
    for (const key of sharedPluginDataKeys[namespace]) {
      (sharedPluginData[namespace] as Record<string, string>)[key] = node.getSharedPluginData(namespace as string, key);
    }
  }

  return sharedPluginData as SharedPluginData<K>;
};

const resolveAndSerializeNodeProperties = <Node extends SceneNode, const Options extends ResolverOptions>(
  node: Node,
  options: Options,
  ancestorsVisible: boolean
): SerializedResolvedNode<Options> => {
  const { resolveProperties, resolveVariables, addAncestorsVisibleProperty, pluginDataKeys, sharedPluginDataKeys } =
    options;

  const resolvedNode = resolveNodeProperties(
    node,
    resolveProperties === 'all' ? undefined : resolveProperties
  ) as Record<string, unknown>;

  for (const key of strictObjectKeys(resolvedNode)) {
    if (resolvedNode[key] === figma.mixed) {
      resolvedNode[key] = FIGMA_MIXED;
    }
  }

  if (
    node.boundVariables !== undefined &&
    (resolveVariables === 'all' || (isArray(resolveVariables) && resolveVariables.length > 0))
  ) {
    resolvedNode.boundVariableInstances = resolveBoundVariables(node.boundVariables, options);
  }

  if (addAncestorsVisibleProperty) {
    resolvedNode.ancestorsVisible = ancestorsVisible;
  }

  if (pluginDataKeys.length > 0) {
    resolvedNode.pluginData = resolvePluginData(node, pluginDataKeys);
  }

  if (Object.keys(sharedPluginDataKeys).length > 0) {
    resolvedNode.sharedPluginData = resolveSharedPluginData(node, sharedPluginDataKeys);
  }

  return resolvedNode as SerializedResolvedNode<Options>;
};

export const resolveAndFilterNodes = <const Options extends ResolverOptions>(
  nodes: readonly SceneNode[],
  options: Options,
  ancestorsVisible: boolean = true
): SerializedResolvedNode<Options>[] => {
  const result: SerializedResolvedNode<Options>[] = [];
  const { nodeTypes, resolveChildren } = options;

  if (nodeTypes !== undefined) {
    for (const node of nodes) {
      if (nodeTypes.includes(node.type)) {
        result.push(resolveAndSerializeNodeProperties(node, options, ancestorsVisible && node.visible));
      } else if (nodeCanHaveChildren(node) && resolveChildren) {
        result.push(...resolveAndFilterNodes(node.children, options, ancestorsVisible && node.visible));
      }
    }
  } else {
    for (const node of nodes) {
      if (nodeCanHaveChildren(node) && resolveChildren) {
        const newNode = {
          ...resolveAndSerializeNodeProperties(node, options, ancestorsVisible && node.visible),
          children: resolveAndFilterNodes(node.children, options, ancestorsVisible && node.visible)
        };
        result.push(newNode);
      } else {
        result.push(resolveAndSerializeNodeProperties(node, options, ancestorsVisible && node.visible));
      }
    }
  }

  return result;
};
