import type {
    CompressionTable,
    JsonSchema,
    TableType
} from './types';
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
    compressionFlag: string = DEFAULT_COMPRESSION_FLAG,
    ignoreProperties: string[] = []
): CompressionTable {
    const table = compressedToUncompressedTable(
        schema,
        ignoreProperties
    );
    const compressionTable: CompressionTable = {
        compressedToUncompressed: table,
        uncompressedToCompressed: uncompressedToCompressedTable(
            table,
            compressionFlag,
            ignoreProperties
        ),
        compressionFlag
    };

    return compressionTable;
}

/**
 * Returns a list of all property names that occur in the schema.
 * @returns Set of strings to ensure uniqueness.
 */
export function getPropertiesOfSchema(schema: JsonSchema): Set<string> {
    const ret: Set<string> = new Set();

    function addSchema(innerSchema: JsonSchema) {
        const keys = getPropertiesOfSchema(innerSchema);
        Array.from(keys).forEach(k => ret.add(k));
    }

    if (schema.properties) {
        // do not use Object.entries, it is transpiled shitty
        Object.keys(schema.properties).forEach(property => {
            const deepSchema = (schema as any).properties[property];
            ret.add(property);
            if (!schema.properties) {
                return;
            }
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

export function compressedToUncompressedTable(
    schema: JsonSchema,
    ignoreProperties: string[]
): TableType {
    const attributes: Set<string> = getPropertiesOfSchema(schema);
    const schemaKeysSorted: string[] = Array.from(attributes).sort(alphabeticCompare);
    const table: TableType = new Map();
    let lastKeyNumber: number = 0;
    schemaKeysSorted
        .filter(k => k.length > 3 && !ignoreProperties.includes(k))
        .forEach(k => {
            const compressKey = numberToLetter(lastKeyNumber);
            lastKeyNumber++;
            table.set(k, compressKey);
        });
    return table;
}

export function uncompressedToCompressedTable(
    table: TableType,
    compressionFlag: string,
    ignoreProperties: string[]
): TableType {
    const reverseTable: TableType = new Map();
    Array.from(table.keys()).forEach(key => {
        const value = table.get(key) as string;
        if (!ignoreProperties.includes(value)) {
            reverseTable.set(compressionFlag + value, key);
        }
    });
    return reverseTable;
}
