"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var async_test_util_1 = require("async-test-util");
var index_1 = require("../../src/index");
function getDefaultSchema() {
    var schema = {
        type: 'object',
        description: 'my description',
        properties: {
            id: {
                type: 'string'
            },
            name: {
                type: 'string'
            },
            active: {
                type: 'boolean',
            },
            nestedObject: {
                type: 'object',
                properties: {
                    nestedAttribute: {
                        type: 'string'
                    }
                }
            },
            objectArray: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        keyone: {
                            type: 'string'
                        },
                        deepNested: {
                            type: 'object',
                            properties: {
                                deepNestedAttribute: {
                                    type: 'string'
                                }
                            }
                        }
                    }
                }
            }
        },
        required: [
            'firstName',
            'lastName'
        ]
    };
    return schema;
}
exports.getDefaultSchema = getDefaultSchema;
function getDefaultObject() {
    var obj = {
        id: async_test_util_1.randomString(),
        name: async_test_util_1.randomString(),
        active: async_test_util_1.randomBoolean(),
        nestedObject: {
            nestedAttribute: async_test_util_1.randomString()
        },
        objectArray: [{
                keyone: async_test_util_1.randomString(),
                deepNested: {
                    deepNestedAttribute: async_test_util_1.randomString()
                }
            }, {
                keyone: async_test_util_1.randomString(),
                deepNested: {
                    deepNestedAttribute: async_test_util_1.randomString()
                }
            }],
        notInSchema: async_test_util_1.randomString()
    };
    return obj;
}
exports.getDefaultObject = getDefaultObject;
function getDefaultCompressedObject() {
    return index_1.compressObject(getDefaultCompressionTable(), getDefaultObject());
}
exports.getDefaultCompressedObject = getDefaultCompressedObject;
function getDefaultCompressionTable() {
    return index_1.createCompressionTable(getDefaultSchema());
}
exports.getDefaultCompressionTable = getDefaultCompressionTable;
//# sourceMappingURL=test-util.js.map