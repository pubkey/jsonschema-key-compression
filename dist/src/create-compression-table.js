"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
/**
 * Compressed property-names begin with the compression-flag
 * it indicates that the name is compressed.
 * If an object is compressed, where one attribute starts with the
 * compression-flag, an error will be thrown.
 */
exports.DEFAULT_COMPRESSION_FLAG = '|';
function createCompressionTable(schema, compressionFlag) {
    if (compressionFlag === void 0) { compressionFlag = exports.DEFAULT_COMPRESSION_FLAG; }
    var table = _compressedToUncompressedTable(schema);
    var compressionTable = {
        compressedToUncompressed: table,
        uncompressedToCompressed: uncompressedToCompressedTable(table, compressionFlag),
        compressionFlag: compressionFlag
    };
    return compressionTable;
}
exports.createCompressionTable = createCompressionTable;
function getPropertiesOfSchema(schema) {
    var ret = new Set();
    function addSchema(innerSchema) {
        var keys = getPropertiesOfSchema(innerSchema);
        Array.from(keys).forEach(function (k) { return ret.add(k); });
    }
    if (schema.properties) {
        Object.keys(schema.properties).forEach(function (property) {
            ret.add(property);
            if (!schema.properties)
                return;
            var deepSchema = schema.properties[property];
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
function _compressedToUncompressedTable(schema) {
    var attributes = getPropertiesOfSchema(schema);
    var schemaKeysSorted = Array.from(attributes).sort(util_1.alphabeticCompare);
    var table = new Map();
    var lastKeyNumber = 0;
    schemaKeysSorted
        .filter(function (k) { return k.length > 3; })
        .forEach(function (k) {
        var compressKey = util_1.numberToLetter(lastKeyNumber);
        lastKeyNumber++;
        table.set(k, compressKey);
    });
    return table;
}
exports._compressedToUncompressedTable = _compressedToUncompressedTable;
function uncompressedToCompressedTable(table, compressionFlag) {
    var reverseTable = new Map();
    Array.from(table.keys()).forEach(function (key) {
        var value = table.get(key);
        reverseTable.set(compressionFlag + value, key);
    });
    return reverseTable;
}
exports.uncompressedToCompressedTable = uncompressedToCompressedTable;
//# sourceMappingURL=create-compression-table.js.map