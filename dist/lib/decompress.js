"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decompressedKey = exports.decompressedPath = exports.decompressObject = void 0;
function decompressObject(table, obj) {
    if (typeof obj !== 'object' || obj === null)
        return obj;
    else if (Array.isArray(obj)) {
        // array
        return obj.map(function (item) { return decompressObject(table, item); });
    }
    else {
        // object
        var ret = {};
        var keys = Object.keys(obj);
        for (var index = 0; index < keys.length; index++) {
            var key = keys[index];
            var decompressed = decompressedKey(table, key);
            var value = decompressObject(table, obj[key]);
            ret[decompressed] = value;
        }
        return ret;
    }
}
exports.decompressObject = decompressObject;
/**
 * transform a compressed object-path
 * into its non-compressed version
 * e.g:
 * - input: '|a.|b'
 * - output: 'name.firstName'
 */
function decompressedPath(table, path) {
    var splitted = path.split('.');
    return splitted
        .map(function (subKey) {
        var compressedKey = decompressedKey(table, subKey);
        return compressedKey;
    }).join('.');
}
exports.decompressedPath = decompressedPath;
function decompressedKey(table, key) {
    /**
        * keys could be array-accessors like myArray[4]
        * we have to split and readd the squared brackets value
        */
    var splitSquaredBrackets = key.split('[');
    var plainKey = splitSquaredBrackets.shift();
    var decompressed = table.uncompressedToCompressed.get(plainKey);
    if (!decompressed) {
        return key;
    }
    else {
        var readdSquared = splitSquaredBrackets.length ? '[' + splitSquaredBrackets.join('[') : '';
        return decompressed + readdSquared;
    }
}
exports.decompressedKey = decompressedKey;
//# sourceMappingURL=decompress.js.map