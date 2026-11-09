import type {
    JsonSchema,
    JsonSchemaTypes,
    CompressionTable
} from './types';
import { flatClone } from './util';
import {
    compressedPath,
    compressObject
} from './compress';

/**
 * A value that is enum-compressed is stored as the index of the value,
 * so the type of the property changes from string to number.
 */
function toNumberType(
    type: JsonSchemaTypes | JsonSchemaTypes[] | undefined
): JsonSchemaTypes | JsonSchemaTypes[] | undefined {
    if (!type) {
        return type;
    }
    if (Array.isArray(type)) {
        return type.map(single => single === 'string' ? 'number' : single);
    }
    return type === 'string' ? 'number' : type;
}

/**
 * Replaces the enum-values of an enum-compressed property
 * by the indexes that the compressed documents contain.
 * The enum can sit at the property itself or at the items of an array-property.
 * @recursive
 */
function compressEnumOfSchema(
    schema: JsonSchema,
    enumValues: string[]
): JsonSchema {
    let ret = schema;
    if (Array.isArray(schema.enum)) {
        ret = flatClone(schema);
        ret.enum = enumValues.map((_value, index) => index);
        ret.type = toNumberType(schema.type);
    }
    const items = ret.items;
    if (items && !Array.isArray(items) && Array.isArray(items.enum)) {
        if (ret === schema) {
            ret = flatClone(schema);
        }
        ret.items = compressEnumOfSchema(items, enumValues);
    }
    return ret;
}

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
        schema.definitions ||
        schema.enum;
    if (!hasNested) {
        // no deeper fields in the schema
        return schema;
    }

    const cloned = flatClone(schema);
    const enumCompression = compressionTable.enumCompression;
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
            const subSchema = compressSchema(schemaMap[key] as JsonSchema);
            /**
             * Only real property names can be enum-compressed,
             * the keys of patternProperties and definitions are no property names.
             */
            const enumValues = (compressKeys && enumCompression) ? enumCompression.get(key) : undefined;
            ret[useKey] = enumValues ? compressEnumOfSchema(subSchema, enumValues) : subSchema;
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

    /**
     * enum values are document fragments,
     * so object values contain property names that must be compressed.
     * Primitive values are returned unchanged by compressObject().
     */
    if (schema.enum) {
        cloned.enum = schema.enum.map(value => compressObject(compressionTable, value));
    }

    return cloned;
}
