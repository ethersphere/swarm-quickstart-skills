---
name: stamps
description: Manage Swarm postage stamps: list, buy, size, top up, dilute, estimate TTL/capacity, and resolve common stamp usability issues.
user-invocable: true
---

# Manage Postage Stamp Batches

Guide a developer through listing, buying, sizing, topping up, and managing postage stamp batches. Stamp batches are required before any upload to Swarm.

## Formatting

When presenting to the user, use consistent labels before each code block:
- **Run in your terminal:** — a command the user should execute
- **Expected output:** — example of what a successful result looks like
- **Save as `filename`:** — file contents the user should write to disk

Add a `---` horizontal rule before each labeled code block to visually separate it from surrounding text.

---

## Step 1: List Existing Stamp Batches (DO THIS FIRST)

**Immediately run this command** before doing anything else — do not just show it to the user:

```bash
swarm-cli stamp list
```

If the command fails (connection refused, etc.), the node is not running — tell the user "Your Bee node isn't running." Ask: "Would you like me to walk you through installing and starting one?" If yes, run through the `/setup-bee-interactive` flow now. If no, note that a running node is required and wait for their direction.

Present the results as a table with these columns: full batch ID (do not shorten — the user needs to copy it), remaining capacity and total capacity formatted as "X MB remaining / Y MB total", type (mutable/immutable), and TTL as shown.

If they have a usable stamp batch with enough capacity and TTL, ask if they want to reuse it instead of buying a new one.

After presenting the results, ask:

**What would you like to do?**
1. **Buy a new stamp batch** — purchase a fresh stamp batch sized for your data and duration
2. **Manage an existing stamp batch** — top up (extend TTL) or dilute (increase capacity) a batch you already have
3. **Learn more** — understand how depth, amount, and TTL work, and what they mean for your storage

---

## Option 1: Buy a New Stamp Batch

Before the user runs the command, share these three points:

- **Minimum TTL is 24 hours** — you cannot buy a batch that expires sooner than that.
- **Capacity comes in discrete sizes** — because of how Swarm distributes chunks across neighbourhood buckets, a batch fills up before its theoretical maximum. Buy a bit more than you think you need.
- **Batches can be extended but not shrunk** — you can always top up TTL or dilute (increase capacity) later, but you cannot reduce a batch after purchase. It's fine to start small and extend as needed.

Tell the user to run the following command in a separate terminal window:

---

**Run in your terminal:**

```bash
swarm-cli stamp create
```

The interactive prompt will ask for capacity (e.g. `500MB`, `1GB`) and TTL (e.g. `1w`, `1month`, `1y`), show the cost in xBZZ, and ask for confirmation before purchasing.

For GSOC messaging or streaming (mutable batch):

```bash
swarm-cli stamp create --immutable false
```

Save the **batch ID** from the output. Once purchased, wait a few minutes for the batch to propagate on the network before using it.

---

## Option 2: Manage an Existing Stamp Batch

Ask which batch they want to work with, then ask:
- **Extend TTL** — the batch is running out of time
- **Increase capacity** — the batch is running out of space

Note: managing an expired stamp batch is only useful if you have content still **pinned locally** that was uploaded with that batch — it lets you revive those chunks without re-uploading. For new uploads, buy a fresh stamp batch instead.

### Extend TTL

Run `swarm-cli stamp show <stamp-id>` to get the current `amount` value, then top up by however much additional time they need (see the amount → duration table in Option 3).

```bash
swarm-cli stamp topup --stamp <stamp-id> --amount <additional-amount>
```

Via bee-js:

```javascript
await bee.topUpBatch(batchId, additionalAmount.toString())
```

### Increase capacity

Run `swarm-cli stamp show <stamp-id>` and note the current `depth` and `amount` values. Ask what capacity they need and determine the required new depth (use the depth → capacity table in Option 3).

Calculate the top-up amount needed to maintain the current TTL at the new depth:

```
top_up_amount = current_amount × (2^(new_depth − current_depth) − 1)
```

Do this calculation for the user. Then run dilute followed by top up:

```bash
swarm-cli stamp dilute --depth <new-depth> --stamp <stamp-id>
swarm-cli stamp topup --stamp <stamp-id> --amount <calculated-top-up-amount>
```

Via bee-js:

```javascript
await bee.diluteBatch(batchId, newDepth)
await bee.topUpBatch(batchId, topUpAmount.toString())
```

---

### Check a Stamp Batch

```bash
swarm-cli stamp show <stamp-id>
```

Or list all:

```bash
swarm-cli stamp list
```

### Check Content Retrievability

```javascript
const isRetrievable = await bee.isReferenceRetrievable(reference)
console.log('Retrievable:', isRetrievable)
```

If `false` and content is pinned locally, re-upload it:

```bash
swarm-cli pinning reupload <reference>
```

---

## Option 3: How Stamps Work

### The two parameters: depth and amount

Every stamp batch has two values set at purchase time:

- **Depth** determines storage capacity — how many chunks you can upload
- **Amount** is a per-chunk payment rate — it determines how long the storage is paid for (TTL)

Think of depth as the size of a bucket and amount as the rate you're paying to keep it filled. A higher amount means the network is paid more per chunk, so the content persists longer.

### Depth → capacity

Swarm stores data as 4 KB chunks. Depth controls how many chunks a stamp batch covers:

```
theoretical max = 2^depth chunks × 4 KB
```

But effective capacity is lower than the theoretical max because chunks are distributed across 2^16 neighbourhood buckets, and a stamp batch becomes full when any single bucket fills up. The exact effective capacity also varies with encryption and erasure coding settings (see below). Both capacity and TTL are non-deterministic in practice due to bucket mechanics and price oracle fluctuations.

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

These are per-upload settings, not batch properties — you choose them at upload time, not when buying the batch. Different uploads using the same batch can use different settings. They affect how many chunks each upload consumes from the batch.

- **Encryption:** Content is encrypted at upload time so only someone with the decryption key can read it. Encrypted uploads generate twice as many chunks (data chunks + key chunks), so they consume approximately twice the batch capacity for the same amount of data. Use when storing private or sensitive content.

- **Erasure coding:** Adds redundant parity chunks so content can be reconstructed even if some nodes go offline or lose data. The more redundancy, the more chunks are consumed per unit of data — and the less effective capacity a given batch depth provides. Swarm offers five levels: NONE, MEDIUM, STRONG, INSANE, and PARANOID. Use higher levels when long-term retrievability matters more than storage efficiency.

Both options can be combined (encrypted + erasure coded), which compounds the capacity reduction. For exact effective capacities at each combination, see the full tables linked above.

### Amount → duration (TTL)

Amount is denominated in PLUR — Swarm's smallest unit of account (1 xBZZ = 10^16 PLUR). It represents a per-chunk payment rate per block on Gnosis Chain. The actual TTL depends on the current network storage price, which fluctuates.

```
amount = currentPrice × 17280 × days
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

Formula shortcut: `amount ≈ 1,335,104,641 × desired_days`

**Minimum amount** must cover 24 hours of storage.

### Mutable vs Immutable

- **Immutable (default):** Becomes unusable once capacity fills. Required for feed entries (SOCs) — do not use mutable stamp batches for the batch that covers a feed's index entries.
- **Mutable:** Older chunks get overwritten when full. Valid for frequently updated content — for example, you can upload a new version of your site with a mutable stamp batch to get a new hash, then write that hash as an update to an immutable feed. Also useful for GSOC messaging, live video/audio streaming, and cheap throwaway testing. Buy with `--immutable false` (swarm-cli) or `immutableFlag: false` option (bee-js).

### TTL is an estimate

TTL shown by the node is calculated from the current network storage price, which changes as Swarm adoption grows. The actual duration may be longer or shorter than quoted. Both TTL and effective capacity are non-deterministic — treat all figures as estimates and maintain a buffer, especially for production content.

Content with an expired stamp batch cannot be re-uploaded to the network unless it was pinned locally.

Re-uploading identical chunks from the same node does not consume additional batch slots.

### bee-js utility functions

For programmatic stamp batch management:

```javascript
import { Bee, Size, Duration } from '@ethersphere/bee-js'

const bee = new Bee('http://localhost:1633')

// Estimate cost before buying (returns BZZ object)
const cost = await bee.getStorageCost(Size.fromGigabytes(1), Duration.fromDays(30))
console.log('Estimated cost:', cost.toDecimalString(), 'BZZ')
console.log('In PLUR:', cost.toPLURString())

// Size and Duration helpers
Size.fromBytes(n)        // → Size
Size.fromKilobytes(n)    // → Size
Size.fromMegabytes(n)    // → Size
Size.fromGigabytes(n)    // → Size

Duration.fromSeconds(n)  // → Duration
Duration.fromHours(n)    // → Duration
Duration.fromDays(n)     // → Duration
Duration.fromWeeks(n)    // → Duration
Duration.fromYears(n)    // → Duration
Duration.fromEndDate(d)  // → Duration (from a Date object)
```

## Conceptual Questions

For any conceptual or technical question not covered by the steps above, invoke `/docs` to find the relevant authoritative source rather than answering from prior knowledge.

## Reference

- Stamp batches: https://docs.ethswarm.org/docs/develop/tools-and-features/buy-a-stamp-batch
- bee-js docs: https://bee-js.ethswarm.org/docs/
- Bee API: https://docs.ethswarm.org/api/
- swarm-cli: https://github.com/ethersphere/swarm-cli

