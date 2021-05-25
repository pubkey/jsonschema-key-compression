/**
 * @link https://de.wikipedia.org/wiki/Base58
 * this does not start with the numbers to generate valid variable-names
 */
const base58Chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789';
const base58Length = base58Chars.length;

/**
 * transform a number to a string by using only base58 chars
 * @link https://github.com/matthewmueller/number-to-letter/blob/master/index.js
 */
export function numberToLetter(nr: number): string {
    const digits: number[] = [];
    do {
        const v = nr % base58Length;
        digits.push(v);
        nr = Math.floor(nr / base58Length);
    } while (nr-- > 0);

    return digits
        .reverse()
        .map(d => base58Chars[d])
        .join('');
}

export type SortComparator<T = any> = (a: T, y: T) => -1 | 1 | 0;

export const alphabeticCompare: SortComparator = (a, b) => {
    if (a < b) {
        return -1;
    }
    if (b > a) {
        return 1;
    }
    return 0;
};

/**
 * does a flat copy on the objects,
 * is about 3 times faster then using deepClone
 * @link https://jsperf.com/object-rest-spread-vs-clone/2
 */
export function flatClone<T>(obj: T): T {
    return Object.assign({}, obj);
}
