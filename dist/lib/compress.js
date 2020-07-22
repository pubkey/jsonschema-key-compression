"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressQuerySelector = exports.compressQuery = exports.compressedAndFlaggedKey = exports.throwErrorIfCompressionFlagUsed = exports.compressedPath = exports.compressObject = void 0;
/**
 * compress the keys of an object via the compression-table
 * @recursive
 */
function compressObject(table, obj) {
    if (typeof obj !== 'object' || obj === null)
        return obj;
    else if (Array.isArray(obj)) {
        // array
        return obj
            .map(function (item) { return compressObject(table, item); });
    }
    else {
        // object
        var ret_1 = {};
        Object.keys(obj).forEach(function (key) {
            var compressedKey = compressedAndFlaggedKey(table, key);
            var value = compressObject(table, obj[key]);
            ret_1[compressedKey] = value;
        });
        return ret_1;
    }
}
exports.compressObject = compressObject;
/**
 * transform an object-path
 * into its compressed version
 * e.g:
 * - input: 'names[1].firstName'
 * - ouput: '|a[1].|b'
 */
function compressedPath(table, path) {
    var splitted = path.split('.');
    return splitted
        .map(function (subKey) {
        var compressedKey = compressedAndFlaggedKey(table, subKey);
        return compressedKey;
    }).join('.');
}
exports.compressedPath = compressedPath;
function throwErrorIfCompressionFlagUsed(table, key) {
    if (key.startsWith(table.compressionFlag)) {
        throw new Error('cannot compress objects that start with the compression-flag: ' +
            table.compressionFlag + ' on key ' + key);
    }
}
exports.throwErrorIfCompressionFlagUsed = throwErrorIfCompressionFlagUsed;
function compressedAndFlaggedKey(table, key) {
    throwErrorIfCompressionFlagUsed(table, key);
    /**
     * keys could be array-accessors like myArray[4]
     * we have to split and readd the squared brackets value
     */
    var splitSquaredBrackets = key.split('[');
    key = splitSquaredBrackets.shift();
    var compressedKey = table.compressedToUncompressed.get(key);
    if (!compressedKey) {
        return key;
    }
    else {
        var readdSquared = splitSquaredBrackets.length ? '[' + splitSquaredBrackets.join('[') : '';
        return table.compressionFlag + compressedKey + readdSquared;
    }
}
exports.compressedAndFlaggedKey = compressedAndFlaggedKey;
/**
 * compress a mango-query
 * so that it can be used to find documents
 * in a database where all documents are compressed
 */
function compressQuery(table, query) {
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
            Object.entries(query.sort).forEach(function (_a) {
                var _b = __read(_a, 2), key = _b[0], direction = _b[1];
                var compressedField = compressedPath(table, key);
                compressedSort_1[compressedField] = direction;
            });
            ret.sort = compressedSort_1;
        }
    }
    return ret;
}
exports.compressQuery = compressQuery;
/**
 * @recursive
 */
function compressQuerySelector(table, selector) {
    if (Array.isArray(selector)) {
        return selector.map(function (item) { return compressQuerySelector(table, item); });
    }
    else if (selector instanceof RegExp) {
        return selector;
    }
    else if (typeof selector === 'object' && selector !== null) {
        var ret_2 = {};
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
            ret_2[useKey] = compressQuerySelector(table, selector[key]);
        });
        return ret_2;
    }
    else {
        return selector;
    }
}
exports.compressQuerySelector = compressQuerySelector;
//# sourceMappingURL=compress.js.map