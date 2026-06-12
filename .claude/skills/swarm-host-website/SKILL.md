---
name: swarm-host-website
description: Deploy a static website (a folder with index.html) to Swarm via swarm-cli or bee-js, as a one-time upload or an updateable feed, with optional ENS content-hash setup (eth.limo / bzz.link). Use when the user wants to publish, host, or update a site or single-page app on decentralized storage.
user-invocable: true
---

# Host a Website on Swarm

Guide a developer through hosting a static website on Swarm. Ask which method they prefer (swarm-cli or bee-js), then walk them through step by step.

## Formatting

When presenting to the user, use consistent labels before each code block:
- **Run in your terminal:** — a command the user should execute
- **Expected output:** — example of what a successful result looks like
- **Save as `filename`:** — file contents the user should write to disk

Add a `---` horizontal rule before each labeled code block to visually separate it from surrounding text.

---

## Before Starting (run immediately)

Run these checks now and **narrate each in a short line** — say what you're checking, run it (don't paste the command), report the result. Don't pause for confirmation; these are read-only checks.

1. **Say "Checking your Bee node…"**, then run `curl -s http://localhost:1633/status | jq .beeMode`. Fails → "✗ No Bee node running." and offer to walk through `/swarm-setup-bee-interactive`.
2. **Say "Checking for a usable postage stamp…"**, then run `swarm-cli stamp list`. None usable → route to `/swarm-stamps`.

Then present the prerequisites to the user:

## Prerequisites

- Static website files with at least an `index.html` (common output folders: `dist/`, `build/`, `out/`, `public/`)
- swarm-cli installed (handled by `/swarm-setup-bee-interactive` — if missing, run that first)
- If using bee-js instead: `npm install @ethersphere/bee-js` in your project

Ask the user to confirm they have these before continuing.

## Decision: One-time upload vs Feed (updateable)

Ask: "Will you need to update this website later, or is this a one-time deploy?"

- **One-time** → Upload by hash (simpler, but new hash on every change, requires ENS update each time)
- **Updateable** → Use a Feed (fixed manifest URL, update content without changing ENS)

**Always recommend Feeds for production websites.**

## Method 1: swarm-cli

### One-time upload

```bash
swarm-cli upload ./website \
  --stamp <BATCH_ID> \
  --index-document index.html \
  --error-document 404.html
```

Access at: `http://localhost:1633/bzz/<SWARM_HASH>/`

### Feed-based (recommended)

#### Step 1: Create publisher identity (first time only)

```bash
swarm-cli identity create website-publisher --password <SECURE_PASSWORD>
```

Pass `--password` so the command doesn't prompt for one (or `--only-keypair` for a cleartext keypair). The same password is needed later for `swarm-cli feed print`. Save the output securely; export later with `swarm-cli identity export website-publisher`.

#### Step 2: Upload to feed

```bash
swarm-cli feed upload ./website \
  --identity website-publisher \
  --topic-string website \
  --stamp <BATCH_ID> \
  --index-document index.html \
  --error-document 404.html
```

Save the **manifest hash** from the "Feed Manifest URL" output (the part after `/bzz/`). This is the permanent reference — it never changes.

#### Step 3: Update the site (repeat as needed)

Run the same feed upload command with updated files. Same identity + topic = same manifest URL.

## Method 2: bee-js

### One-time upload

```javascript
import { Bee } from "@ethersphere/bee-js";

const bee = new Bee("http://localhost:1633");
const batchId = "<BATCH_ID>";

const result = await bee.uploadFilesFromDirectory(batchId, "./website", {
  indexDocument: "index.html",
  errorDocument: "404.html"
});

console.log("Swarm hash:", result.reference.toHex());
// Access at: http://localhost:1633/bzz/<SWARM_HASH>/
```

### Feed-based (recommended)

#### Generate a publisher key (first time only)

```javascript
import crypto from "crypto";
import { PrivateKey } from "@ethersphere/bee-js";

const hexKey = "0x" + crypto.randomBytes(32).toString("hex");
const privateKey = new PrivateKey(hexKey);

console.log("Private key:", privateKey.toHex());
console.log("Public address:", privateKey.publicKey().address().toHex());
// Store the private key securely — never commit it to version control
```

> **Security:** Store this private key securely (e.g., environment variable or encrypted keyfile). Never commit it to version control. Losing this key means losing the ability to update this feed.

#### Upload website + create feed

```javascript
import { Bee, Topic, PrivateKey } from "@ethersphere/bee-js";

const bee = new Bee("http://localhost:1633");
const batchId = "<BATCH_ID>";
const privateKey = new PrivateKey("<PUBLISHER_KEY>");
const owner = privateKey.publicKey().address();

const topic = Topic.fromString("website");
const writer = bee.makeFeedWriter(topic, privateKey);

// Upload website files
const upload = await bee.uploadFilesFromDirectory(batchId, "./website", {
  indexDocument: "index.html",
  errorDocument: "404.html"
});
console.log("Website Swarm Hash:", upload.reference.toHex());

// Point feed to the upload
await writer.uploadReference(batchId, upload.reference);

// Create feed manifest (use this hash for ENS)
const manifestRef = await bee.createFeedManifest(batchId, topic, owner);
console.log("Feed Manifest:", manifestRef.toHex());
```

#### Update the site

```javascript
// Upload new version
const newUpload = await bee.uploadFilesFromDirectory(batchId, "./website", {
  indexDocument: "index.html",
  errorDocument: "404.html"
});

// Update feed — manifest hash stays the same
await writer.uploadReference(batchId, newUpload.reference);
```

## Connect to ENS Domain (optional)

After uploading, ask: "Do you want to connect this to an ENS domain?"

If yes:

1. Go to app.ens.domains → open your domain → Records tab
2. Add Content Hash with value: `bzz://<MANIFEST_HASH>`
3. Confirm the transaction

Once registered, the site is accessible at:
- `https://yourname.eth.limo/`
- `https://yourname.bzz.link/`
- `http://localhost:1633/bzz/yourname.eth/`

**Use the feed manifest hash** (not the website hash) so future updates don't require ENS changes.

### ENS localhost note

Some RPC endpoints don't resolve ENS on localhost. Working alternatives:
- `https://mainnet.infura.io/v3/<your-key>`
- `https://eth-mainnet.public.blastapi.io`
- Your own Ethereum node

## Stamp Expiry Warning

When your stamp expires, your website becomes inaccessible — silently. ENS will still resolve but the content will be gone.

- Monitor stamp TTL: `swarm-cli stamp show <stamp-id>`
- Top up before expiry: `swarm-cli stamp topup --stamp <stamp-id> --amount <amount>`
- Set a calendar reminder for stamp renewal
- For production sites, use stamps with **6+ month duration**

## ENS Prerequisites

ENS integration requires:
- An existing ENS name (buy at [app.ens.domains](https://app.ens.domains))
- A funded Ethereum mainnet wallet (ETH for gas)
- Familiarity with ENS content records

If you don't have these, use the raw `bzz://` link or [Beeport](https://beeport.ethswarm.org) instead.

## Conceptual Questions

For any conceptual or technical question not covered by the steps above, invoke `/swarm-docs` to find the relevant authoritative source rather than answering from prior knowledge.

## Reference

- Full guide: https://docs.ethswarm.org/docs/develop/host-your-website/
- ENS setup: https://support.ens.domains
- bee-js docs: https://bee-js.ethswarm.org/docs/
- swarm-cli: https://github.com/ethersphere/swarm-cli

