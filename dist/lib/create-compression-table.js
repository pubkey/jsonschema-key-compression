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
exports.uncompressedToCompressedTable = exports.compressedToUncompressedTable = exports.getPropertiesOfSchema = exports.createCompressionTable = exports.DEFAULT_COMPRESSION_FLAG = void 0;
var util_1 = require("./util");
/**
 * Compressed property-names begin with the compression-flag
 * it indicates that the name is compressed.
 * If an object is compressed, where one attribute starts with the
 * compression-flag, an error will be thrown.
 */
exports.DEFAULT_COMPRESSION_FLAG = '|';
function createCompressionTable(schema, compressionFlag, ignoreProperties) {
    if (compressionFlag === void 0) { compressionFlag = exports.DEFAULT_COMPRESSION_FLAG; }
    if (ignoreProperties === void 0) { ignoreProperties = []; }
    var table = compressedToUncompressedTable(schema, ignoreProperties);
    var compressionTable = {
        compressedToUncompressed: table,
        uncompressedToCompressed: uncompressedToCompressedTable(table, compressionFlag, ignoreProperties),
        compressionFlag: compressionFlag
    };
    return compressionTable;
}
exports.createCompressionTable = createCompressionTable;
/**
 * Returns a list of all property names that occur in the schema.
 * @returns Set of strings to ensure uniqueness.
 */
function getPropertiesOfSchema(schema) {
    var ret = new Set();
    function addSchema(innerSchema) {
        var keys = getPropertiesOfSchema(innerSchema);
        Array.from(keys).forEach(function (k) { return ret.add(k); });
    }
    if (schema.properties) {
        Object.entries(schema.properties).forEach(function (_a) {
            var _b = __read(_a, 2), property = _b[0], deepSchema = _b[1];
            ret.add(property);
            if (!schema.properties) {
                return;
            }
            addSchema(deepSchema);
        });
    }
    if (schema.items) {
        if (Array.isArray(schema.items)) {
            schema.items.forEach(function (subSchema) {
                addSchema(subSchema);
            });
        }
        else {
            addSchema(schema.items);
        }
    }
    return ret;
}
exports.getPropertiesOfSchema = getPropertiesOfSchema;
function compressedToUncompressedTable(schema, ignoreProperties) {
    var attributes = getPropertiesOfSchema(schema);
    var schemaKeysSorted = Array.from(attributes).sort(util_1.alphabeticCompare);
    var table = new Map();
    var lastKeyNumber = 0;
    schemaKeysSorted
        .filter(function (k) { return k.length > 3 && !ignoreProperties.includes(k); })
        .forEach(function (k) {
        var compressKey = util_1.numberToLetter(lastKeyNumber);
        lastKeyNumber++;
        table.set(k, compressKey);
    });
    return table;
}
exports.compressedToUncompressedTable = compressedToUncompressedTable;
function uncompressedToCompressedTable(table, compressionFlag, ignoreProperties) {
    var reverseTable = new Map();
    Array.from(table.keys()).forEach(function (key) {
        var value = table.get(key);
        if (!ignoreProperties.includes(value)) {
            reverseTable.set(compressionFlag + value, key);
        }
    });
    return reverseTable;
}
exports.uncompressedToCompressedTable = uncompressedToCompressedTable;
//# sourceMappingURL=create-compression-table.js.map