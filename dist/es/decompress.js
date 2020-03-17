export function decompressObject(table, obj) {
    if (typeof obj !== 'object' || obj === null)
        return obj;
    else if (Array.isArray(obj)) {
        // array
        return obj.map(function (item) { return decompressObject(table, item); });
    }
    else {
        // object
        var ret_1 = {};
        Object.keys(obj).forEach(function (key) {
            var decompressed = decompressedKey(table, key);
            var value = decompressObject(table, obj[key]);
            ret_1[decompressed] = value;
        });
        return ret_1;
    }
}
/**
 * transform a compressed object-path
 * into its non-compressed version
 * e.g:
 * - input: '|a.|b'
 * - output: 'name.firstName'
 */
export function decompressedPath(table, path) {
    var splitted = path.split('.');
    return splitted
        .map(function (subKey) {
        var compressedKey = decompressedKey(table, subKey);
        return compressedKey;
    }).join('.');
}
export function decompressedKey(table, key) {
    /**
        * keys could be array-accessors like myArray[4]
        * we have to split and readd the squared brackets value
        */
    var splitSquaredBrackets = key.split('[');
    key = splitSquaredBrackets.shift();
    var decompressed = table.uncompressedToCompressed.get(key);
    if (!decompressed) {
        return key;
    }
    else {
        var readdSquared = splitSquaredBrackets.length ? '[' + splitSquaredBrackets.join('[') : '';
        return decompressed + readdSquared;
    }
}
//# sourceMappingURL=decompress.js.map