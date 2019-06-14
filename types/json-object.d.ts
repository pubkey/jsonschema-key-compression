/**
 * An object that contains plain json-data
 * which can be fully json-stringified and parsed
 * TODO
 */
export type PlainJsonObjectNotArray = {
    [k: string]: any;
};

export type PlainJsonObject = PlainJsonObjectNotArray | PlainJsonObjectNotArray[];