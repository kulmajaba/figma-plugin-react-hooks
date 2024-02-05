import { ArrayType } from './types';

export const isArray = Array.isArray as <T>(arg: T) => arg is ArrayType<T>;

export const strictObjectKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>;

export const nodeCanHaveChildren = <T extends SceneNode>(node: T): node is T & ChildrenMixin => {
  return 'children' in node;
};
