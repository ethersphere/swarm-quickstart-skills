# Postage Stamps — Reference

Detailed reference for stamp management beyond the buy/size happy path in `SKILL.md`. Load this when the user needs the bee-js utility helpers, wants to manage an existing batch (top up, dilute, inspect), needs to check content retrievability, or wants the full conceptual model.

## bee-js Utility Functions

All stamp helpers live under the `Utils` namespace in bee-js 12.x — they are **not** top-level exports. (Several were renamed from earlier versions; the old names no longer exist.)

```javascript
import { Utils, Size, Duration } from '@ethersphere/bee-js'

Utils.getDepthForSize(Size.fromMegabytes(100))        // Size → minimum depth (was getDepthForCapacity)
Utils.getStampEffectiveBytes(depth)                   // depth → effective storable bytes
Utils.getStampTheoreticalBytes(depth)                 // depth → max theoretical bytes (was getStampMaximumCapacityBytes)
Utils.getStampCost(depth, amount)                     // depth + amount → cost (BZZ object)
Utils.getStampUsage(utilization, depth, bucketDepth)  // how full a stamp is
Utils.getStampDuration(amount, pricePerBlock, blockTime)   // amount → Duration (was getStampTtlSeconds)
Utils.getAmountForDuration(Duration.fromDays(30), pricePerBlock, blockTime)  // Duration → amount (was getAmountForTtl)
```

`pricePerBlock` is the network's `currentPrice` (from `GET /chainstate`); `blockTime` is `5` seconds on Gnosis Chain.

### Estimate cost / Size & Duration helpers

```javascript
import { Bee, Size, Duration } from '@ethersphere/bee-js'

const bee = new Bee('http://localhost:1633')

// Estimate cost before buying (returns a BZZ object)
const cost = await bee.getStorageCost(Size.fromGigabytes(1), Duration.fromDays(30))
console.log('Estimated cost:', cost.toDecimalString(), 'BZZ')
console.log('In PLUR:', cost.toPLURString())

// Size helpers
Size.fromBytes(n)        // → Size
Size.fromKilobytes(n)    // → Size
Size.fromMegabytes(n)    // → Size
Size.fromGigabytes(n)    // → Size

// Duration helpers
Duration.fromSeconds(n)  // → Duration
Duration.fromHours(n)    // → Duration
Duration.fromDays(n)     // → Duration
Duration.fromWeeks(n)    // → Duration
Duration.fromYears(n)    // → Duration
Duration.fromEndDate(d)  // → Duration (from a Date object)
```

## Manage Stamps

Managing an expired stamp batch is only useful if you have content still **pinned locally** that was uploaded with that batch — it lets you revive those chunks without re-uploading. For new uploads, buy a fresh batch instead.

### List all batches

```bash
swarm-cli stamp list
```

Or via API:

```bash
curl -s http://localhost:1633/stamps | jq
```

### Inspect a specific batch

```bash
swarm-cli stamp show <stamp-id>
```

### Extend TTL (top up)

Run `swarm-cli stamp show <stamp-id>` to get the current `amount`, then top up by however much additional time you need (see the amount → duration table in `SKILL.md`).

```bash
swarm-cli stamp topup --stamp <stamp-id> --amount <additional-amount>
```

Via API:

```bash
curl -X PATCH "http://localhost:1633/stamps/topup/<batchID>/<amount>"
```

Via bee-js:

```javascript
await bee.topUpBatch(batchId, additionalAmount.toString())
```

### Increase capacity (dilute)

Increase depth to store more data. **Dilution alone decreases TTL** — combine with a top up to maintain duration.

Run `swarm-cli stamp show <stamp-id>` and note the current `depth` and `amount`. Determine the required new depth (use the depth → capacity table in `SKILL.md`), then calculate the top-up needed to hold the current TTL at the new depth:

```
top_up_amount = current_amount × (2^(new_depth − current_depth) − 1)
```

Then dilute, followed by top up:

```bash
swarm-cli stamp dilute --depth <new-depth> --stamp <stamp-id>
swarm-cli stamp topup --stamp <stamp-id> --amount <calculated-top-up-amount>
```

Via API:

```bash
curl -s -X PATCH http://localhost:1633/stamps/dilute/<batchID>/<newDepth>
```

Via bee-js:

```javascript
await bee.diluteBatch(batchId, newDepth)
await bee.topUpBatch(batchId, topUpAmount.toString())
```

## Check Content Retrievability

```javascript
const isRetrievable = await bee.isReferenceRetrievable(reference)
console.log('Retrievable:', isRetrievable)
```

If `false` and the content is pinned locally, re-upload it:

```bash
swarm-cli pinning reupload <reference>
```

## Concepts

### Depth → capacity

Swarm stores data as 4 KB chunks. Depth controls how many chunks a batch covers:

```
theoretical max = 2^depth chunks × 4 KB
```

Effective capacity is lower than the theoretical max because chunks distribute across 2^16 neighbourhood buckets, and a batch becomes full when any single bucket fills. Effective capacity also varies with encryption and erasure-coding settings. Both capacity and TTL are non-deterministic in practice due to bucket mechanics and price-oracle fluctuations.

**Effective (realistic) capacities** (unencrypted, no erasure coding):

| Depth | Effective capacity |
|-------|--------------------|
| 17 | ~44.7 KB |
| 18 | ~6.7 MB |
| 19 | ~112 MB |
| 20 | ~688 MB |
| 21 | ~2.6 GB |
| 22 | ~7.7 GB |
| 23 | ~19.9 GB |
| 24 | ~47.1 GB |

Full tables for all depths and encoding modes: https://docs.ethswarm.org/docs/concepts/incentives/postage-stamps/#effective-utilisation-tables

### Encryption and erasure coding

These are per-upload settings, not batch properties — you choose them at upload time. Different uploads using the same batch can use different settings. They affect how many chunks each upload consumes.

- **Encryption:** Content is encrypted at upload so only someone with the key can read it. Encrypted uploads generate roughly twice as many chunks (data + key chunks), consuming about twice the capacity for the same data.
- **Erasure coding:** Adds redundant parity chunks so content survives node loss. More redundancy = more chunks consumed per unit of data = less effective capacity. Levels: NONE, MEDIUM, STRONG, INSANE, PARANOID.

Combining both (encrypted + erasure coded) compounds the capacity reduction. See the full tables linked above for exact figures.

### Amount → duration (TTL)

Amount is denominated in PLUR — Swarm's smallest unit of account (1 xBZZ = 10^16 PLUR). It is a per-chunk payment rate per block on Gnosis Chain. The actual TTL depends on the current network storage price, which fluctuates.

```
amount = currentPrice × 17280 × days
```

Where `17280` = blocks per day (5-second blocks on Gnosis Chain). Formula shortcut at a representative price: `amount ≈ 1,335,104,641 × desired_days`. **Minimum amount** must cover 24 hours of storage.

### TTL is an estimate

TTL shown by the node is calculated from the current network storage price, which changes as Swarm adoption grows. The actual duration may be longer or shorter. Treat all figures as estimates and keep a buffer, especially for production content.

Content with an expired batch cannot be re-uploaded to the network unless it was pinned locally. Re-uploading identical chunks from the same node does not consume additional batch slots.

## Reference

- Stamp batches: https://docs.ethswarm.org/docs/develop/tools-and-features/buy-a-stamp-batch
- bee-js docs: https://bee-js.ethswarm.org/docs/
- Bee API: https://docs.ethswarm.org/api/
- swarm-cli: https://github.com/ethersphere/swarm-cli
