/**
 * @link https://de.wikipedia.org/wiki/Base58
 * this does not start with the numbers to generate valid variable-names
 */
var base58Chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789';
var base58Length = base58Chars.length;
/**
 * transform a number to a string by using only base58 chars
 * @link https://github.com/matthewmueller/number-to-letter/blob/master/index.js
 */
export function numberToLetter(nr) {
    var digits = [];
    do {
        var v = nr % base58Length;
        digits.push(v);
        nr = Math.floor(nr / base58Length);
    } while (nr-- > 0);
    return digits
        .reverse()
        .map(function (d) { return base58Chars[d]; })
        .join('');
}
export var alphabeticCompare = function (a, b) {
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
export function flatClone(obj) {
    return Object.assign({}, obj);
}
//# sourceMappingURL=util.js.map