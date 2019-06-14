import {
    PlainJsonObject,
    CompressionTable,
    JsonSchema,
    TableType
} from '../types/index';
import {
    numberToLetter,
    alphabeticCompare
} from './util';

/**
 * Compressed property-names begin with the compression-flag
 * it indicates that the name is compressed.
 * If an object is compressed, where one attribute starts with the
 * compression-flag, an error will be thrown.
 */
export const DEFAULT_COMPRESSION_FLAG = '|';

export function createCompressionTable(
    schema: JsonSchema,
    compressionFlag: string = DEFAULT_COMPRESSION_FLAG
): CompressionTable {
    const table = _compressedToUncompressedTable(schema);
    const compressionTable: CompressionTable = {
        compressedToUncompressed: table,
        uncompressedToCompressed: _reverseTable(table),
        compressionFlag
    };

    return compressionTable;
}

export function getPropertiesOfSchema(schema: JsonSchema): Set<string> {
    const ret: Set<string> = new Set();

    function addSchema(schema: JsonSchema) {
        const keys = getPropertiesOfSchema(schema);
        Array.from(keys).forEach(k => ret.add(k));
    }

    if (schema.properties) {
        Object.keys(schema.properties).forEach(property => {
            ret.add(property);
            if (!schema.properties) return;
            const deepSchema = schema.properties[property];
            addSchema(deepSchema);
        });
    }

    if (schema.items) {
        if (Array.isArray(schema.items)) {
            schema.items.forEach(subSchema => {
                addSchema(subSchema);
            });
        } else {
            addSchema(schema.items);
        }
    }

    return ret;
}

export function _compressedToUncompressedTable(schema: JsonSchema): TableType {
    const attributes: Set<string> = getPropertiesOfSchema(schema);
    const schemaKeysSorted: string[] = Array.from(attributes).sort(alphabeticCompare);
    const table: TableType = new Map();
    let lastKeyNumber: number = 0;
    schemaKeysSorted
        .filter(k => k.length > 3)
        .forEach(k => {
            const compressKey = numberToLetter(lastKeyNumber);
            lastKeyNumber++;
            table.set(k, compressKey)
        });
    return table;
}

export function _reverseTable(table: TableType): TableType {
    const reverseTable: TableType = new Map();
    Array.from(table.keys()).forEach(key => {
        const value = table.get(key) as string;
        reverseTable.set(value, key);
    });
    return reverseTable;
}