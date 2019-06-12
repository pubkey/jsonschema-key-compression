// Old
{
  "notice": "times are in milliseconds",
  "createCompressionTable": {
    "amount": 1000,
    "total": 142.1716889999807,
    "perInstance": 0.1421716889999807
  },
  "compress": {
    "amount": 1000,
    "total": 120.0001779999584,
    "perObject": 0.1200001779999584
  },
  "decompress": {
    "amount": 1000,
    "total": 165.6791459992528,
    "perObject": 0.1656791459992528
  }
}


// With Map() instead of object

{
  "notice": "times are in milliseconds",
  "createCompressionTable": {
    "amount": 1000,
    "total": 148.27645599842072,
    "perInstance": 0.1482764559984207
  },
  "compress": {
    "amount": 1000,
    "total": 113.6411669999361,
    "perObject": 0.11364116699993611
  },
  "decompress": {
    "amount": 1000,
    "total": 141.75103699974716,
    "perObject": 0.14175103699974717
  }
}
