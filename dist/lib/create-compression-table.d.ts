import type { CompressionTable, JsonSchema, TableType } from './types';
/**
 * Compressed property-names begin with the compression-flag
 * it indicates that the name is compressed.
 * If an object is compressed, where one attribute starts with the
 * compression-flag, an error will be thrown.
 */
export declare const DEFAULT_COMPRESSION_FLAG = "|";
export declare function createCompressionTable(schema: JsonSchema, compressionFlag?: string, ignoreProperties?: string[]): CompressionTable;
/**
 * Returns a list of all property names that occur in the schema.
 * @returns Set of strings to ensure uniqueness.
 */
export declare function getPropertiesOfSchema(schema: JsonSchema): Set<string>;
export declare function compressedToUncompressedTable(schema: JsonSchema, ignoreProperties: string[]): TableType;
export declare function uncompressedToCompressedTable(table: TableType, compressionFlag: string, ignoreProperties: string[]): TableType;
