import { numberToLetter, alphabeticCompare } from './util';
/**
 * Compressed property-names begin with the compression-flag
 * it indicates that the name is compressed.
 * If an object is compressed, where one attribute starts with the
 * compression-flag, an error will be thrown.
 */
export var DEFAULT_COMPRESSION_FLAG = '|';
export function createCompressionTable(schema, compressionFlag, ignoreProperties) {
    if (compressionFlag === void 0) { compressionFlag = DEFAULT_COMPRESSION_FLAG; }
    if (ignoreProperties === void 0) { ignoreProperties = []; }
    var table = compressedToUncompressedTable(schema, ignoreProperties);
    var compressionTable = {
        compressedToUncompressed: table,
        uncompressedToCompressed: uncompressedToCompressedTable(table, compressionFlag, ignoreProperties),
        compressionFlag: compressionFlag
    };
    return compressionTable;
}
/**
 * Returns a list of all property names that occur in the schema.
 * @returns Set of strings to ensure uniqueness.
 */
export function getPropertiesOfSchema(schema) {
    var ret = new Set();
    function addSchema(innerSchema) {
        var keys = getPropertiesOfSchema(innerSchema);
        Array.from(keys).forEach(function (k) { return ret.add(k); });
    }
    if (schema.properties) {
        // do not use Object.entries, it is transpiled shitty
        Object.keys(schema.properties).forEach(function (property) {
            var deepSchema = schema.properties[property];
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
export function compressedToUncompressedTable(schema, ignoreProperties) {
    var attributes = getPropertiesOfSchema(schema);
    var schemaKeysSorted = Array.from(attributes).sort(alphabeticCompare);
    var table = new Map();
    var lastKeyNumber = 0;
    schemaKeysSorted
        .filter(function (k) { return k.length > 3 && !ignoreProperties.includes(k); })
        .forEach(function (k) {
        var compressKey = numberToLetter(lastKeyNumber);
        lastKeyNumber++;
        table.set(k, compressKey);
    });
    return table;
}
export function uncompressedToCompressedTable(table, compressionFlag, ignoreProperties) {
    var reverseTable = new Map();
    Array.from(table.keys()).forEach(function (key) {
        var value = table.get(key);
        if (!ignoreProperties.includes(value)) {
            reverseTable.set(compressionFlag + value, key);
        }
    });
    return reverseTable;
}
//# sourceMappingURL=create-compression-table.js.map