"use strict";
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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var index_1 = require("../../src/index");
var test_util_1 = require("./test-util");
describe('create-compression-table.test.ts', function () {
    describe('.createCompressionTable()', function () {
        it('should create the table', function () {
            var table = index_1.createCompressionTable(test_util_1.getDefaultSchema());
            assert.ok(table);
            assert.ok(table.compressedToUncompressed.size > 0);
            assert.ok(table.uncompressedToCompressed.size > 0);
        });
        it('should create the same tables when called twice', function () {
            var table1 = index_1.createCompressionTable(test_util_1.getDefaultSchema());
            var table2 = index_1.createCompressionTable(test_util_1.getDefaultSchema());
            assert.deepEqual(table1, table2);
        });
    });
    describe('.compressedToUncompressed', function () {
        it('keys should be sorted by alphabet', function () {
            var table = index_1.createCompressionTable(test_util_1.getDefaultSchema());
            assert.ok(table);
            var keys = Array.from(table.compressedToUncompressed.keys());
            assert.ok(keys[0] < keys[1]);
        });
        it('should contain the deepNested key', function () {
            var table = index_1.createCompressionTable(test_util_1.getDefaultSchema());
            var keys = Array.from(table.compressedToUncompressed.keys());
            assert.ok(keys.includes('deepNested'));
            assert.ok(keys.includes('deepNestedAttribute'));
        });
        it('should have unique keys', function () {
            var schemaWithDuplicates = {
                type: 'object',
                properties: {
                    foobar: {
                        type: 'string'
                    },
                    nested: {
                        type: 'string',
                        properties: {
                            foobar: {
                                type: 'string'
                            }
                        }
                    }
                }
            };
            var table = index_1.createCompressionTable(schemaWithDuplicates);
            var keys = Array.from(table.compressedToUncompressed.keys());
            var unique = __spread(new Set(keys));
            assert.deepEqual(keys, unique);
        });
        it('keys with 3 or less chars shell not be compressed', function () {
            var schemaWithShort = {
                type: 'object',
                properties: {
                    _id: {
                        type: 'string'
                    },
                    nested: {
                        type: 'string',
                        properties: {
                            foobar: {
                                type: 'string'
                            }
                        }
                    }
                }
            };
            var table = index_1.createCompressionTable(schemaWithShort);
            var keys = Array.from(table.compressedToUncompressed.keys());
            assert.equal(keys.includes('_id'), false);
        });
        it('should not contain json-schema keywords', function () {
            var table = index_1.createCompressionTable(test_util_1.getDefaultSchema());
            var keys = Array.from(table.compressedToUncompressed.keys());
            assert.equal(keys.includes('required'), false);
            assert.equal(keys.includes('items'), false);
            assert.equal(keys.includes('description'), false);
            assert.equal(keys.includes('properties'), false);
            assert.equal(keys.includes('type'), false);
        });
        it('should contain json-schema keywords if used as property', function () {
            var schema = test_util_1.getDefaultSchema();
            schema.properties.description = {
                type: 'string'
            };
            var table = index_1.createCompressionTable(schema);
            var keys = Array.from(table.compressedToUncompressed.keys());
            assert.ok(keys.includes('description'));
        });
    });
});
//# sourceMappingURL=create-compression-table.test.js.map