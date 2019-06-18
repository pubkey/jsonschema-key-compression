# jsonschema-key-compression

Compress json-data based on it's [json-schema](https://json-schema.org/) while still having valid json.
It works by compressing long attribute-names into smaller ones and backwards.

For example this:

```json

{
    "firstName": "alice",
    "lastName": "wonder",
    "registerDate": "2019-06-01",
    "country": "de",
    "active": true,
    "eyeColor": "brown"
}

```

becomes this:

```json
{
    "|a": "alice",
    "|b": "wonder",
    "|c": "2019-06-01",
    "|d": "de",
    "|e": true,
    "|f": "brown"
}
```

The compressed version only needs **85 chars** while the non-compressed version needs **123 chars**. So by storing the compressed version, you can store up to 30% more data.

## You should use this when
- you want to save storage space in an NoSQL-database but still want to have valid json-data
- you transmit many objects in many small requests over the network so that gzip cannot be efficient
- you want to store json-data inside of the browser-storage (indexedDB or localstorage) and you reach the storage limit

## You should NOT use this when
- you send many objects in a single request, you should rely on gzip instead
- you do not want to still have valid json-data, you should use [protobuf](https://developers.google.com/protocol-buffers/) instead
- you have schema-less data