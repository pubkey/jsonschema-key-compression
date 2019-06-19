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
export function numberToLetter(nr) {
    const digits = [];
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
export const alphabeticCompare = (a, b) => {
    if (a < b) {
        return -1;
    }
    if (b > a) {
        return 1;
    }
    return 0;
};
//# sourceMappingURL=util.js.map