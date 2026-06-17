---
name: swarm-stamps
description: List, buy, size, top up, and dilute postage stamps (postage batches) — required before any Swarm upload. Covers depth vs. capacity, amount vs. duration/TTL, mutable vs. immutable, live-price cost estimation, and the bee-js Utils stamp helpers. Use when the user needs a stamp, asks about storage cost/capacity/expiry, or hits a 'no usable stamp' error.
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

**Say "Checking your existing stamp batches…"**, then run this immediately — don't just show it, and don't pause for confirmation (it's a read-only check):

```bash
swarm-cli stamp list
```

If the command fails (connection refused, etc.), the node isn't running — say "✗ No Bee node running." Ask: "Would you like me to walk you through installing and starting one?" If yes, run through the `/swarm-setup-bee-interactive` flow now. If no, note that a running node is required and wait for their direction.

Present the results as a table with these columns: full batch ID (do not shorten — the user needs to copy it), remaining capacity and total capacity formatted as "X MB remaining / Y MB total", type (mutable/immutable), and TTL as shown.

If they have a usable stamp batch with enough capacity and TTL, ask if they want to reuse it instead of buying a new one. They can also top up or dilute an existing batch — see **[REFERENCE.md](REFERENCE.md)**.

After presenting the results, ask:

**What would you like to do?**
1. **Buy a new stamp batch** — purchase a fresh batch sized for your data and duration
2. **Manage an existing stamp batch** — top up (extend TTL) or dilute (increase capacity); see **[REFERENCE.md](REFERENCE.md)**
3. **Learn more** — how depth, amount, and TTL work; see **[REFERENCE.md](REFERENCE.md)**

---

## How Stamps Work (quick version)

- **Depth** controls capacity — how much data you can upload.
- **Amount** is a per-chunk payment rate — it controls how long the data persists (TTL).
- Both are set at purchase time. Amount can be topped up later; depth can be increased (diluted) later. Neither can be reduced.
- Stamp batches cost xBZZ. The node must be funded before buying.

Full conceptual detail (depth→capacity math, encryption/erasure coding, amount→duration) lives in **[REFERENCE.md](REFERENCE.md)**.

### Mutable vs Immutable

- **Immutable (default):** Becomes unusable once capacity fills. Required for feed entries (SOCs) — do not use a mutable batch for the batch that covers a feed's index entries.
- **Mutable:** Older chunks get overwritten when full. Use for frequently updated content, GSOC messaging, live streaming, and cheap throwaway testing. Buy with `--immutable false` (swarm-cli) or `immutableFlag: false` (bee-js).

---

## Buy a New Stamp Batch

Before the user runs anything, share these three points:

- **Minimum TTL is 24 hours** — you cannot buy a batch that expires sooner.
- **Capacity comes in discrete sizes** — a batch fills before its theoretical maximum because chunks distribute across 2^16 neighbourhood buckets. Buy a bit more than you think you need.
- **Batches can be extended but not shrunk** — start small and top up / dilute later.

### What to ask

1. **How much data?** Use the size presets below.
2. **How long should it persist?** Use the duration presets below.
3. **Will you update/overwrite the data?** (mutable vs immutable)

**If unsure, recommend:** depth 20 + 3 months (~680 MB effective, amount ~120,159,417,615) — a safe starting point for development and testing.

### Size options

Effective (realistic) capacities — not theoretical maximums (verify with `Utils.getStampEffectiveBytes(depth)`):

| Size | Depth |
|------|-------|
| ~40 KB | 17 |
| ~6 MB | 18 |
| ~110 MB | 19 |
| ~680 MB | 20 |
| ~2.6 GB | 21 |
| ~7.7 GB | 22 |

> **Low depths are tiny:** depth 17 holds only ~40 KB (not ~7 MB — that figure is actually depth 18). Below depth 19, effective capacity is a small fraction of the `2^depth × 4KB` theoretical size.

### Duration options

| Duration |
|----------|
| 15 days |
| 1 month |
| 3 months |
| 6 months |
| 1 year |

Amount depends on the current network storage price, so compute it from the live price rather than trusting a fixed table:

```
amount = currentPrice × 17280 × days
```

`17280` = blocks per day (5-second blocks on Gnosis Chain).

---

**Run in your terminal:** (compute the amount for your duration)

```bash
PRICE=$(curl -s http://localhost:1633/chainstate | jq .currentPrice)
echo $((PRICE * 17280 * 30))   # amount for 30 days
```

Quick reference (upper-bound estimates from a higher historical price; can overpay ~40% vs. the current price — treat as ceilings):

| Duration | Amount (upper-bound estimate) |
|----------|-------------------------------|
| 15 days | ~20,026,569,615 |
| 1 month | ~40,053,139,205 |
| 3 months | ~120,159,417,615 |
| 6 months | ~240,318,835,230 |
| 1 year | ~480,637,670,460 |

### Before buying — estimate cost and check balance

**Always do this before purchasing — do not skip:**

1. Check wallet balance:

   ```bash
   curl -s http://localhost:1633/wallet | jq '{bzzBalance, nativeTokenBalance}'
   ```

2. Estimate cost with `Utils.getStampCost(depth, amount)` (returns a BZZ object), or this formula:

   ```
   cost in PLUR = amount × (2 ^ depth)
   cost in BZZ  = cost in PLUR / 10^16
   ```

3. Present the estimate: depth, effective capacity, estimated TTL, estimated cost in BZZ, and current balance. **Ask for confirmation before proceeding.**

If balance is insufficient, suggest funding via `/swarm-setup-bee-interactive` or reusing an existing batch.

### Via swarm-cli

---

**Run in your terminal:**

```bash
swarm-cli stamp buy --depth 20 --amount 120159417615
```

For GSOC messaging or streaming (mutable batch):

```bash
swarm-cli stamp buy --depth 20 --amount 120159417615 --immutable false
```

Returns the estimated cost, capacity, TTL, and the **batch ID**. Save the batch ID.

### Via API

```bash
curl -s -X POST http://localhost:1633/stamps/<amount>/<depth>
```

Example (~680 MB effective, ~3 months):

```bash
curl -s -X POST http://localhost:1633/stamps/120159417615/20
```

For a mutable batch, add `-H "immutable: false"`. Returns `batchID` and `txHash`.

### Via bee-js (recommended)

```javascript
import { Bee, Size, Duration } from '@ethersphere/bee-js'

const bee = new Bee('http://localhost:1633')
const batchId = await bee.buyStorage(Size.fromGigabytes(0.68), Duration.fromDays(90))
console.log('Batch ID:', batchId)
```

Low-level alternative (exact depth/amount control):

```javascript
const batchId = await bee.createPostageBatch('120159417615', 20)
```

**Important:** Wait several minutes after purchase for the batch to propagate on the network before using it.

## TTL Warning

TTL is estimated from the current network storage price, which fluctuates as Swarm adoption grows. The actual duration may be longer or shorter than quoted — both TTL and effective capacity are non-deterministic. Always maintain a buffer for important data. Content with an expired batch cannot be re-uploaded unless it was pinned locally.

## Managing an Existing Stamp Batch

For deeper operations, see **[REFERENCE.md](REFERENCE.md)**:

- **bee-js utility functions** — `Utils.getStampCost`, `getStampEffectiveBytes`, `getDepthForSize`, `getAmountForDuration`, plus `Size`/`Duration` helpers and `bee.getStorageCost`
- **Manage stamps** — list, inspect (`stamp show`), top up (extend TTL), dilute (increase capacity)
- **Check content retrievability** — `bee.isReferenceRetrievable` and re-upload
- **Deep concepts** — depth→capacity math, encryption & erasure coding, amount→duration

## Conceptual Questions

For any conceptual or technical question not covered above, invoke `/swarm-docs` to find the relevant authoritative source rather than answering from prior knowledge.

## Reference

- Stamp batches: https://docs.ethswarm.org/docs/develop/tools-and-features/buy-a-stamp-batch
- bee-js docs: https://bee-js.ethswarm.org/docs/
- Bee API: https://docs.ethswarm.org/api/
- swarm-cli: https://github.com/ethersphere/swarm-cli
