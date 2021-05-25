var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
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
        Object.entries(schema.properties).forEach(function (_a) {
            var _b = __read(_a, 2), key = _b[0], property = _b[1];
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