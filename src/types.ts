export type TableType = Map<string, string>;

export type CompressionTable = {
    compressedToUncompressed: TableType;
    uncompressedToCompressed: TableType;
    compressionFlag: string;
};


/**
 * An object that contains plain json-data
 * which can be fully json-stringified and parsed
 * TODO
 */
export type PlainJsonObjectNotArray = {
    [k: string]: any;
};

export type PlainJsonObject = PlainJsonObjectNotArray | PlainJsonObjectNotArray[];


export type SortDirection = 'asc' | 'desc' | 1 | -1;

export type MangoQuery = {
    selector: any;
    skip?: number;
    limit?: number;
    fields?: string[];
    sort?: { [k: string]: 1 | -1 }[] | string[] | { [k: string]: SortDirection };
};


/**
 * @link https://github.com/types/lib-json-schema/blob/master/v4/index.d.ts
 */
export type JsonSchemaTypes = 'array' | 'boolean' | 'integer' | 'number' | 'null' | 'object' | 'string';
export interface JsonSchema {
    allOf?: JsonSchema[];
    anyOf?: JsonSchema[];
    oneOf?: JsonSchema[];
    additionalItems?: boolean | JsonSchema;
    additionalProperties?: boolean;
    type?: JsonSchemaTypes | JsonSchemaTypes[];
    description?: string;
    dependencies?: {
        [key: string]: JsonSchema | string[];
    };
    exclusiveMinimum?: boolean;
    exclusiveMaximum?: boolean;
    items?: JsonSchema | JsonSchema[];
    multipleOf?: number;
    maxProperties?: number;
    maximum?: number;
    minimum?: number;
    maxLength?: number;
    minLength?: number;
    maxItems?: number;
    minItems?: number;
    minProperties?: number;
    pattern?: string;
    patternProperties?: {
        [key: string]: JsonSchema;
    };
    properties?: {
        [key: string]: JsonSchema;
    };
    required?: string[];
    uniqueItems?: boolean;
    enum?: any[];
    not?: JsonSchema;
    definitions?: {
        [key: string]: JsonSchema;
    };
    format?: 'date-time' | 'email' | 'hostname' | 'ipv4' | 'ipv6' | 'uri' | string;
}
