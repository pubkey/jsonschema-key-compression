/**
 * @link https://de.wikipedia.org/wiki/Base58
 * this does not start with the numbers to generate valid variable-names
 */
const base58Chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789';
const base58Length = base58Chars.length;

/**
 * transform a number to a string by using only base58 chars
 * @link https://github.com/matthewmueller/number-to-letter/blob/master/index.js
 * @param {number} nr                                       | 10000000
 * @return {string} the string-representation of the number | '2oMX'
 */
export function numberToLetter(nr: number): string {
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

/**
 * removes trailing and ending dots from the string
 * @param  {string} str
 * @return {string} str without wrapping dots
 */
export function trimDots(str: string): string {
    // start
    while (str.charAt(0) === '.')
        str = str.substr(1);

    // end
    while (str.slice(-1) === '.')
        str = str.slice(0, -1);

    return str;
}