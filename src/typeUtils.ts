type ArrayType<T> = Extract<true extends T & false ? unknown[] : T extends readonly unknown[] ? T : unknown[], T>;

export const isArray = Array.isArray as <T>(arg: T) => arg is ArrayType<T>;

export const strictObjectKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>;

export const nodeCanHaveChildren = <T extends SceneNode>(node: T): node is T & ChildrenMixin => {
  return 'children' in node;
};
