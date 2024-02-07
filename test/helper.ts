import {
    randomString,
    randomBoolean,
    randomNumber
} from 'async-test-util';

import {
    JsonSchema,
    PlainJsonObject
} from '../src/types';

import {
    name
} from 'faker';

export function randomObject(): PlainJsonObject {
    return {
        firstName: name.firstName(),
        lastName: name.lastName(),
        title: 'Ms.',
        gender: 'f',
        zipCode: randomNumber(10000, 99999),
        countryCode: 'en',
        birthYear: 1960,
        active: randomBoolean(),
        shoppingCartItems: new Array(10).fill(0).map(() => ({
            productNumber: randomNumber(10000, 99999),
            amount: randomNumber(1, 10)
        }))
    };
}
export const schema: JsonSchema = {
    type: 'object',
    properties: {
        firstName: {
            type: 'string'
        },
        lastName: {
            type: 'string'
        },
        title: {
            type: 'string'
        },
        gender: {
            type: 'string'
        },
        zipCode: {
            type: 'number'
        },
        countryCode: {
            type: 'string'
        },
        birthYear: {
            type: 'number'
        },
        active: {
            type: 'boolean'
        },
        shoppingCartItems: {
            type: 'object',
            properties: {
                productNumber: {
                    type: 'number'
                },
                amount: {
                    type: 'number'
                }
            }
        }
    }
};
