# Changelog

## Unreleased

- FIX: `createCompressedJsonSchema()` did not compress the `properties`, `required` and `items` of nested schemas whose `type` is a type-array like `['object', 'null']` or `['array', 'null']`, or whose `type` is omitted. Because `createCompressionTable()` and `compressObject()` do compress these keys, a compressed object did not validate against its compressed schema.
- FIX: `createCompressedJsonSchema()` did not compress property names inside of `allOf`, `anyOf`, `oneOf`, `not`, `patternProperties`, `additionalItems`, `dependencies` and `definitions`. The compression-table is not changed by this, so already compressed data stays compatible.
- FIX: `createCompressionTable()` with `ignoreProperties` removed the decompression entry of a different property when an ignored property name was equal to a generated compressed key like `b`. `decompressObject()` then left that key compressed.
- ADD: A general consistency test that runs random mango-queries (via mingo) and schema validation (via ajv) on random documents of a complex schema, to ensure that compressed and non-compressed data behave the same.
