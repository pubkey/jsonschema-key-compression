/**
 * compress the keys of an object via the compression-table
 * @recursive
 */
export function compressObject(table, obj) {
    if (typeof obj !== 'object' || obj === null)
        return obj;
    else if (Array.isArray(obj)) {
        // array
        return obj
            .map(function (item) { return compressObject(table, item); });
    }
    else {
        // object
        var ret = {};
        var keys = Object.keys(obj);
        for (var index = 0; index < keys.length; index++) {
            var key = keys[index];
            var compressedKey = compressedAndFlaggedKey(table, key);
            var value = compressObject(table, obj[key]);
            ret[compressedKey] = value;
        }
        return ret;
    }
}
/**
 * transform an object-path
 * into its compressed version
 * e.g:
 * - input: 'names[1].firstName'
 * - ouput: '|a[1].|b'
 */
export function compressedPath(table, path) {
    var splitted = path.split('.');
    return splitted
        .map(function (subKey) {
        var compressedKey = compressedAndFlaggedKey(table, subKey);
        return compressedKey;
    }).join('.');
}
export function throwErrorIfCompressionFlagUsed(table, key) {
    if (key.startsWith(table.compressionFlag)) {
        throw new Error('cannot compress objects that start with the compression-flag: ' +
            table.compressionFlag + ' on key ' + key);
    }
}
export function compressedAndFlaggedKey(table, key) {
    throwErrorIfCompressionFlagUsed(table, key);
    /**
     * keys could be array-accessors like myArray[4]
     * we have to split and read the squared brackets value
     */
    var splitSquaredBrackets = key.split('[');
    var plainKey = splitSquaredBrackets.shift();
    var compressedKey = table.compressedToUncompressed.get(plainKey);
    if (!compressedKey) {
        return key;
    }
    else {
        var readdSquared = splitSquaredBrackets.length ? '[' + splitSquaredBrackets.join('[') : '';
        return table.compressionFlag + compressedKey + readdSquared;
    }
}
/**
 * compress a mango-query
 * so that it can be used to find documents
 * in a database where all documents are compressed
 */
export function compressQuery(table, query) {
    var ret = {
        selector: compressQuerySelector(table, query.selector)
    };
    if (query.skip)
        ret.skip = query.skip;
    if (query.limit)
        ret.limit = query.limit;
    if (query.fields) {
        ret.fields = query.fields
            .map(function (field) { return compressedPath(table, field); });
    }
    if (query.sort) {
        if (Array.isArray(query.sort)) {
            ret.sort = query.sort.map(function (item) {
                if (typeof item === 'string') {
                    var hasMinus = item.startsWith('-');
                    if (hasMinus) {
                        item = item.substr(1);
                    }
                    var compressedField = compressedPath(table, item);
                    if (hasMinus) {
                        compressedField = '-' + compressedField;
                    }
                    return compressedField;
                }
                else {
                    return compressQuerySelector(table, item);
                }
            });
        }
        else {
            var compressedSort_1 = {};
            // do not use Object.entries, it is transpiled shitty
            Object.keys(query.sort).forEach(function (key) {
                var direction = query.sort[key];
                var compressedField = compressedPath(table, key);
                compressedSort_1[compressedField] = direction;
            });
            ret.sort = compressedSort_1;
        }
    }
    return ret;
}
/**
 * @recursive
 */
export function compressQuerySelector(table, selector) {
    if (Array.isArray(selector)) {
        return selector.map(function (item) { return compressQuerySelector(table, item); });
    }
    else if (selector instanceof RegExp) {
        return selector;
    }
    else if (typeof selector === 'object' && selector !== null) {
        var ret_1 = {};
        Object.keys(selector).forEach(function (key) {
            var useKey;
            if (key.startsWith('$')) {
                // operator
                useKey = key;
            }
            else {
                // property path
                useKey = compressedPath(table, key);
            }
            ret_1[useKey] = compressQuerySelector(table, selector[key]);
        });
        return ret_1;
    }
    else {
        return selector;
    }
}
//# sourceMappingURL=compress.js.map