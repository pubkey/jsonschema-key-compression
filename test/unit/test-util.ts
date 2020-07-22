import {
    randomString,
    randomBoolean
} from 'async-test-util';
import type {
    JsonSchema,
    PlainJsonObject,
    CompressionTable
} from '../../src/types';

import {
    createCompressionTable,
    compressObject
} from '../../src/index';

export function getDefaultSchema(): JsonSchema {
    const schema: JsonSchema = {
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

export function getDefaultObject(): PlainJsonObject {
    const obj: PlainJsonObject = {
        id: randomString(),
        name: randomString(),
        active: randomBoolean(),
        nestedObject: {
            nestedAttribute: randomString()
        },
        objectArray: [{
            keyone: randomString(),
            deepNested: {
                deepNestedAttribute: randomString()
            }
        }, {
            keyone: randomString(),
            deepNested: {
                deepNestedAttribute: randomString()
            }
        }],
        notInSchema: randomString()
    };
    return obj;
}

export function getDefaultCompressedObject(): PlainJsonObject {
    return compressObject(
        getDefaultCompressionTable(),
        getDefaultObject()
    );
}

export function getDefaultCompressionTable(): CompressionTable {
    return createCompressionTable(getDefaultSchema());
}
