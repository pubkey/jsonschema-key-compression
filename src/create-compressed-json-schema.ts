import type {
    JsonSchema,
    CompressionTable
} from './types';
import { flatClone } from './util';
import { compressedPath } from './compress';

export function createCompressedJsonSchema(
    compressionTable: CompressionTable,
    schema: JsonSchema
): JsonSchema {
    if (schema.type === 'array' && schema.items) {
        const cloned = flatClone(schema);
        if (Array.isArray(schema.items)) {
            const newItems = schema.items.map(item => createCompressedJsonSchema(
                compressionTable,
                item
            ));
            cloned.items = newItems;
        } else {
            const newItems = createCompressedJsonSchema(
                compressionTable,
                schema.items
            );
            cloned.items = newItems;
        }
        return cloned;
    } else if (schema.type === 'object' && schema.properties) {
        const cloned = flatClone(schema);

        // compress all property names
        const newProperties: {
            [k: string]: JsonSchema
        } = {};
        // do not use Object.entries, it is transpiled shitty
        Object.keys(schema.properties).forEach(key => {
            const property = (schema as any).properties[key];
            const compressedKey = compressedPath(compressionTable, key);
            newProperties[compressedKey] = createCompressedJsonSchema(compressionTable, property);
        });
        cloned.properties = newProperties;

        // also compress the required array
        if (cloned.required) {
            cloned.required = cloned.required.map(key => compressedPath(compressionTable, key));
        }

        return cloned;
    } else {
        // no deeper fields in the schema
        return schema;
    }
}
