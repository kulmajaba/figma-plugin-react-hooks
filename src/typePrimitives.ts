/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

export type Mutable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * @internal
 * Returns array elements as union
 */
export type ArrayElementUnion<T extends readonly unknown[]> = T[number];

type MaybeValue<T, K> = K extends keyof T ? T[K] : never;

type ValueInUnion<T, K> = T extends infer P ? MaybeValue<P, K> : never;

/**
 * Get all keys of a union type, instead of just the common keys that `keyof` returns
 */
type KeysOfUnion<T> = T extends infer P ? keyof P : never;

type SmooshedObjectUnion<T> = {
  [K in KeysOfUnion<T>]: ValueInUnion<T, K>;
};

export type PickPropertyKeys<T extends object, U> = {
  [K in KeysOfUnion<T>]: SmooshedObjectUnion<T>[K] extends U ? K : never;
}[KeysOfUnion<T>];

export type OmitPropertyKeys<T extends object, U> = {
  [K in KeysOfUnion<T>]: SmooshedObjectUnion<T>[K] extends U ? never : K;
}[KeysOfUnion<T>];

/**
 * @internal
 * Gets all property keys of an object that are not functions.
 *
 * When given a union type, it will return all possible property names from the union types.
 */
export type NonFunctionPropertyKeys<T extends object> = OmitPropertyKeys<T, Function>;

/**
 * @internal
 */
export type AsyncFunctionPropertyKeys<T extends object> = PickPropertyKeys<T, (...args: any[]) => Promise<any>>;

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

export type ExtractProps<T extends object, P, K extends keyof T = keyof T> = Pick<
  T,
  K extends keyof T ? (T[K] extends P ? K : never) : never
>;

export type CombineObjects<A extends object, B extends object> = {
  [K in keyof A | keyof B]: K extends keyof B
    ? B[K] extends undefined
      ? K extends keyof A
        ? A[K]
        : never
      : NonNullable<B[K]>
    : K extends keyof A
      ? A[K]
      : never;
};

export type ArrayHasElements<T extends readonly unknown[]> = T extends readonly never[] ? false : true;
