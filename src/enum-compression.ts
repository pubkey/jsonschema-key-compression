import type {
    EnumCompressionTable,
    JsonSchema
} from './types';
import { alphabeticCompare } from './util';

/**
 * Enum-compression replaces the value of a property
 * by the index of that value inside of the enum of the property.
 * For example with the enum ['admin', 'editor', 'viewer']
 * the value 'editor' is stored as the number 1.
 *
 * Only enums where all values are strings can be compressed:
 * - The compressed value is a number, so a number inside of the enum
 *   could not be told apart from an index.
 * - Strings are also where the saved space actually is.
 *
 * The values are sorted before the indexes are assigned, so that the order
 * of the indexes is equal to the alphabetic order of the values.
 * This keeps sorting and range-queries like $gt working on compressed data.
 */
export function compressibleEnumValues(values: any[]): string[] | null {
    if (values.length === 0) {
        return null;
    }
    const unique: string[] = [];
    for (let i = 0; i < values.length; i++) {
        const value = values[i];
        if (typeof value !== 'string') {
            return null;
        }
        if (!unique.includes(value)) {
            unique.push(value);
        }
    }
    return unique.sort(alphabeticCompare);
}

/**
 * Returns the enum that applies to the values which are stored
 * at a property, or null if the property has no compressible enum.
 * The enum can either be defined at the property itself,
 * or at the items of an array-property.
 */
function valueEnumOfSchema(schema: JsonSchema): string[] | null {
    if (Array.isArray(schema.enum)) {
        return compressibleEnumValues(schema.enum);
    }
    const items = schema.items;
    if (items && !Array.isArray(items) && Array.isArray(items.enum)) {
        return compressibleEnumValues(items.enum);
    }
    return null;
}

function equalEnumValues(a: string[], b: string[]): boolean {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

/**
 * Collects the enum of each property name for every place
 * where the name occurs in the schema.
 * All sub-schema keywords are walked, not only the ones that
 * the key-compression uses, so that a property name which is used
 * with different enums is detected as ambiguous.
 * @recursive
 */
function addEnumCandidates(
    schema: JsonSchema,
    candidates: Map<string, (string[] | null)[]>
) {
    const properties = schema.properties;
    if (properties) {
        // do not use Object.entries, it is transpiled shitty
        const propertyNames = Object.keys(properties);
        for (let i = 0; i < propertyNames.length; i++) {
            const property = propertyNames[i] as string;
            const subSchema = properties[property] as JsonSchema;
            let found = candidates.get(property);
            if (!found) {
                found = [];
                candidates.set(property, found);
            }
            found.push(valueEnumOfSchema(subSchema));
            addEnumCandidates(subSchema, candidates);
        }
    }

    const items = schema.items;
    if (items) {
        if (Array.isArray(items)) {
            for (let i = 0; i < items.length; i++) {
                addEnumCandidates(items[i] as JsonSchema, candidates);
            }
        } else {
            addEnumCandidates(items, candidates);
        }
    }
    if (schema.additionalItems && typeof schema.additionalItems === 'object') {
        addEnumCandidates(schema.additionalItems, candidates);
    }

    const subSchemaLists: (JsonSchema[] | undefined)[] = [schema.allOf, schema.anyOf, schema.oneOf];
    for (let i = 0; i < subSchemaLists.length; i++) {
        const subSchemas = subSchemaLists[i];
        if (subSchemas) {
            for (let j = 0; j < subSchemas.length; j++) {
                addEnumCandidates(subSchemas[j] as JsonSchema, candidates);
            }
        }
    }
    if (schema.not) {
        addEnumCandidates(schema.not, candidates);
    }

    const subSchemaMaps: ({ [k: string]: JsonSchema } | undefined)[] = [schema.patternProperties, schema.definitions];
    for (let i = 0; i < subSchemaMaps.length; i++) {
        const schemaMap = subSchemaMaps[i];
        if (schemaMap) {
            Object.keys(schemaMap).forEach(key => addEnumCandidates(schemaMap[key] as JsonSchema, candidates));
        }
    }

    const dependencies = schema.dependencies;
    if (dependencies) {
        Object.keys(dependencies).forEach(key => {
            const dependency = dependencies[key] as JsonSchema | string[];
            if (!Array.isArray(dependency)) {
                addEnumCandidates(dependency, candidates);
            }
        });
    }
}

/**
 * Creates the table that maps a property name to the enum of its values.
 * A property name is only compressed when it has the same compressible enum
 * at every place where it occurs in the schema. Otherwise the same value
 * could mean different things depending on where it is stored.
 */
export function getEnumCompressionTable(
    schema: JsonSchema,
    ignoreProperties: string[]
): EnumCompressionTable {
    const candidates: Map<string, (string[] | null)[]> = new Map();
    addEnumCandidates(schema, candidates);

    const table: EnumCompressionTable = new Map();
    const propertyNames = Array.from(candidates.keys()).sort(alphabeticCompare);
    for (let i = 0; i < propertyNames.length; i++) {
        const property = propertyNames[i] as string;
        if (ignoreProperties.includes(property)) {
            continue;
        }
        const occurrences = candidates.get(property) as (string[] | null)[];
        const first = occurrences[0];
        if (!first) {
            continue;
        }
        let isAmbiguous = false;
        for (let j = 1; j < occurrences.length; j++) {
            const other = occurrences[j];
            if (!other || !equalEnumValues(first, other)) {
                isAmbiguous = true;
                break;
            }
        }
        if (!isAmbiguous) {
            table.set(property, first);
        }
    }
    return table;
}

/**
 * Returns true if the given number can be an index of the enum.
 * Number.isInteger() is not used to stay usable on old runtimes.
 */
function isEnumIndex(value: number, enumValues: string[]): boolean {
    return value >= 0 && value < enumValues.length && value % 1 === 0;
}

/**
 * Replaces the enum-value by its index.
 * Values that are not part of the enum are kept as they are,
 * so that data which does not match the schema is not destroyed.
 */
export function compressEnumValue(
    enumValues: string[],
    value: any
): any {
    if (typeof value === 'string') {
        const index = enumValues.indexOf(value);
        return index === -1 ? value : index;
    }
    if (Array.isArray(value)) {
        const ret: any[] = new Array(value.length);
        for (let i = 0; i < value.length; i++) {
            const item = value[i];
            if (typeof item === 'string') {
                const index = enumValues.indexOf(item);
                ret[i] = index === -1 ? item : index;
            } else {
                ret[i] = item;
            }
        }
        return ret;
    }
    return value;
}

/**
 * Replaces the index by its enum-value.
 * The exact counterpart of compressEnumValue().
 */
export function decompressEnumValue(
    enumValues: string[],
    value: any
): any {
    if (typeof value === 'number') {
        return isEnumIndex(value, enumValues) ? enumValues[value] : value;
    }
    if (Array.isArray(value)) {
        const ret: any[] = new Array(value.length);
        for (let i = 0; i < value.length; i++) {
            const item = value[i];
            ret[i] = (typeof item === 'number' && isEnumIndex(item, enumValues)) ? enumValues[item] : item;
        }
        return ret;
    }
    return value;
}
