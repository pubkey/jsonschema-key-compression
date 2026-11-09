import * as assert from 'assert';
import Ajv from 'ajv';
import { Query } from 'mingo';
import {
    createCompressionTable,
    compressObject,
    decompressObject,
    compressQuery,
    createCompressedJsonSchema,
    DEFAULT_COMPRESSION_FLAG
} from '../../src/index';
import type {
    JsonSchema,
    MangoQuery,
    PlainJsonObjectNotArray
} from '../../src/index';

const SCHEMA: JsonSchema = {
    type: 'object',
    properties: {
        id: {
            type: 'string'
        },
        userRole: {
            type: 'string',
            enum: ['viewer', 'admin', 'editor']
        },
        colorTags: {
            type: 'array',
            items: {
                type: 'string',
                enum: ['red', 'green', 'blue']
            }
        },
        // numbers inside of an enum cannot be told apart from an index
        priority: {
            type: 'integer',
            enum: [1, 2, 3]
        },
        // has no enum at all
        firstName: {
            type: 'string'
        }
    }
};

function enumTableOf(schema: JsonSchema, ignoreProperties: string[] = []) {
    return createCompressionTable(
        schema,
        DEFAULT_COMPRESSION_FLAG,
        ignoreProperties,
        true
    );
}

describe('enum-compression.test.ts', () => {
    describe('.createCompressionTable()', () => {
        it('should not compress enums by default', () => {
            const table = createCompressionTable(SCHEMA);
            assert.strictEqual(table.enumCompression, undefined);
        });
        it('should contain the string-enums sorted by value', () => {
            const table = enumTableOf(SCHEMA);
            const enumCompression = table.enumCompression as Map<string, string[]>;
            assert.ok(enumCompression);
            assert.deepStrictEqual(
                enumCompression.get('userRole'),
                ['admin', 'editor', 'viewer']
            );
            // the enum of an array-property is taken from its items
            assert.deepStrictEqual(
                enumCompression.get('colorTags'),
                ['blue', 'green', 'red']
            );
        });
        it('should not compress enums that contain non-strings', () => {
            const table = enumTableOf(SCHEMA);
            const enumCompression = table.enumCompression as Map<string, string[]>;
            assert.strictEqual(enumCompression.has('priority'), false);
            assert.strictEqual(enumCompression.has('firstName'), false);
        });
        it('should not compress a property that has different enums', () => {
            const schema: JsonSchema = {
                type: 'object',
                properties: {
                    someLevel: {
                        type: 'string',
                        enum: ['high', 'low']
                    },
                    nestedObject: {
                        type: 'object',
                        properties: {
                            someLevel: {
                                type: 'string',
                                enum: ['other', 'values']
                            }
                        }
                    }
                }
            };
            const table = enumTableOf(schema);
            assert.strictEqual(table.enumCompression, undefined);
        });
        it('should not compress a property that has no enum somewhere else', () => {
            const schema: JsonSchema = {
                type: 'object',
                properties: {
                    someLevel: {
                        type: 'string',
                        enum: ['high', 'low']
                    },
                    nestedObject: {
                        type: 'object',
                        properties: {
                            someLevel: {
                                type: 'string'
                            }
                        }
                    }
                }
            };
            const table = enumTableOf(schema);
            assert.strictEqual(table.enumCompression, undefined);
        });
        it('should detect a conflicting enum inside of oneOf', () => {
            const schema: JsonSchema = {
                type: 'object',
                properties: {
                    someLevel: {
                        type: 'string',
                        enum: ['high', 'low']
                    }
                },
                oneOf: [
                    {
                        type: 'object',
                        properties: {
                            someLevel: {
                                type: 'number'
                            }
                        }
                    }
                ]
            };
            const table = enumTableOf(schema);
            assert.strictEqual(table.enumCompression, undefined);
        });
        it('should not compress ignored properties', () => {
            const table = enumTableOf(SCHEMA, ['userRole']);
            const enumCompression = table.enumCompression as Map<string, string[]>;
            assert.strictEqual(enumCompression.has('userRole'), false);
            assert.strictEqual(enumCompression.has('colorTags'), true);
        });
    });

    describe('.compressObject()', () => {
        const table = enumTableOf(SCHEMA);
        const document: PlainJsonObjectNotArray = {
            id: 'doc-1',
            userRole: 'editor',
            colorTags: ['red', 'blue'],
            priority: 2,
            firstName: 'Corrine'
        };

        it('should replace the enum-values by their index', () => {
            const compressed = compressObject(table, document) as any;
            const roleKey = table.compressedToUncompressed.get('userRole') as string;
            const tagsKey = table.compressedToUncompressed.get('colorTags') as string;
            assert.strictEqual(compressed[DEFAULT_COMPRESSION_FLAG + roleKey], 1);
            assert.deepStrictEqual(compressed[DEFAULT_COMPRESSION_FLAG + tagsKey], [2, 0]);
        });
        it('should keep the values of non-compressed enums', () => {
            const compressed = compressObject(table, document) as any;
            const priorityKey = table.compressedToUncompressed.get('priority') as string;
            const firstNameKey = table.compressedToUncompressed.get('firstName') as string;
            assert.strictEqual(compressed[DEFAULT_COMPRESSION_FLAG + priorityKey], 2);
            assert.strictEqual(compressed[DEFAULT_COMPRESSION_FLAG + firstNameKey], 'Corrine');
        });
        it('should be a lossless roundtrip', () => {
            const compressed = compressObject(table, document);
            assert.deepStrictEqual(decompressObject(table, compressed), document);
        });
        it('should save characters', () => {
            const withoutEnums = createCompressionTable(SCHEMA);
            const plain = JSON.stringify(compressObject(withoutEnums, document)).length;
            const withEnums = JSON.stringify(compressObject(table, document)).length;
            assert.ok(withEnums < plain, 'not smaller: ' + withEnums + ' vs ' + plain);
        });
        it('should keep values that are not part of the enum', () => {
            const invalidDocument = {
                id: 'doc-2',
                userRole: 'superuser'
            };
            const compressed = compressObject(table, invalidDocument) as any;
            const roleKey = table.compressedToUncompressed.get('userRole') as string;
            assert.strictEqual(compressed[DEFAULT_COMPRESSION_FLAG + roleKey], 'superuser');
            assert.deepStrictEqual(decompressObject(table, compressed), invalidDocument);
        });
    });

    describe('.createCompressedJsonSchema()', () => {
        it('should describe the compressed values', () => {
            const table = enumTableOf(SCHEMA);
            const compressedSchema = createCompressedJsonSchema(table, SCHEMA);
            const properties = compressedSchema.properties as any;
            const roleSchema = properties[DEFAULT_COMPRESSION_FLAG + table.compressedToUncompressed.get('userRole')];
            assert.deepStrictEqual(roleSchema.enum, [0, 1, 2]);
            assert.strictEqual(roleSchema.type, 'number');

            const tagsSchema = properties[DEFAULT_COMPRESSION_FLAG + table.compressedToUncompressed.get('colorTags')];
            assert.strictEqual(tagsSchema.type, 'array');
            assert.deepStrictEqual(tagsSchema.items.enum, [0, 1, 2]);
            assert.strictEqual(tagsSchema.items.type, 'number');

            // an enum that is not compressed must stay as it is
            const prioritySchema = properties[DEFAULT_COMPRESSION_FLAG + table.compressedToUncompressed.get('priority')];
            assert.deepStrictEqual(prioritySchema.enum, [1, 2, 3]);
        });
        it('should validate the compressed documents', () => {
            const table = enumTableOf(SCHEMA);
            const compressedSchema = createCompressedJsonSchema(table, SCHEMA);
            const ajv = new Ajv({ strictTypes: false });
            const validate = ajv.compile(compressedSchema);
            const compressed = compressObject(table, {
                id: 'doc-1',
                userRole: 'editor',
                colorTags: ['red', 'blue'],
                priority: 2,
                firstName: 'Corrine'
            });
            assert.ok(validate(compressed), JSON.stringify(validate.errors));

            const invalid = compressObject(table, {
                id: 'doc-2',
                userRole: 'superuser'
            });
            assert.strictEqual(validate(invalid), false);
        });
    });

    describe('.compressQuery()', () => {
        const table = enumTableOf(SCHEMA);
        const roleKey = DEFAULT_COMPRESSION_FLAG + table.compressedToUncompressed.get('userRole');
        const tagsKey = DEFAULT_COMPRESSION_FLAG + table.compressedToUncompressed.get('colorTags');
        const documents: PlainJsonObjectNotArray[] = [
            { id: 'a', userRole: 'viewer', colorTags: ['red'] },
            { id: 'b', userRole: 'admin', colorTags: ['blue', 'green'] },
            { id: 'c', userRole: 'editor', colorTags: [] },
            { id: 'd' }
        ];
        const compressedDocuments = documents.map(doc => compressObject(table, doc));

        function bothResults(query: MangoQuery): { plain: string[]; compressed: string[] } {
            const runOn = (useQuery: MangoQuery, docs: any[], decompress: boolean) => {
                let cursor = new Query(useQuery.selector).find(docs);
                if (useQuery.sort) {
                    cursor = cursor.sort(useQuery.sort as any);
                }
                return cursor.all().map((doc: any) => (decompress ? decompressObject(table, doc) : doc) as any).map((doc: any) => doc.id);
            };
            return {
                plain: runOn(query, documents, false),
                compressed: runOn(compressQuery(table, query), compressedDocuments, true)
            };
        }

        it('should compress a direct value', () => {
            const compressed = compressQuery(table, { selector: { userRole: 'admin' } });
            assert.deepStrictEqual(compressed.selector, { [roleKey]: 0 });
            const results = bothResults({ selector: { userRole: 'admin' } });
            assert.deepStrictEqual(results.compressed, results.plain);
            assert.deepStrictEqual(results.plain, ['b']);
        });
        it('should compress the values of $eq, $ne, $in and $nin', () => {
            const query: MangoQuery = {
                selector: {
                    $or: [
                        { userRole: { $eq: 'editor' } },
                        { userRole: { $in: ['admin', 'superuser'] } }
                    ]
                }
            };
            const compressed = compressQuery(table, query);
            assert.deepStrictEqual(compressed.selector, {
                $or: [
                    { [roleKey]: { $eq: 1 } },
                    { [roleKey]: { $in: [0, 'superuser'] } }
                ]
            });
            const results = bothResults(query);
            assert.deepStrictEqual(results.compressed, results.plain);
            assert.deepStrictEqual(results.plain, ['b', 'c']);
        });
        it('should keep range-queries working because the indexes are sorted', () => {
            const query: MangoQuery = { selector: { userRole: { $gt: 'admin' } } };
            assert.deepStrictEqual(compressQuery(table, query).selector, { [roleKey]: { $gt: 0 } });
            const results = bothResults(query);
            assert.deepStrictEqual(results.compressed, results.plain);
            assert.deepStrictEqual(results.plain, ['a', 'c']);
        });
        it('should keep sorting working because the indexes are sorted', () => {
            const query: MangoQuery = {
                selector: { userRole: { $exists: true } },
                sort: { userRole: 1 }
            };
            const results = bothResults(query);
            assert.deepStrictEqual(results.compressed, results.plain);
            assert.deepStrictEqual(results.plain, ['b', 'c', 'a']);
        });
        it('should resolve a $regex into the matching indexes', () => {
            const query: MangoQuery = { selector: { userRole: { $regex: '^(ad|ed)' } } };
            assert.deepStrictEqual(compressQuery(table, query).selector, { [roleKey]: { $in: [0, 1] } });
            const results = bothResults(query);
            assert.deepStrictEqual(results.compressed, results.plain);
            assert.deepStrictEqual(results.plain, ['b', 'c']);
        });
        it('should respect the $options of a $regex', () => {
            const query: MangoQuery = { selector: { userRole: { $regex: 'ADMIN', $options: 'i' } } };
            assert.deepStrictEqual(compressQuery(table, query).selector, { [roleKey]: { $in: [0] } });
            const results = bothResults(query);
            assert.deepStrictEqual(results.compressed, results.plain);
        });
        it('should compress the values inside of $elemMatch and $all', () => {
            const query: MangoQuery = {
                selector: {
                    $and: [
                        { colorTags: { $elemMatch: { $eq: 'blue' } } },
                        { colorTags: { $all: ['green'] } }
                    ]
                }
            };
            assert.deepStrictEqual(compressQuery(table, query).selector, {
                $and: [
                    { [tagsKey]: { $elemMatch: { $eq: 0 } } },
                    { [tagsKey]: { $all: [1] } }
                ]
            });
            const results = bothResults(query);
            assert.deepStrictEqual(results.compressed, results.plain);
            assert.deepStrictEqual(results.plain, ['b']);
        });
        it('should not compress the value of operators that take no document-value', () => {
            const query: MangoQuery = {
                selector: {
                    userRole: { $exists: true },
                    colorTags: { $size: 1 }
                }
            };
            assert.deepStrictEqual(compressQuery(table, query).selector, {
                [roleKey]: { $exists: true },
                [tagsKey]: { $size: 1 }
            });
        });
    });
});
