import * as assert from 'assert';
import {
    createCompressionTable,
    createCompressedJsonSchema
} from '../../src/index';
import {
    getDefaultSchema
} from './test-util';

describe('create-compressed-json-schema.test.ts', () => {
    it('should not crash', () => {
        const schema = getDefaultSchema();
        const table = createCompressionTable(schema);
        const compressedSchema = createCompressedJsonSchema(
            table,
            schema
        );
        assert.ok(compressedSchema);
    });
    it('should have compressed all keys', () => {
        const schema = getDefaultSchema();
        const table = createCompressionTable(schema);
        const compressedSchema = createCompressedJsonSchema(
            table,
            schema
        );
        const keys = Array.from(table.compressedToUncompressed.keys());

        const beforeJsonString = JSON.stringify(schema);
        const afterJsonString = JSON.stringify(compressedSchema);
        keys.forEach(key => {
            assert.ok(beforeJsonString.includes(key));
            assert.strictEqual(afterJsonString.includes(key), false);
        });

    });

});
