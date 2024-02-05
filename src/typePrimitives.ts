/* eslint-disable @typescript-eslint/ban-types */

/**
 * @internal
 * https://github.com/microsoft/TypeScript/issues/17002#issuecomment-1529056512
 */
export type ArrayType<T> = Extract<
  true extends T & false ? unknown[] : T extends readonly unknown[] ? T : unknown[],
  T
>;

/**
 * @internal
 * Returns array elements as union
 */
export type ArrayElementUnion<T extends readonly unknown[]> = T[number];

/**
 * @internal
 * Get all keys of a union type, instead of just the common keys that `keyof` returns
 */
type KeysOfUnion<T> = T extends infer P ? keyof P : never;

/**
 * @internal
 * Gets all property keys of an object that are not functions.
 *
 * When given a union type, it will return all possible property names from the union types.
 */
export type NonFunctionPropertyKeys<T extends object> = {
  [K in KeysOfUnion<T>]: T[K] extends Function ? never : K;
}[KeysOfUnion<T>];

/**
 * @internal
 * Get the non-function property keys for an object from a set of property keys that may be larger than the keys of the object
 *
 * Does not work with union types
 */
export type ApplicableNonFunctionPropertyKeys<T extends object, K extends string | number | symbol> = K extends keyof T
  ? T[K] extends Function
    ? never
    : K
  : never;
