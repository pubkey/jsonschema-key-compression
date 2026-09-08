/**
 * General consistency test.
 * Uses a complex schema, random documents and random mango-queries
 * to ensure that the compressed and the non-compressed data
 * behave exactly the same on queries (via mingo)
 * and on schema validation (via ajv).
 */
import * as assert from 'assert';
import Ajv from 'ajv';
import { Query } from 'mingo';
import {
    createCompressionTable,
    compressObject,
    decompressObject,
    compressQuery,
    createCompressedJsonSchema
} from '../../src/index';
import type {
    MangoQuery,
    PlainJsonObject,
    PlainJsonObjectNotArray
} from '../../src/index';
import {
    COMPLEX_SCHEMA,
    createRandomGenerator,
    randomDocument,
    mutateDocument,
    randomQuery
} from './general-helper';

const DOCUMENTS_AMOUNT = 200;
const QUERIES_AMOUNT = 1000;
const MUTATED_DOCUMENTS_AMOUNT = 1000;

/**
 * Use a different seed on each run to find new edge cases,
 * but log it so that a failing run can be reproduced.
 * Set the SEED environment variable to reproduce a run.
 */
const SEED = process.env['SEED'] ? parseInt(process.env['SEED'], 10) : Math.floor(Math.random() * 1000000);

function runMangoQuery(
    query: MangoQuery,
    docs: PlainJsonObjectNotArray[]
): PlainJsonObject[] {
    let projection: any;
    if (query.fields) {
        projection = {};
        query.fields.forEach(field => projection[field] = 1);
    }
    let cursor = new Query(query.selector).find(docs, projection);
    if (query.sort) {
        cursor = cursor.sort(query.sort as any);
    }
    if (query.skip) {
        cursor = cursor.skip(query.skip);
    }
    if (query.limit) {
        cursor = cursor.limit(query.limit);
    }
    return cursor.all() as PlainJsonObject[];
}

describe('general.test.ts (seed: ' + SEED + ')', () => {
    const rng = createRandomGenerator(SEED);
    const table = createCompressionTable(COMPLEX_SCHEMA);
    const compressedSchema = createCompressedJsonSchema(table, COMPLEX_SCHEMA);
    const docs = new Array(DOCUMENTS_AMOUNT).fill(0).map((_v, idx) => randomDocument(rng, idx));
    const compressedDocs = docs.map(doc => compressObject(table, doc) as PlainJsonObjectNotArray);

    const ajv = new Ajv({
        strictTypes: false
    });
    const validate = ajv.compile(COMPLEX_SCHEMA);
    const validateCompressed = ajv.compile(compressedSchema);

    it('the compression-table should contain all long keys of the schema', () => {
        [
            'firstName',
            'description',
            'metadata',
            'createdAt',
            'streetName',
            'countryCode',
            'phoneNumber',
            'lineItems',
            'productNumber',
            'restrictedValue',
            'creditCardNumber',
            'billingAddress'
        ].forEach(key => {
            assert.ok(table.compressedToUncompressed.has(key), 'missing key ' + key);
        });
    });

    it('all random documents should be valid to the schema', () => {
        docs.forEach(doc => {
            assert.ok(validate(doc), JSON.stringify(doc) + '\n' + JSON.stringify(validate.errors));
        });
    });

    it('compress() and decompress() should be a lossless roundtrip', () => {
        docs.forEach((doc, idx) => {
            const compressed = compressedDocs[idx] as PlainJsonObjectNotArray;
            assert.notDeepStrictEqual(compressed, doc);
            assert.deepStrictEqual(decompressObject(table, compressed), doc);
            assert.deepStrictEqual(JSON.parse(JSON.stringify(decompressObject(table, compressed))), doc);
        });
    });

    it('compressed documents should not contain any compressible key', () => {
        const compressibleKeys = Array.from(table.compressedToUncompressed.keys());
        compressedDocs.forEach(compressed => {
            const jsonString = JSON.stringify(compressed);
            compressibleKeys.forEach(key => {
                assert.strictEqual(
                    jsonString.includes('"' + key + '"'),
                    false,
                    'key ' + key + ' not compressed in ' + jsonString
                );
            });
        });
    });

    it('schema validation should have equal results on compressed and non-compressed documents', () => {
        let validAmount = 0;
        let invalidAmount = 0;
        const mutatedDocs = new Array(MUTATED_DOCUMENTS_AMOUNT)
            .fill(0)
            .map(() => mutateDocument(rng, rng.pick(docs)));
        docs.concat(mutatedDocs).forEach(doc => {
            const compressed = compressObject(table, doc);
            const isValid = validate(doc);
            const isValidCompressed = validateCompressed(compressed);
            if (isValid) {
                validAmount++;
            } else {
                invalidAmount++;
            }
            assert.strictEqual(
                isValidCompressed,
                isValid,
                'validation result differs for document\n' + JSON.stringify(doc) +
                '\ncompressed: ' + JSON.stringify(compressed) +
                '\nerrors: ' + JSON.stringify(validate.errors) +
                '\ncompressed errors: ' + JSON.stringify(validateCompressed.errors)
            );
        });
        // ensure the mutations produce both valid and invalid documents
        assert.ok(validAmount > DOCUMENTS_AMOUNT, 'not enough valid documents: ' + validAmount);
        assert.ok(invalidAmount > MUTATED_DOCUMENTS_AMOUNT / 4, 'not enough invalid documents: ' + invalidAmount);
    });

    it('mango-queries should have equal results on compressed and non-compressed documents', () => {
        let partialMatches = 0;
        for (let i = 0; i < QUERIES_AMOUNT; i++) {
            const query = randomQuery(rng);
            const compressedQuery = compressQuery(table, query);

            const result = runMangoQuery(query, docs);
            const compressedResult = runMangoQuery(compressedQuery, compressedDocs);
            const decompressedResult = compressedResult.map(doc => decompressObject(table, doc));

            assert.deepStrictEqual(
                decompressedResult,
                result,
                'query results differ for query\n' + JSON.stringify(query) +
                '\ncompressed query: ' + JSON.stringify(compressedQuery)
            );
            if (result.length > 0 && result.length < docs.length) {
                partialMatches++;
            }
        }
        // ensure the queries are selective and not just matching everything or nothing
        assert.ok(partialMatches > QUERIES_AMOUNT / 4, 'not enough partial matches: ' + partialMatches);
    });
});
