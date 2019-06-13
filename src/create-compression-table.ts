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

export function createCompressionTable(schema: JsonSchema): CompressionTable {
    const table = _compressedToUncompressedTable(schema);
    const compressionTable: CompressionTable = {
        compressedToUncompressed: table,
        uncompressedToCompressed: _reverseTable(table)
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