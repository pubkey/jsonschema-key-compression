/**
 * transform a number to a string by using only base58 chars
 * @link https://github.com/matthewmueller/number-to-letter/blob/master/index.js
 */
export declare function numberToLetter(nr: number): string;
export type SortComparator<T = any> = (a: T, y: T) => -1 | 1 | 0;
export declare const alphabeticCompare: SortComparator;
/**
 * does a flat copy on the objects,
 * is about 3 times faster then using deepClone
 * @link https://jsperf.com/object-rest-spread-vs-clone/2
 */
export declare function flatClone<T>(obj: T): T;
