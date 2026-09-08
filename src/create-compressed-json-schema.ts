import type {
    JsonSchema,
    CompressionTable
} from './types';
import { flatClone } from './util';
import { compressedPath } from './compress';

/**
 * Transforms the schema so that it describes the compressed objects.
 * It recurses into 'items' and 'properties' whenever they exist,
 * independent of the 'type' field. This mirrors how the compression-table
 * is created, so that every key that compressObject() compresses
 * is also compressed in the schema. For example a nullable nested object
 * has type: ['object', 'null'] and its properties must still be compressed.
 */
export function createCompressedJsonSchema(
    compressionTable: CompressionTable,
    schema: JsonSchema
): JsonSchema {
    if (!schema.items && !schema.properties) {
        // no deeper fields in the schema
        return schema;
    }

    const cloned = flatClone(schema);

    if (schema.items) {
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
    }

    if (schema.properties) {
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
    }

    return cloned;
}
