import { flatClone } from './util';
import { compressedPath } from './compress';
export function createCompressedJsonSchema(compressionTable, schema) {
    if (schema.type === 'array' && schema.items) {
        var cloned = flatClone(schema);
        if (Array.isArray(schema.items)) {
            var newItems = schema.items.map(function (item) { return createCompressedJsonSchema(compressionTable, item); });
            cloned.items = newItems;
        }
        else {
            var newItems = createCompressedJsonSchema(compressionTable, schema.items);
            cloned.items = newItems;
        }
        return cloned;
    }
    else if (schema.type === 'object' && schema.properties) {
        var cloned = flatClone(schema);
        // compress all property names
        var newProperties_1 = {};
        // do not use Object.entries, it is transpiled shitty
        Object.keys(schema.properties).forEach(function (key) {
            var property = schema.properties[key];
            var compressedKey = compressedPath(compressionTable, key);
            newProperties_1[compressedKey] = createCompressedJsonSchema(compressionTable, property);
        });
        cloned.properties = newProperties_1;
        // also compress the required array
        if (cloned.required) {
            cloned.required = cloned.required.map(function (key) { return compressedPath(compressionTable, key); });
        }
        return cloned;
    }
    else {
        // no deeper fields in the schema
        return schema;
    }
}
//# sourceMappingURL=create-compressed-json-schema.js.map