import * as assert from 'assert';
import {
    randomString,
    randomBoolean,
    randomNumber,
    performanceNow,
    clone
} from 'async-test-util';

import {
    createCompressionTable,
    compress,
    decompress
} from '../../src/index';
import {
    PlainJsonObject
} from '../../types/json-object';
import {
    JsonSchema
} from '../../types/schema';

describe('create-compression-table.test.ts', () => {
    const schema: JsonSchema = {
        type: 'object',
        description: 'my description',
        properties: {
            bfoostr: {
                type: 'string'
            },
            afoobool: {
                type: 'boolean'
            },
            nested: {
                type: 'object',
                properties: {
                    nestedobject: {
                        type: 'string'
                    }
                }
            },
            objectarray: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        keyone: {
                            type: 'string'
                        },
                        deepNested: {
                            type: 'string'
                        }
                    }
                }
            }
        },
        required: [
            'bfoostr',
            'afoobool'
        ]
    };
    describe('.createCompressionTable()', () => {
        it('should create the table', () => {
            const table = createCompressionTable(schema);
            assert.ok(table);
            assert.ok(table.compressedToUncompressed.size > 0);
            assert.ok(table.uncompressedToCompressed.size > 0);
        });
        it('should create the same tables when called twice', () => {
            const table1 = createCompressionTable(schema);
            const table2 = createCompressionTable(schema);
            assert.deepEqual(table1, table2);
        });
    });
    describe('.compressedToUncompressed', () => {
        it('keys should be sorted by alphabet', () => {
            const table = createCompressionTable(schema);
            assert.ok(table);
            const keys = Array.from(table.compressedToUncompressed.keys());
            assert.ok(keys[0] < keys[1]);
        });
        it('should contain the deepNested key', () => {
            const table = createCompressionTable(schema);
            const keys = Array.from(table.compressedToUncompressed.keys());
            assert.ok(keys.includes('deepNested'));
            assert.ok(keys.includes('nestedobject'));
        });
        it('should have unique keys', () => {
            const schemaWithDuplicates: JsonSchema = {
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
            const table = createCompressionTable(schemaWithDuplicates);
            const keys = Array.from(table.compressedToUncompressed.keys());
            const unique = [...new Set(keys)];
            assert.deepEqual(keys, unique);
        });
        it('keys with 3 or less chars shell not be compressed', () => {
            const schemaWithShort: JsonSchema = {
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
            const table = createCompressionTable(schemaWithShort);
            const keys = Array.from(table.compressedToUncompressed.keys());
            assert.equal(keys.includes('_id'), false);
        });
        it('should not contain json-schema keywords', () => {
            const table = createCompressionTable(schema);
            const keys = Array.from(table.compressedToUncompressed.keys());
            assert.equal(keys.includes('required'), false);
            assert.equal(keys.includes('items'), false);
            assert.equal(keys.includes('description'), false);
            assert.equal(keys.includes('properties'), false);
            assert.equal(keys.includes('type'), false);
        });
        it('should contain json-schema keywords if used as property', ()=> {
            const cloned = clone(schema) as any;
            cloned.properties.description = {
                type: 'string'
            };
            const table = createCompressionTable(cloned);
            const keys = Array.from(table.compressedToUncompressed.keys());
            assert.ok(keys.includes('description'));
        });
    });
});