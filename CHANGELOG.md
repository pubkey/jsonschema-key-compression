# Changelog

## Unreleased

- FIX: `createCompressedJsonSchema()` did not compress the `properties`, `required` and `items` of nested schemas whose `type` is a type-array like `['object', 'null']` or `['array', 'null']`, or whose `type` is omitted. Because `createCompressionTable()` and `compressObject()` do compress these keys, a compressed object did not validate against its compressed schema.
