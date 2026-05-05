---
name: stamps
description: List, buy, size, top up, and manage postage stamps for Swarm uploads
user-invocable: true
---

# Manage Postage Stamps

Guide a developer through listing, buying, sizing, topping up, and managing postage stamps. Stamps are required before any upload to Swarm.

## Step 1: List Existing Stamps (DO THIS FIRST)

**Immediately run this command** before doing anything else — do not just show it to the user:

```bash
curl -s http://localhost:1633/stamps | jq '.stamps[] | {batchID, depth, usable, batchTTL, immutableFlag}'
```

If the command fails (connection refused, etc.), the node is not running — tell the user "Your Bee node isn't running." Ask: "Would you like me to walk you through installing and starting one?" If yes, run through the `/swarm-setup` flow now. If no, note that a running node is required and wait for their direction.

Present the results as a table with: batch ID (shortened), depth, effective capacity, type (mutable/immutable from `immutableFlag`), and approximate TTL in days (batchTTL / 86400).

If they have a usable stamp with enough capacity and TTL, ask if they want to reuse it instead of buying a new one. They can also top up or dilute an existing stamp (see Manage Stamps below).

## What to Ask

1. **How much data?** Offer the size presets below.
2. **How long should it persist?** Offer the duration presets below.
3. **Will you update/overwrite the data?** (mutable vs immutable)

**If unsure, recommend:** depth 20 + 3 months (~680 MB effective, amount ~120,159,417,615) — a safe starting point for development and testing.

## How Stamps Work

- **Depth** controls capacity (how much data you can upload)
- **Amount** controls duration (how long it stays on Swarm)
- Both are set at purchase time. Amount can be topped up later. Depth can be increased (diluted) later.
- Stamps cost xBZZ. The node must be funded before buying.

### Mutable vs Immutable

- **Immutable (default):** Becomes unusable once capacity fills. Good for static content.
- **Mutable:** Older chunks get overwritten when full. Good for feeds and updateable content. Set `immutable` header to `false` when buying via API.

## Storage Presets

These are **effective (realistic) capacities** — not theoretical maximums. Actual capacity is lower than `2^depth * 4KB` because chunks distribute unevenly across 2^16 buckets.

### Size options

| Size | Depth |
|------|-------|
| 110 MB | 19 |
| 680 MB | 20 |
| 2.6 GB | 21 |
| 7.7 GB | 22 |

### Duration options

| Duration |
|----------|
| 15 days |
| 1 month |
| 3 months |
| 6 months |
| 1 year |

### Calculating amount from duration

Amount depends on the current network storage price:

```
amount = currentPrice * 17280 * days
```

Where `17280` = blocks per day (5-second blocks on Gnosis Chain).

**Quick reference** (approximate, varies with network price):

| Duration | Amount (approximate) |
|----------|---------------------|
| 15 days | 20,026,569,615 |
| 1 month | 40,053,139,205 |
| 3 months | 120,159,417,615 |
| 6 months | 240,318,835,230 |
| 1 year | 480,637,670,460 |

Formula shortcut: `amount ≈ 1,335,104,641 * desired_days`

**Minimum amount** must cover 24 hours of storage.

## Buy a Stamp

### Before buying — estimate cost and check balance

**Always do this before purchasing — do not skip:**

1. Check wallet balance:
   ```bash
   curl -s http://localhost:1633/wallet | jq '{bzzBalance, nativeTokenBalance}'
   ```

2. Calculate cost using bee-js utility or this formula:
   ```
   cost in PLUR = amount * (2 ^ depth)
   cost in BZZ  = cost in PLUR / 10^16
   ```

3. Present the estimate to the user: depth, effective capacity, estimated TTL, estimated cost in BZZ, and current balance. **Ask for confirmation before proceeding.**

If balance is insufficient, suggest funding via `/swarm-setup` or reusing an existing stamp.

### Via swarm-cli

```bash
swarm-cli stamp buy --depth 22 --amount 120159417615
```

Returns estimated cost, capacity, TTL, and the stamp ID. Save the stamp ID.

### Via API

```bash
curl -s -X POST http://localhost:1633/stamps/<amount>/<depth>
```

Example (~7.7 GB effective, ~3 months):

```bash
curl -s -X POST http://localhost:1633/stamps/120159417615/22
```

For mutable stamps:

```bash
curl -s -X POST http://localhost:1633/stamps/120159417615/22 -H "immutable: false"
```

Returns `batchID` and `txHash`.

### Via bee-js (recommended)

```javascript
import { Bee, Size, Duration } from '@ethersphere/bee-js'

const bee = new Bee('http://localhost:1633')
const batchId = await bee.buyStorage(Size.fromGigabytes(7.7), Duration.fromDays(90))
console.log('Stamp ID:', batchId)
```

Low-level alternative (if you need exact depth/amount control):

```javascript
const batchId = await bee.createPostageBatch('120159417615', 22)
```

**Important:** Wait several minutes after purchase for the stamp to propagate on the network before using it.

## bee-js Utility Functions

```javascript
import {
  getDepthForCapacity,          // bytes → depth
  getAmountForTtl,              // seconds → amount
  getStampCost,                 // depth + amount → cost in BZZ
  getStampTtlSeconds,           // amount → TTL in seconds
  getStampUsage,                // check how full a stamp is
  getStampEffectiveBytes,       // depth → effective storable bytes
  getStampMaximumCapacityBytes  // depth → max theoretical bytes
} from '@ethersphere/bee-js'
```

## Manage Stamps

### List all stamps

```bash
swarm-cli stamp list
```

Or via API:

```bash
curl -s http://localhost:1633/stamps | jq
```

### Check a specific stamp

```bash
swarm-cli stamp show <stamp-id>
```

### Top up (extend duration)

```bash
swarm-cli stamp topup --stamp <stamp-id> --amount <additional-amount>
```

Via API:

```bash
curl -X PATCH "http://localhost:1633/stamps/topup/<batchID>/<amount>"
```

Via bee-js:

```javascript
await bee.topUpBatch(batchId, '40053139205')
```

### Dilute (increase capacity)

Increase depth to store more data. Dilution alone decreases TTL — combine with topup to maintain duration.

```bash
swarm-cli stamp dilute --depth <new-depth> --stamp <stamp-id>
```

Via API:

```bash
curl -s -X PATCH http://localhost:1633/stamps/dilute/<batchID>/<newDepth>
```

Via bee-js:

```javascript
await bee.diluteBatch(batchId, 24)
```

## TTL Warning

TTL is estimated based on current storage price, which fluctuates as Swarm adoption changes. Always maintain a buffer for important data. Content with expired stamps cannot be re-uploaded unless pinned locally.

## Check Content Retrievability

```bash
curl "http://localhost:1633/stewardship/<reference>"
```

Returns `isRetrievable: true/false`. If false and content is pinned locally:

```bash
curl -X PUT "http://localhost:1633/stewardship/<reference>"
```

## Reference

- Stamp batches: https://docs.ethswarm.org/docs/develop/tools-and-features/buy-a-stamp-batch
- bee-js docs: https://bee-js.ethswarm.org/docs/
- Bee API: https://docs.ethswarm.org/api/
- swarm-cli: https://github.com/ethersphere/swarm-cli
