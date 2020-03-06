import * as assert from 'assert';
import {
} from 'async-test-util';

import {
    createCompressionTable, DEFAULT_COMPRESSION_FLAG
} from '../../src/index';
import {
    JsonSchema
} from '../../types/index';

import {
    getDefaultSchema
} from './test-util';

describe('create-compression-table.test.ts', () => {
    describe('.createCompressionTable()', () => {
        it('should create the table', () => {
            const table = createCompressionTable(getDefaultSchema());
            assert.ok(table);
            assert.ok(table.compressedToUncompressed.size > 0);
            assert.ok(table.uncompressedToCompressed.size > 0);
        });
        it('should create the same tables when called twice', () => {
            const table1 = createCompressionTable(getDefaultSchema());
            const table2 = createCompressionTable(getDefaultSchema());
            assert.deepEqual(table1, table2);
        });
    });
    describe('.compressedToUncompressed', () => {
        it('keys should be sorted by alphabet', () => {
            const table = createCompressionTable(getDefaultSchema());
            assert.ok(table);
            const keys = Array.from(table.compressedToUncompressed.keys());
            assert.ok(keys[0] < keys[1]);
        });
        it('should contain the deepNested key', () => {
            const table = createCompressionTable(getDefaultSchema());
            const keys = Array.from(table.compressedToUncompressed.keys());
            assert.ok(keys.includes('deepNested'));
            assert.ok(keys.includes('deepNestedAttribute'));
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
            const table = createCompressionTable(getDefaultSchema());
            const keys = Array.from(table.compressedToUncompressed.keys());
            assert.equal(keys.includes('required'), false);
            assert.equal(keys.includes('items'), false);
            assert.equal(keys.includes('description'), false);
            assert.equal(keys.includes('properties'), false);
            assert.equal(keys.includes('type'), false);
        });
        it('should contain json-schema keywords if used as property', () => {
            const schema = getDefaultSchema() as any;
            schema.properties.description = {
                type: 'string'
            };
            const table = createCompressionTable(schema);
            const keys = Array.from(table.compressedToUncompressed.keys());
            assert.ok(keys.includes('description'));
        });
    });
    describe('ingoreProperties', () => {
        it('should not contain ignored properties', () => {
            const table = createCompressionTable(
                getDefaultSchema(),
                DEFAULT_COMPRESSION_FLAG,
                [
                    'active',
                    'deepNestedAttribute'
                ]
            );

            assert.ok(!table.compressedToUncompressed.has('active'));
            assert.ok(!table.compressedToUncompressed.has('deepNestedAttribute'));
            const uncompressedValues = Object.values(table.uncompressedToCompressed);
            assert.ok(!uncompressedValues.includes('active'));
            assert.ok(!uncompressedValues.includes('deepNestedAttribute'));
        });
    });
});
