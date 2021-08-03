import type { PlainJsonObject, CompressionTable, MangoQuery } from './types';
/**
 * compress the keys of an object via the compression-table
 * @recursive
 */
export declare function compressObject(table: CompressionTable, obj: PlainJsonObject): PlainJsonObject;
/**
 * transform an object-path
 * into its compressed version
 * e.g:
 * - input: 'names[1].firstName'
 * - ouput: '|a[1].|b'
 */
export declare function compressedPath(table: CompressionTable, path: string): string;
export declare function throwErrorIfCompressionFlagUsed(table: CompressionTable, key: string): void;
export declare function compressedAndFlaggedKey(table: CompressionTable, key: string): string;
/**
 * compress a mango-query
 * so that it can be used to find documents
 * in a database where all documents are compressed
 */
export declare function compressQuery(table: CompressionTable, query: MangoQuery): MangoQuery;
/**
 * @recursive
 */
export declare function compressQuerySelector(table: CompressionTable, selector: any): any;
