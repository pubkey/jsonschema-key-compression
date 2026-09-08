import type {
    JsonSchema,
    CompressionTable
} from './types';
import { flatClone } from './util';
import { compressedPath } from './compress';

/**
 * Transforms the schema so that it describes the compressed objects.
 * It recurses into all keywords that can contain sub-schemas,
 * independent of the 'type' field. This mirrors how compressObject() works,
 * which compresses every key that is known to the compression-table,
 * wherever the key occurs in the document. For example a nullable nested object
 * has type: ['object', 'null'] and its properties must still be compressed,
 * and properties inside of oneOf/anyOf/allOf must be compressed as well.
 */
export function createCompressedJsonSchema(
    compressionTable: CompressionTable,
    schema: JsonSchema
): JsonSchema {
    const hasNested = schema.items ||
        schema.additionalItems ||
        schema.properties ||
        schema.patternProperties ||
        schema.required ||
        schema.allOf ||
        schema.anyOf ||
        schema.oneOf ||
        schema.not ||
        schema.dependencies ||
        schema.definitions;
    if (!hasNested) {
        // no deeper fields in the schema
        return schema;
    }

    const cloned = flatClone(schema);
    const compressSchema = (subSchema: JsonSchema) => createCompressedJsonSchema(compressionTable, subSchema);
    const compressKey = (key: string) => compressedPath(compressionTable, key);
    const compressSchemaMap = (
        schemaMap: { [k: string]: JsonSchema },
        compressKeys: boolean
    ): { [k: string]: JsonSchema } => {
        const ret: { [k: string]: JsonSchema } = {};
        // do not use Object.entries, it is transpiled shitty
        Object.keys(schemaMap).forEach(key => {
            const useKey = compressKeys ? compressKey(key) : key;
            ret[useKey] = compressSchema(schemaMap[key] as JsonSchema);
        });
        return ret;
    };

    if (schema.items) {
        if (Array.isArray(schema.items)) {
            cloned.items = schema.items.map(compressSchema);
        } else {
            cloned.items = compressSchema(schema.items);
        }
    }
    if (schema.additionalItems && typeof schema.additionalItems === 'object') {
        cloned.additionalItems = compressSchema(schema.additionalItems);
    }

    // compress all property names
    if (schema.properties) {
        cloned.properties = compressSchemaMap(schema.properties, true);
    }
    // the patterns are not property names, only the sub-schemas are compressed
    if (schema.patternProperties) {
        cloned.patternProperties = compressSchemaMap(schema.patternProperties, false);
    }
    // also compress the required array
    if (schema.required) {
        cloned.required = schema.required.map(compressKey);
    }

    if (schema.allOf) {
        cloned.allOf = schema.allOf.map(compressSchema);
    }
    if (schema.anyOf) {
        cloned.anyOf = schema.anyOf.map(compressSchema);
    }
    if (schema.oneOf) {
        cloned.oneOf = schema.oneOf.map(compressSchema);
    }
    if (schema.not) {
        cloned.not = compressSchema(schema.not);
    }

    /**
     * dependencies are keyed by property name
     * and contain either a list of property names
     * or a sub-schema
     */
    if (schema.dependencies) {
        const dependencies = schema.dependencies;
        const newDependencies: { [k: string]: JsonSchema | string[] } = {};
        Object.keys(dependencies).forEach(key => {
            const dependency = dependencies[key] as JsonSchema | string[];
            newDependencies[compressKey(key)] = Array.isArray(dependency) ?
                dependency.map(compressKey) :
                compressSchema(dependency);
        });
        cloned.dependencies = newDependencies;
    }

    // definition names are not property names, only the sub-schemas are compressed
    if (schema.definitions) {
        cloned.definitions = compressSchemaMap(schema.definitions, false);
    }

    return cloned;
}
