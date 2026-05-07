---
name: feed
description: Create and manage Swarm feeds for stable, updateable URLs using bee-js or swarm-cli, including manifest creation and feed updates.
user-invocable: true
---

# Feeds (Dynamic Content)

Guide a developer through creating and using feeds on Swarm. Feeds provide a stable address that always points to the latest content — the URL never changes even when content is updated.

## Formatting

When presenting to the user, use consistent labels before each code block:
- **Run in your terminal:** — a command the user should execute
- **Expected output:** — example of what a successful result looks like
- **Save as `filename`:** — file contents the user should write to disk

Add a `---` horizontal rule before each labeled code block to visually separate it from surrounding text.

---

## Before Starting (run immediately)

Silently check node status (`curl -s http://localhost:1633/node`) and stamp availability (`swarm-cli stamp list`). If the node is down, offer to walk through `/setup-bee-interactive`. If no usable stamp exists, route to `/stamps`.

Also check for existing identities (`swarm-cli identity list 2>/dev/null` on Linux/macOS/WSL, or `swarm-cli identity list 2>$null` in PowerShell). If the developer already has an identity and feed, skip to [Update the feed](#update-the-feed).

## What to Ask

1. **What will the feed hold?** (website, app state, blog, data updates)
2. **bee-js or swarm-cli?**

## Prerequisites

- For bee-js: `npm install @ethersphere/bee-js`
- For swarm-cli: `npm install -g @ethersphere/swarm-cli`

## How Feeds Work

A feed combines an **owner** (Ethereum address) and a **topic** (human-readable string) into a predictable address. Anyone can read, only the owner can update.

```
GET /bzz/MANIFEST_HASH/
→ resolve manifest → extract topic + owner
→ look up latest feed entry
→ read content reference
→ serve content
```

Old content stays on Swarm but the feed always resolves to the latest version.

## Via bee-js

### Generate a publisher key (first time only)

```javascript
import crypto from "crypto";
import { PrivateKey } from "@ethersphere/bee-js";

const hex = "0x" + crypto.randomBytes(32).toString("hex");
const pk = new PrivateKey(hex);

console.log("Private key:", pk.toHex());
console.log("Address:", pk.publicKey().address().toHex());
```

> **Security:** Store this private key securely (e.g., environment variable or encrypted keyfile). Never commit it to version control. Losing this key means losing the ability to update this feed.

### Write to a feed

```javascript
import { Bee, Topic, PrivateKey } from "@ethersphere/bee-js";

const bee = new Bee("http://localhost:1633");
const pk = new PrivateKey("YOUR_PRIVATE_KEY");
const owner = pk.publicKey().address();
const topic = Topic.fromString("my-topic");

// Upload content
const upload = await bee.uploadFile(batchId, "My content", "note.txt");

// Write to feed
const writer = bee.makeFeedWriter(topic, pk);
await writer.uploadReference(batchId, upload.reference);
```

### Read from a feed

```javascript
import { Bee, Topic, EthAddress } from "@ethersphere/bee-js";

const bee = new Bee("http://localhost:1633");
const topic = Topic.fromString("my-topic");
const owner = new EthAddress("OWNER_ADDRESS");

const reader = bee.makeFeedReader(topic, owner);
const result = await reader.downloadReference();

console.log("Latest reference:", result.reference.toHex());
console.log("Feed index:", result.feedIndex.toBigInt());
```

### Create a feed manifest (stable URL)

```javascript
const manifest = await bee.createFeedManifest(batchId, topic, owner);
console.log("Feed manifest:", manifest.toHex());
// Access at: http://localhost:1633/bzz/<manifest>/
```

The manifest hash never changes. Use it for ENS registration or as a permanent link.

### Update the feed

Upload new content, then write the new reference to the same feed:

```javascript
const newUpload = await bee.uploadFile(batchId, "Updated content", "note.txt");
await writer.uploadReference(batchId, newUpload.reference);
// Same manifest URL now serves the updated content
```

## Via swarm-cli

### Create identity (first time only)

```bash
swarm-cli identity create publisher --password <SECURE_PASSWORD>
```

Save output securely. Export later with: `swarm-cli identity export publisher --password <SECURE_PASSWORD>`

### Upload to feed

```bash
swarm-cli feed upload ./my-content \
  --identity publisher \
  --topic-string my-topic \
  --stamp <BATCH_ID> \
  --password <SECURE_PASSWORD>
```

Returns the feed manifest URL. Save the manifest hash.

### Update the feed

Same command with new content — same identity + topic = same manifest URL:

```bash
swarm-cli feed upload ./updated-content \
  --identity publisher \
  --topic-string my-topic \
  --stamp <BATCH_ID>
```

### Read a feed

```bash
swarm-cli feed print \
  --identity publisher \
  --topic-string my-topic \
  --password <SECURE_PASSWORD>
```

## Use Cases

- **Websites** — update your site without changing the URL or ENS record (see `/host-website`)
- **Blogs** — add/edit/delete posts, re-upload, update feed
- **App state** — store config, user data, or settings at a stable address
- **RSS / podcasts** — publish new episodes to a fixed feed address
- **Social feeds** — post updates that followers can discover by your address + topic

## Important Notes

- Always use **immutable** stamp batches with feeds — immutable stamps prevent accidental overwrite of historical feed entries that the feed index still references
- Only the feed owner (holder of the private key) can publish updates
- Anyone can read a feed knowing the owner address + topic (or the manifest hash)
- Old content remains on Swarm — the feed just points to the latest version

## If Something Goes Wrong

| Error | Fix |
|-------|-----|
| "stamp not usable" | Wait 2-3 minutes after buying |
| "insufficient funds" | Wallet needs xBZZ — see `/setup-bee-interactive` |
| "feed not found" | Wrong identity/topic combination, or feed hasn't been written to yet |
| Connection refused | Node isn't running — route to `/setup-bee-interactive` |
| Other errors | Route to `/troubleshoot` |

## Conceptual Questions

For any conceptual or technical question not covered by the steps above, invoke `/docs` to find the relevant authoritative source rather than answering from prior knowledge.

## Reference

- Feeds: https://docs.ethswarm.org/docs/develop/tools-and-features/feeds
- Dynamic content guide: https://docs.ethswarm.org/docs/develop/dynamic-content
- bee-js docs: https://bee-js.ethswarm.org/docs/
- swarm-cli: https://github.com/ethersphere/swarm-cli

