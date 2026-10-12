import * as assert from 'assert';
import {
    createCompressionTable,
    createCompressedJsonSchema,
    compressObject,
    compressedPath
} from '../../src/index';
import type {
    JsonSchema
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
    /**
     * A nullable nested object or array is described in json-schema
     * via a type-array like ['object', 'null'].
     * The compression-table and compressObject() do compress the keys
     * of such nested schemas, so the compressed schema must describe
     * these compressed keys as well. Otherwise a compressed object
     * would not validate against its own compressed schema.
     */
    it('should compress nested schemas whose type is a nullable type-array', () => {
        const schema: JsonSchema = {
            type: 'object',
            properties: {
                firstName: {
                    type: 'string'
                },
                address: {
                    type: ['object', 'null'],
                    properties: {
                        streetName: {
                            type: 'string'
                        },
                        houseNumber: {
                            type: 'number'
                        }
                    },
                    required: ['streetName']
                },
                phoneNumbers: {
                    type: ['array', 'null'],
                    items: {
                        type: 'object',
                        properties: {
                            countryCode: {
                                type: 'string'
                            }
                        }
                    }
                }
            },
            required: ['firstName']
        };
        const table = createCompressionTable(schema);
        const compressedSchema = createCompressedJsonSchema(
            table,
            schema
        );

        const compressedObject = compressObject(
            table,
            {
                firstName: 'Corrine',
                address: {
                    streetName: 'Main Street',
                    houseNumber: 3
                },
                phoneNumbers: [{
                    countryCode: 'de'
                }]
            }
        ) as any;

        const compressedProperties = compressedSchema.properties as any;
        const addressSchema = compressedProperties[compressedPath(table, 'address')];
        const phoneNumbersSchema = compressedProperties[compressedPath(table, 'phoneNumbers')];
        assert.ok(addressSchema);
        assert.ok(phoneNumbersSchema);

        // the nullable type itself must be kept
        assert.deepStrictEqual(addressSchema.type, ['object', 'null']);
        assert.deepStrictEqual(phoneNumbersSchema.type, ['array', 'null']);

        // the compressed schema must describe exactly the keys that compressObject() produces
        const compressedAddress = compressedObject[compressedPath(table, 'address')];
        assert.deepStrictEqual(
            Object.keys(addressSchema.properties).sort(),
            Object.keys(compressedAddress).sort()
        );
        assert.deepStrictEqual(
            addressSchema.required,
            [compressedPath(table, 'streetName')]
        );

        const compressedPhoneNumber = compressedObject[compressedPath(table, 'phoneNumbers')][0];
        assert.deepStrictEqual(
            Object.keys(phoneNumbersSchema.items.properties),
            Object.keys(compressedPhoneNumber)
        );

        // no uncompressed key must be left in the compressed schema
        const afterJsonString = JSON.stringify(compressedSchema);
        Array.from(table.compressedToUncompressed.keys()).forEach(key => {
            assert.strictEqual(
                afterJsonString.includes('"' + key + '"'),
                false,
                'key ' + key + ' was not compressed in the schema'
            );
        });
    });
});

describe('create-compressed-json-schema.test.ts enum values', () => {
    /**
     * enum values are document fragments,
     * so object values inside of an enum contain property names
     * that compressObject() compresses in the document.
     * The compressed schema must contain the compressed enum values.
     */
    it('should compress object values inside of enum', () => {
        const schema: JsonSchema = {
            type: 'object',
            properties: {
                location: {
                    type: 'object',
                    properties: {
                        streetName: {
                            type: 'string'
                        },
                        houseNumber: {
                            type: 'integer'
                        }
                    },
                    enum: [
                        {
                            streetName: 'main street',
                            houseNumber: 1
                        },
                        {
                            streetName: 'park road',
                            houseNumber: 2
                        }
                    ]
                },
                countryCode: {
                    type: 'string',
                    enum: ['de', 'en']
                }
            }
        };
        const table = createCompressionTable(schema);
        const compressedSchema = createCompressedJsonSchema(table, schema);
        const compressedProperties = compressedSchema.properties as any;

        const locationSchema = compressedProperties[compressedPath(table, 'location')];
        assert.ok(locationSchema);
        assert.deepStrictEqual(
            locationSchema.enum,
            (schema as any).properties.location.enum.map((value: any) => compressObject(table, value))
        );

        // primitive enum values must stay as they are
        const countryCodeSchema = compressedProperties[compressedPath(table, 'countryCode')];
        assert.deepStrictEqual(countryCodeSchema.enum, ['de', 'en']);
    });
});
