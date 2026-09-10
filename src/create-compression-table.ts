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
    addPropertiesOfSchema(schema, ret);
    return ret;
}

/**
 * Adds all property names of the schema to the given set.
 * Using a single accumulator set avoids creating
 * a new set and array copy on each nesting level.
 */
function addPropertiesOfSchema(schema: JsonSchema, ret: Set<string>) {
    const properties = schema.properties;
    if (properties) {
        // do not use Object.entries, it is transpiled shitty
        const propertyNames = Object.keys(properties);
        for (let i = 0; i < propertyNames.length; i++) {
            const property = propertyNames[i] as string;
            ret.add(property);
            addPropertiesOfSchema(properties[property] as JsonSchema, ret);
        }
    }

    const items = schema.items;
    if (items) {
        if (Array.isArray(items)) {
            for (let i = 0; i < items.length; i++) {
                addPropertiesOfSchema(items[i] as JsonSchema, ret);
            }
        } else {
            addPropertiesOfSchema(items, ret);
        }
    }
}

export function compressedToUncompressedTable(
    schema: JsonSchema,
    ignoreProperties: string[]
): TableType {
    const attributes: Set<string> = getPropertiesOfSchema(schema);
    const schemaKeysSorted: string[] = Array.from(attributes).sort(alphabeticCompare);
    const table: TableType = new Map();
    let lastKeyNumber: number = 0;
    for (let i = 0; i < schemaKeysSorted.length; i++) {
        const k = schemaKeysSorted[i] as string;
        if (k.length > 3 && !ignoreProperties.includes(k)) {
            table.set(k, numberToLetter(lastKeyNumber));
            lastKeyNumber++;
        }
    }
    return table;
}

export function uncompressedToCompressedTable(
    table: TableType,
    compressionFlag: string,
    ignoreProperties: string[]
): TableType {
    const reverseTable: TableType = new Map();
    table.forEach((value, key) => {
        /**
         * The ignored properties are property names,
         * so they must be compared to the key and not to the
         * compressed value which could randomly be equal to an ignored name.
         */
        if (!ignoreProperties.includes(key)) {
            reverseTable.set(compressionFlag + value, key);
        }
    });
    return reverseTable;
}
