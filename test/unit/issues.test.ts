import * as assert from 'assert';
import {
    compressObject,
    compressedPath,
    compressQuerySelector,
    compressQuery,
    MangoQuery,
    createCompressionTable,
    decompressObject
} from '../../src/index';
import {
    getDefaultCompressionTable,
    getDefaultObject
} from './test-util';
import { clone } from 'async-test-util';

describe('issues.test.ts', () => {

    /**
     * @link https://github.com/pubkey/rxdb/issues/5605
     */
    it('keys with square brackets return wrong data', () => {
        const compressionTable = createCompressionTable({
            type: 'object',
            properties: {
                passportId: {
                    type: 'string',
                    maxLength: 100
                },
                tags: {
                    type: 'object',
                    patternProperties: {
                        '.*': {
                            properties: {
                                name: { type: 'string' },
                            },
                            required: ['name'],
                        }
                    },
                }
            }
        });

        const document = {
            passportId: 'foobar',
            tags: {
                example: 'example',
                '[example2]': '[example2]'
            }
        };
        const compressed = compressObject(
            compressionTable,
            clone(document)
        );

        const tagsKeys = Object.keys((compressed as any)['|b']);

        /**
         * These keys are not known to the schema
         * so they must not be compressed.
         */
        assert.deepStrictEqual(tagsKeys, ['example', '[example2]']);


        const decompressed = decompressObject(
            compressionTable,
            compressed
        );
        assert.deepStrictEqual(decompressed, document);
    });
    /**
     * This is like the test above
     * but with a more tricky key that must also
     * not break the compression.
     */
    it('keys with square brackets return wrong data tricky key', () => {
        const compressionTable = createCompressionTable({
            type: 'object',
            properties: {
                passportId: {
                    type: 'string',
                    maxLength: 100
                },
                tags: {
                    type: 'object',
                    patternProperties: {
                        '.*': {
                            properties: {
                                name: { type: 'string' },
                            },
                            required: ['name'],
                        }
                    },
                }
            }
        });
        const document = {
            passportId: 'foobar',
            tags: {
                'tags[1]': 'test'
            }
        };
        const compressed = compressObject(
            compressionTable,
            clone(document)
        );

        const tagsKeys = Object.keys((compressed as any)['|b']);

        assert.deepStrictEqual(tagsKeys, ['|b[1]']);


        const decompressed = decompressObject(
            compressionTable,
            compressed
        );

        assert.deepStrictEqual(decompressed, document);
    });
});
