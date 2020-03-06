import { numberToLetter, alphabeticCompare } from './util';
/**
 * Compressed property-names begin with the compression-flag
 * it indicates that the name is compressed.
 * If an object is compressed, where one attribute starts with the
 * compression-flag, an error will be thrown.
 */
export const DEFAULT_COMPRESSION_FLAG = '|';
export function createCompressionTable(schema, compressionFlag = DEFAULT_COMPRESSION_FLAG, ignoreProperties = []) {
    const table = compressedToUncompressedTable(schema, ignoreProperties);
    const compressionTable = {
        compressedToUncompressed: table,
        uncompressedToCompressed: uncompressedToCompressedTable(table, compressionFlag, ignoreProperties),
        compressionFlag
    };
    return compressionTable;
}
export function getPropertiesOfSchema(schema) {
    const ret = new Set();
    function addSchema(innerSchema) {
        const keys = getPropertiesOfSchema(innerSchema);
        Array.from(keys).forEach(k => ret.add(k));
    }
    if (schema.properties) {
        Object.keys(schema.properties).forEach(property => {
            ret.add(property);
            if (!schema.properties)
                return;
            const deepSchema = schema.properties[property];
            addSchema(deepSchema);
        });
    }
    if (schema.items) {
        if (Array.isArray(schema.items)) {
            schema.items.forEach(subSchema => {
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
    const attributes = getPropertiesOfSchema(schema);
    const schemaKeysSorted = Array.from(attributes).sort(alphabeticCompare);
    const table = new Map();
    let lastKeyNumber = 0;
    schemaKeysSorted
        .filter(k => k.length > 3 && !ignoreProperties.includes(k))
        .forEach(k => {
        const compressKey = numberToLetter(lastKeyNumber);
        lastKeyNumber++;
        table.set(k, compressKey);
    });
    return table;
}
export function uncompressedToCompressedTable(table, compressionFlag, ignoreProperties) {
    const reverseTable = new Map();
    Array.from(table.keys()).forEach(key => {
        const value = table.get(key);
        if (!ignoreProperties.includes(value)) {
            reverseTable.set(compressionFlag + value, key);
        }
    });
    return reverseTable;
}
//# sourceMappingURL=create-compression-table.js.map