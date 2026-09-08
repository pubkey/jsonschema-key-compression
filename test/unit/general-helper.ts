/**
 * Helpers for the general consistency test.
 * Contains a complex schema that uses all possible ways
 * to define fields, a seeded random document generator
 * and a random mango-query generator.
 */
import type {
    JsonSchema,
    MangoQuery,
    PlainJsonObjectNotArray
} from '../../src/types';

export const COMPLEX_SCHEMA: JsonSchema = {
    type: 'object',
    description: 'a schema that uses all possible ways to define fields',
    additionalProperties: false,
    properties: {
        // short keys (3 chars or less) are never compressed
        id: {
            type: 'string'
        },
        age: {
            type: 'integer',
            minimum: 0,
            maximum: 120
        },
        // plain primitives
        firstName: {
            type: 'string',
            minLength: 1
        },
        lastName: {
            type: 'string'
        },
        height: {
            type: 'number'
        },
        active: {
            type: 'boolean'
        },
        // a json-schema keyword used as a property name
        description: {
            type: 'string'
        },
        // nullable primitive
        nickname: {
            type: ['string', 'null']
        },
        // enums
        role: {
            type: 'string',
            enum: ['admin', 'editor', 'viewer']
        },
        priority: {
            type: 'integer',
            enum: [1, 2, 3, 5, 8]
        },
        mixedEnum: {
            enum: ['low', 10, true, null]
        },
        // nested object
        metadata: {
            type: 'object',
            additionalProperties: false,
            properties: {
                createdAt: {
                    type: 'integer'
                },
                updatedAt: {
                    type: ['integer', 'null']
                },
                tags: {
                    type: 'array',
                    maxItems: 5,
                    items: {
                        type: 'string',
                        enum: ['red', 'green', 'blue', 'yellow']
                    }
                }
            },
            required: ['createdAt']
        },
        // nullable nested object
        address: {
            type: ['object', 'null'],
            additionalProperties: false,
            properties: {
                streetName: {
                    type: 'string'
                },
                houseNumber: {
                    type: 'integer'
                },
                zipCode: {
                    type: 'string'
                },
                countryCode: {
                    type: 'string',
                    enum: ['de', 'en', 'fr']
                }
            },
            required: ['streetName']
        },
        // enum with object values
        preferredAddress: {
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
        // arrays of primitives
        scores: {
            type: 'array',
            items: {
                type: 'number'
            }
        },
        // nullable array of objects
        phoneNumbers: {
            type: ['array', 'null'],
            items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    countryCode: {
                        type: 'string'
                    },
                    phoneNumber: {
                        type: 'string'
                    },
                    isPrimary: {
                        type: 'boolean'
                    }
                },
                required: ['phoneNumber']
            }
        },
        // tuple
        coordinates: {
            type: 'array',
            items: [
                {
                    type: 'number'
                },
                {
                    type: 'number'
                }
            ],
            minItems: 2,
            additionalItems: false
        },
        // array of arrays
        matrix: {
            type: 'array',
            items: {
                type: 'array',
                items: {
                    type: 'integer'
                }
            }
        },
        // deeply nested arrays of objects
        orders: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    orderNumber: {
                        type: 'integer'
                    },
                    amount: {
                        type: 'number'
                    },
                    status: {
                        enum: ['open', 'shipped', 'cancelled']
                    },
                    lineItems: {
                        type: 'array',
                        items: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                productNumber: {
                                    type: 'integer'
                                },
                                quantity: {
                                    type: 'integer'
                                },
                                unitPrice: {
                                    type: 'number'
                                }
                            },
                            required: ['productNumber', 'quantity']
                        }
                    }
                },
                required: ['orderNumber']
            }
        },
        // dynamic keys via patternProperties
        settings: {
            type: 'object',
            additionalProperties: false,
            patternProperties: {
                '^setting_[0-9]+$': {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        enabled: {
                            type: 'boolean'
                        },
                        threshold: {
                            type: 'number'
                        }
                    },
                    required: ['enabled']
                }
            }
        },
        // oneOf
        contact: {
            oneOf: [
                {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        kind: {
                            enum: ['email']
                        },
                        emailAddress: {
                            type: 'string'
                        }
                    },
                    required: ['kind', 'emailAddress']
                },
                {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        kind: {
                            enum: ['phone']
                        },
                        phoneNumber: {
                            type: 'string'
                        }
                    },
                    required: ['kind', 'phoneNumber']
                }
            ]
        },
        // anyOf
        payment: {
            anyOf: [
                {
                    type: 'object',
                    properties: {
                        cardNumber: {
                            type: 'string'
                        },
                        expiryYear: {
                            type: 'integer'
                        }
                    },
                    required: ['cardNumber']
                },
                {
                    type: 'object',
                    properties: {
                        ibanCode: {
                            type: 'string'
                        }
                    },
                    required: ['ibanCode']
                }
            ]
        },
        // allOf
        profile: {
            allOf: [
                {
                    type: 'object',
                    properties: {
                        displayName: {
                            type: 'string'
                        }
                    },
                    required: ['displayName']
                },
                {
                    type: 'object',
                    properties: {
                        avatarUrl: {
                            type: ['string', 'null']
                        }
                    }
                }
            ]
        },
        // not
        restricted: {
            type: 'object',
            properties: {
                restrictedValue: {
                    type: 'string'
                },
                publicValue: {
                    type: 'string'
                }
            },
            not: {
                required: ['restrictedValue']
            }
        },
        // dependencies
        creditCardNumber: {
            type: 'string'
        },
        billingAddress: {
            type: 'string'
        }
    },
    dependencies: {
        creditCardNumber: ['billingAddress']
    },
    required: [
        'id',
        'firstName',
        'active',
        'metadata',
        'coordinates'
    ]
};

/**
 * A seeded pseudo random number generator (mulberry32)
 * so that a failing test run can be reproduced via its seed.
 */
export type RandomGenerator = {
    seed: number;
    next: () => number;
    int: (min: number, max: number) => number;
    bool: (probability?: number) => boolean;
    pick: <T>(list: T[]) => T;
};

export function createRandomGenerator(seed: number): RandomGenerator {
    let state = seed;
    const next = () => {
        state = (state + 0x6D2B79F5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
    const bool = (probability: number = 0.5) => next() < probability;
    const pick = <T>(list: T[]): T => list[int(0, list.length - 1)] as T;
    return { seed, next, int, bool, pick };
}

const FIRST_NAMES = ['alice', 'bob', 'carol', 'dave', 'eve', 'mallory'];
const LAST_NAMES = ['smith', 'jones', 'miller', 'brown', 'wilson'];
const WORDS = ['alpha', 'beta', 'gamma', 'delta', 'omega'];
const STREET_NAMES = ['main street', 'second street', 'park road'];

function randomArray<T>(rng: RandomGenerator, maxLength: number, fn: () => T): T[] {
    return new Array(rng.int(0, maxLength)).fill(0).map(() => fn());
}

/**
 * Creates a random document that is valid to the COMPLEX_SCHEMA
 * Optional fields are sometimes missing, nullable fields are sometimes null.
 */
export function randomDocument(rng: RandomGenerator, index: number): PlainJsonObjectNotArray {
    const doc: PlainJsonObjectNotArray = {
        id: 'doc-' + index,
        firstName: rng.pick(FIRST_NAMES),
        active: rng.bool(),
        metadata: {
            createdAt: rng.int(0, 100)
        },
        coordinates: [rng.int(-10, 10), rng.int(-10, 10)]
    };
    if (rng.bool(0.7)) doc.age = rng.int(0, 120);
    if (rng.bool(0.7)) doc.lastName = rng.pick(LAST_NAMES);
    if (rng.bool(0.7)) doc.height = rng.int(100, 200) + rng.pick([0, 0.5]);
    if (rng.bool(0.5)) doc.description = rng.pick(WORDS);
    if (rng.bool(0.7)) doc.nickname = rng.bool(0.3) ? null : rng.pick(WORDS);
    if (rng.bool(0.7)) doc.role = rng.pick(['admin', 'editor', 'viewer']);
    if (rng.bool(0.7)) doc.priority = rng.pick([1, 2, 3, 5, 8]);
    if (rng.bool(0.7)) doc.mixedEnum = rng.pick(['low', 10, true, null]);
    if (rng.bool(0.5)) doc.metadata.updatedAt = rng.bool(0.3) ? null : rng.int(0, 100);
    if (rng.bool(0.7)) {
        doc.metadata.tags = randomArray(rng, 4, () => rng.pick(['red', 'green', 'blue', 'yellow']));
    }
    if (rng.bool(0.7)) {
        if (rng.bool(0.25)) {
            doc.address = null;
        } else {
            const address: PlainJsonObjectNotArray = {
                streetName: rng.pick(STREET_NAMES)
            };
            if (rng.bool(0.7)) address.houseNumber = rng.int(1, 50);
            if (rng.bool(0.5)) address.zipCode = String(rng.int(10000, 99999));
            if (rng.bool(0.7)) address.countryCode = rng.pick(['de', 'en', 'fr']);
            doc.address = address;
        }
    }
    if (rng.bool(0.5)) {
        doc.preferredAddress = rng.bool()
            ? { streetName: 'main street', houseNumber: 1 }
            : { streetName: 'park road', houseNumber: 2 };
    }
    if (rng.bool(0.7)) doc.scores = randomArray(rng, 4, () => rng.int(0, 10));
    if (rng.bool(0.7)) {
        doc.phoneNumbers = rng.bool(0.25) ? null : randomArray(rng, 3, () => {
            const phone: PlainJsonObjectNotArray = {
                phoneNumber: String(rng.int(1000, 9999))
            };
            if (rng.bool(0.6)) phone.countryCode = rng.pick(['+49', '+44', '+33']);
            if (rng.bool(0.6)) phone.isPrimary = rng.bool();
            return phone;
        });
    }
    if (rng.bool(0.7)) {
        doc.matrix = randomArray(rng, 3, () => randomArray(rng, 3, () => rng.int(0, 9)));
    }
    if (rng.bool(0.8)) {
        doc.orders = randomArray(rng, 3, () => {
            const order: PlainJsonObjectNotArray = {
                orderNumber: rng.int(1, 20)
            };
            if (rng.bool(0.7)) order.amount = rng.int(0, 500);
            if (rng.bool(0.7)) order.status = rng.pick(['open', 'shipped', 'cancelled']);
            if (rng.bool(0.7)) {
                order.lineItems = randomArray(rng, 3, () => {
                    const lineItem: PlainJsonObjectNotArray = {
                        productNumber: rng.int(1, 10),
                        quantity: rng.int(1, 5)
                    };
                    if (rng.bool(0.5)) lineItem.unitPrice = rng.int(1, 100);
                    return lineItem;
                });
            }
            return order;
        });
    }
    if (rng.bool(0.6)) {
        const settings: PlainJsonObjectNotArray = {};
        randomArray(rng, 3, () => rng.int(0, 3)).forEach(nr => {
            const setting: PlainJsonObjectNotArray = {
                enabled: rng.bool()
            };
            if (rng.bool(0.5)) setting.threshold = rng.int(0, 100);
            settings['setting_' + nr] = setting;
        });
        doc.settings = settings;
    }
    if (rng.bool(0.6)) {
        doc.contact = rng.bool()
            ? { kind: 'email', emailAddress: rng.pick(WORDS) + '@example.com' }
            : { kind: 'phone', phoneNumber: String(rng.int(1000, 9999)) };
    }
    if (rng.bool(0.6)) {
        if (rng.bool()) {
            const payment: PlainJsonObjectNotArray = {
                cardNumber: String(rng.int(1000, 9999))
            };
            if (rng.bool()) payment.expiryYear = rng.int(2024, 2030);
            doc.payment = payment;
        } else {
            doc.payment = { ibanCode: 'DE' + rng.int(10, 99) };
        }
    }
    if (rng.bool(0.6)) {
        const profile: PlainJsonObjectNotArray = {
            displayName: rng.pick(FIRST_NAMES) + ' ' + rng.pick(LAST_NAMES)
        };
        if (rng.bool()) profile.avatarUrl = rng.bool(0.3) ? null : 'https://example.com/' + rng.pick(WORDS);
        doc.profile = profile;
    }
    if (rng.bool(0.5)) {
        const restricted: PlainJsonObjectNotArray = {};
        if (rng.bool()) restricted.publicValue = rng.pick(WORDS);
        doc.restricted = restricted;
    }
    if (rng.bool(0.4)) {
        doc.billingAddress = rng.pick(STREET_NAMES);
        if (rng.bool()) doc.creditCardNumber = String(rng.int(1000, 9999));
    }
    return doc;
}

function randomJunkValue(rng: RandomGenerator): any {
    return rng.pick<any>([
        'junk',
        42,
        -1.5,
        true,
        null,
        [],
        ['junk'],
        {},
        { junkKey: 'junk' },
        { firstName: 'junk' }
    ]);
}

/**
 * Returns all object paths of a document
 * that can be mutated, e.g. ['metadata', 'tags', 1]
 */
function allPaths(value: any, prefix: (string | number)[] = []): (string | number)[][] {
    const ret: (string | number)[][] = [];
    if (Array.isArray(value)) {
        value.forEach((item, idx) => {
            ret.push([...prefix, idx]);
            ret.push(...allPaths(item, [...prefix, idx]));
        });
    } else if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach(key => {
            ret.push([...prefix, key]);
            ret.push(...allPaths(value[key], [...prefix, key]));
        });
    }
    return ret;
}

function setPath(doc: any, path: (string | number)[], value: any) {
    let current = doc;
    for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i] as any];
    }
    current[path[path.length - 1] as any] = value;
}

function deletePath(doc: any, path: (string | number)[]) {
    let current = doc;
    for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i] as any];
    }
    const last = path[path.length - 1];
    if (Array.isArray(current)) {
        current.splice(last as number, 1);
    } else {
        delete current[last as any];
    }
}

/**
 * Creates a mutated version of a valid document.
 * The result might be valid or invalid to the schema.
 * The mutations are designed to trigger the various
 * validation keywords of the schema.
 */
export function mutateDocument(rng: RandomGenerator, validDoc: PlainJsonObjectNotArray): PlainJsonObjectNotArray {
    const doc: PlainJsonObjectNotArray = JSON.parse(JSON.stringify(validDoc));
    const mutations: (() => void)[] = [
        // generic: replace a random path with junk
        () => setPath(doc, rng.pick(allPaths(doc)), randomJunkValue(rng)),
        // generic: delete a random path
        () => deletePath(doc, rng.pick(allPaths(doc))),
        // additionalProperties
        () => doc.unknownTopLevelProperty = 'junk',
        () => doc.metadata.unknownNestedProperty = 'junk',
        // required
        () => delete doc.firstName,
        () => delete doc.metadata.createdAt,
        // enum
        () => doc.role = 'superuser',
        () => doc.priority = 4,
        () => doc.mixedEnum = 'high',
        () => doc.metadata.tags = ['purple'],
        () => doc.preferredAddress = { streetName: 'main street', houseNumber: 2 },
        () => doc.preferredAddress = { streetName: 'park road', houseNumber: 2 },
        // nullable
        () => doc.address = null,
        () => doc.address = 'junk',
        () => doc.nickname = null,
        () => doc.nickname = 3,
        () => doc.phoneNumbers = null,
        // tuple
        () => doc.coordinates = [1, 2, 3],
        () => doc.coordinates = [1],
        () => doc.coordinates = ['1', 2],
        // array of arrays
        () => doc.matrix = [[1, 'junk']],
        // deep required
        () => doc.orders = [{ amount: 3 }],
        () => doc.orders = [{ orderNumber: 3, lineItems: [{ productNumber: 1 }] }],
        () => doc.orders = [{ orderNumber: 3, status: 'lost' }],
        // patternProperties
        () => doc.settings = { setting_1: { enabled: true, unknown: 1 } },
        () => doc.settings = { setting_1: { threshold: 1 } },
        () => doc.settings = { other_1: { enabled: true } },
        // oneOf
        () => doc.contact = { kind: 'email', emailAddress: 'a@b.c', phoneNumber: '1' },
        () => doc.contact = { kind: 'phone', emailAddress: 'a@b.c' },
        () => doc.contact = { kind: 'fax' },
        // anyOf
        () => doc.payment = { expiryYear: 2030 },
        () => doc.payment = { cardNumber: '1', ibanCode: 'DE1' },
        () => doc.payment = { cardNumber: 1 },
        // allOf
        () => doc.profile = { avatarUrl: null },
        () => doc.profile = { displayName: 'x', avatarUrl: 3 },
        // not
        () => doc.restricted = { restrictedValue: 'secret' },
        () => doc.restricted = { publicValue: 'ok' },
        // dependencies
        () => {
            doc.creditCardNumber = '1234';
            delete doc.billingAddress;
        },
        () => {
            doc.creditCardNumber = '1234';
            doc.billingAddress = 'main street';
        },
        // keyword-named property
        () => doc.description = 42,
        // minimum/maximum
        () => doc.age = 200,
        () => doc.age = 1.5,
        () => doc.firstName = ''
    ];
    const amount = rng.int(1, 2);
    for (let i = 0; i < amount; i++) {
        /**
         * A previous mutation might have replaced a parent object
         * with a primitive, so that the next mutation cannot be applied.
         * These mutations are skipped.
         */
        try {
            rng.pick(mutations)();
        } catch (err) { }
    }
    return doc;
}

type FieldKind = 'string' | 'number' | 'boolean' | 'nullable' | 'enum' | 'numberArray' | 'stringArray' | 'object' | 'objectArray';
type FieldDescription = {
    path: string;
    kind: FieldKind;
    values: any[];
};

/**
 * all field paths that queries can be run on,
 * with the kind of values they contain
 */
export const QUERY_FIELDS: FieldDescription[] = [
    { path: 'id', kind: 'string', values: ['doc-1', 'doc-2', 'doc-10'] },
    { path: 'firstName', kind: 'string', values: FIRST_NAMES },
    { path: 'lastName', kind: 'string', values: LAST_NAMES },
    { path: 'description', kind: 'string', values: WORDS },
    { path: 'age', kind: 'number', values: [0, 10, 50, 100, 120] },
    { path: 'height', kind: 'number', values: [100, 150, 150.5, 200] },
    { path: 'active', kind: 'boolean', values: [true, false] },
    { path: 'nickname', kind: 'nullable', values: [...WORDS, null] },
    { path: 'role', kind: 'enum', values: ['admin', 'editor', 'viewer', 'superuser'] },
    { path: 'priority', kind: 'enum', values: [1, 2, 3, 5, 8, 4] },
    { path: 'mixedEnum', kind: 'enum', values: ['low', 10, true, null] },
    { path: 'metadata.createdAt', kind: 'number', values: [0, 25, 50, 75, 100] },
    { path: 'metadata.updatedAt', kind: 'nullable', values: [0, 50, 100, null] },
    { path: 'metadata.tags', kind: 'stringArray', values: ['red', 'green', 'blue', 'yellow'] },
    { path: 'address', kind: 'object', values: [null, { streetName: 'main street' }, { streetName: 'park road', houseNumber: 3 }] },
    { path: 'address.streetName', kind: 'string', values: STREET_NAMES },
    { path: 'address.houseNumber', kind: 'number', values: [1, 10, 25, 50] },
    { path: 'address.countryCode', kind: 'enum', values: ['de', 'en', 'fr'] },
    { path: 'preferredAddress', kind: 'object', values: [{ streetName: 'main street', houseNumber: 1 }, { streetName: 'park road', houseNumber: 2 }] },
    { path: 'preferredAddress.houseNumber', kind: 'enum', values: [1, 2] },
    { path: 'scores', kind: 'numberArray', values: [0, 3, 5, 10] },
    { path: 'scores.0', kind: 'number', values: [0, 3, 5, 10] },
    { path: 'phoneNumbers', kind: 'objectArray', values: [null] },
    { path: 'phoneNumbers.phoneNumber', kind: 'string', values: ['1234', '5000', '9999'] },
    { path: 'phoneNumbers.0.isPrimary', kind: 'boolean', values: [true, false] },
    { path: 'phoneNumbers.countryCode', kind: 'string', values: ['+49', '+44', '+33'] },
    { path: 'coordinates.0', kind: 'number', values: [-10, -5, 0, 5, 10] },
    { path: 'coordinates.1', kind: 'number', values: [-10, -5, 0, 5, 10] },
    { path: 'coordinates', kind: 'numberArray', values: [-10, 0, 10] },
    { path: 'matrix.0', kind: 'numberArray', values: [0, 4, 9] },
    { path: 'matrix.0.1', kind: 'number', values: [0, 4, 9] },
    { path: 'orders', kind: 'objectArray', values: [] },
    { path: 'orders.orderNumber', kind: 'number', values: [1, 5, 10, 20] },
    { path: 'orders.0.amount', kind: 'number', values: [0, 100, 250, 500] },
    { path: 'orders.status', kind: 'enum', values: ['open', 'shipped', 'cancelled'] },
    { path: 'orders.lineItems.productNumber', kind: 'number', values: [1, 5, 10] },
    { path: 'orders.0.lineItems.0.quantity', kind: 'number', values: [1, 2, 3, 4, 5] },
    { path: 'orders.lineItems', kind: 'objectArray', values: [] },
    { path: 'settings.setting_1.enabled', kind: 'boolean', values: [true, false] },
    { path: 'settings.setting_2.threshold', kind: 'number', values: [0, 50, 100] },
    { path: 'contact.kind', kind: 'enum', values: ['email', 'phone'] },
    { path: 'contact.phoneNumber', kind: 'string', values: ['1234', '5000'] },
    { path: 'contact.emailAddress', kind: 'string', values: ['alpha@example.com', 'beta@example.com'] },
    { path: 'payment.cardNumber', kind: 'string', values: ['1234', '5000'] },
    { path: 'payment.ibanCode', kind: 'string', values: ['DE10', 'DE50'] },
    { path: 'profile.displayName', kind: 'string', values: ['alice smith', 'bob jones'] },
    { path: 'profile.avatarUrl', kind: 'nullable', values: ['https://example.com/alpha', null] },
    { path: 'restricted.publicValue', kind: 'string', values: WORDS },
    { path: 'creditCardNumber', kind: 'string', values: ['1234', '5000'] },
    { path: 'billingAddress', kind: 'string', values: STREET_NAMES }
];

function escapeRegex(value: any): string {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function randomValues(rng: RandomGenerator, field: FieldDescription): any[] {
    return randomArray(rng, 3, () => rng.pick(field.values));
}

/**
 * Creates a random selector for a single field
 * that uses one of the many mango operators.
 */
export function randomFieldSelector(rng: RandomGenerator, field: FieldDescription): any {
    const value = () => rng.pick(field.values);
    const common: (() => any)[] = [
        () => ({ [field.path]: value() }),
        () => ({ [field.path]: { $eq: value() } }),
        () => ({ [field.path]: { $ne: value() } }),
        () => ({ [field.path]: { $in: randomValues(rng, field) } }),
        () => ({ [field.path]: { $nin: randomValues(rng, field) } }),
        () => ({ [field.path]: { $exists: rng.bool() } }),
        () => ({ [field.path]: { $not: { $eq: value() } } })
    ];
    const byKind: { [k in FieldKind]: (() => any)[] } = {
        string: [
            () => ({ [field.path]: { $regex: new RegExp('^' + escapeRegex(value()).slice(0, 2)) } }),
            () => ({ [field.path]: { $regex: escapeRegex(value()).slice(0, 3), $options: 'i' } }),
            () => ({ [field.path]: { $type: 'string' } }),
            () => ({ [field.path]: { $gt: value() } })
        ],
        number: [
            () => ({ [field.path]: { $gt: value() } }),
            () => ({ [field.path]: { $gte: value() } }),
            () => ({ [field.path]: { $lt: value() } }),
            () => ({ [field.path]: { $lte: value() } }),
            () => ({ [field.path]: { $gte: value(), $lt: value() } }),
            () => ({ [field.path]: { $mod: [rng.int(2, 5), rng.int(0, 1)] } }),
            () => ({ [field.path]: { $type: 'number' } }),
            () => ({ [field.path]: { $not: { $gt: value() } } })
        ],
        boolean: [
            () => ({ [field.path]: { $type: 'bool' } })
        ],
        nullable: [
            () => ({ [field.path]: null }),
            () => ({ [field.path]: { $ne: null } }),
            () => ({ [field.path]: { $type: 'null' } })
        ],
        enum: [
            () => ({ [field.path]: { $in: [value(), value()] } }),
            () => ({ [field.path]: { $nin: [value()] } })
        ],
        numberArray: [
            () => ({ [field.path]: { $size: rng.int(0, 3) } }),
            () => ({ [field.path]: { $all: [value()] } }),
            () => ({ [field.path]: { $all: [value(), value()] } }),
            () => ({ [field.path]: { $elemMatch: { $gt: value() } } }),
            () => ({ [field.path]: { $elemMatch: { $gte: value(), $lte: value() } } }),
            () => ({ [field.path]: { $gt: value() } }),
            () => ({ [field.path]: [value(), value()] })
        ],
        stringArray: [
            () => ({ [field.path]: { $size: rng.int(0, 3) } }),
            () => ({ [field.path]: { $all: [value()] } }),
            () => ({ [field.path]: { $elemMatch: { $eq: value() } } }),
            () => ({ [field.path]: { $elemMatch: { $regex: '^' + escapeRegex(value()).slice(0, 1) } } }),
            () => ({ [field.path]: [value()] })
        ],
        object: [
            () => ({ [field.path]: { $type: 'object' } }),
            () => ({ [field.path]: { $type: 'null' } })
        ],
        objectArray: [
            () => ({ [field.path]: { $size: rng.int(0, 3) } }),
            () => ({ [field.path]: { $type: 'array' } }),
            () => ({
                [field.path]: {
                    $elemMatch: {
                        orderNumber: { $gte: rng.int(1, 20) },
                        status: rng.pick(['open', 'shipped', 'cancelled'])
                    }
                }
            }),
            () => ({
                [field.path]: {
                    $elemMatch: {
                        phoneNumber: { $regex: '^[1-4]' },
                        isPrimary: true
                    }
                }
            }),
            () => ({
                [field.path]: {
                    $elemMatch: {
                        productNumber: { $lt: rng.int(1, 10) },
                        quantity: { $in: [1, 2, 3] }
                    }
                }
            }),
            () => ({
                [field.path]: {
                    $elemMatch: {
                        lineItems: {
                            $elemMatch: {
                                unitPrice: { $exists: true }
                            }
                        }
                    }
                }
            }),
            () => ({
                [field.path]: {
                    $elemMatch: {
                        $or: [
                            { amount: { $gt: rng.int(0, 500) } },
                            { status: 'open' }
                        ]
                    }
                }
            })
        ]
    };
    const all = common.concat(byKind[field.kind]);
    return rng.pick(all)();
}

/**
 * Creates a random selector that combines
 * the selectors of multiple fields with logical operators.
 */
export function randomSelector(rng: RandomGenerator, depth: number = 0): any {
    const fieldSelector = () => randomFieldSelector(rng, rng.pick(QUERY_FIELDS));
    if (depth > 1 || rng.bool(0.5)) {
        return fieldSelector();
    }
    const subSelectors = () => new Array(rng.int(1, 3)).fill(0).map(() => randomSelector(rng, depth + 1));
    return rng.pick<() => any>([
        () => ({ $and: subSelectors() }),
        () => ({ $or: subSelectors() }),
        () => ({ $nor: subSelectors() }),
        () => Object.assign({}, fieldSelector(), fieldSelector()),
        () => Object.assign({ $or: subSelectors() }, fieldSelector())
    ])();
}

export function randomQuery(rng: RandomGenerator): MangoQuery {
    const query: MangoQuery = {
        selector: randomSelector(rng)
    };
    if (rng.bool(0.4)) {
        /**
         * always sort by id as last criteria
         * so that the sort order is deterministic
         */
        const sort: { [k: string]: 1 | -1 } = {};
        /**
         * Sorting by an object compares the key names of the object,
         * which are different after compression, like they would be in MongoDB.
         * So only sort by fields that contain primitives.
         */
        const sortableFields = QUERY_FIELDS.filter(field => field.kind !== 'object' && field.kind !== 'objectArray');
        randomArray(rng, 2, () => rng.pick(sortableFields).path).forEach(path => {
            sort[path] = rng.bool() ? 1 : -1;
        });
        sort['id'] = 1;
        query.sort = sort;
    }
    if (rng.bool(0.3)) {
        /**
         * A projection must not contain a path
         * together with one of its sub-paths (path collision).
         */
        const fields = ['id'];
        randomArray(rng, 3, () => rng.pick(QUERY_FIELDS).path).forEach(path => {
            const collides = fields.find(existing =>
                existing === path ||
                existing.startsWith(path + '.') ||
                path.startsWith(existing + '.')
            );
            if (!collides) {
                fields.push(path);
            }
        });
        query.fields = fields;
    }
    if (rng.bool(0.3)) {
        query.skip = rng.int(0, 3);
    }
    if (rng.bool(0.3)) {
        query.limit = rng.int(1, 20);
    }
    return query;
}
