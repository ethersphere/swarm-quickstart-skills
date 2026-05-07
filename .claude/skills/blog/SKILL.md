---
name: blog
description: Build and publish a Swarm blog with a permanent feed-manifest URL, post management workflow, and optional ENS domain mapping.
user-invocable: true
---

# Build a Blog on Swarm

Guide a developer through building a blog with a permanent URL that always serves the latest content. Posts are stored on Swarm; a feed acts as a mutable pointer so the URL never changes even when content is updated.

## Formatting

When presenting to the user, use consistent labels before each code block:
- **Run in your terminal:** — a command the user should execute
- **Expected output:** — example of what a successful result looks like
- **Save as `filename`:** — file contents the user should write to disk

Add a `---` horizontal rule before each labeled code block to visually separate it from surrounding text.

---

## Before Starting (run immediately)

Silently check node status (`curl -s http://localhost:1633/node`) and stamp availability (`swarm-cli stamp list`). If the node is down, offer to walk through `/setup-bee-interactive`. If no usable stamp exists, route to `/stamps`.

**Important:** The stamp must be **immutable** (the default). Mutable stamps overwrite old chunks when full, breaking the feed's sequential index and making old posts unretrievable. If the developer only has mutable stamps, help them buy an immutable one.

## How It Works

A Swarm blog has two layers:

1. **Content layer** — The actual HTML site is uploaded as a directory. Each upload returns a new Swarm hash.
2. **Feed layer** — A feed (identified by owner address + topic) stores a pointer to the latest upload. The feed manifest is a single hash that never changes.

```
Visitor → feed manifest URL
        → resolve feed → get latest content hash
        → serve blog site
```

Old versions of the blog remain accessible at their original hashes, but the feed always resolves to the latest.

## Project Structure

```
my-blog/
  init.js       — Run once: generate key, create feed, save config
  post.js       — Create, edit, delete posts; re-upload; update feed
  read.js       — Read current feed entry (no private key needed)
  render.js       — Generate HTML from posts array
  posts.json    — Local post data (source of truth)
  config.json   — Feed config: private key, owner, topic, manifest hash
  site/         — Generated HTML output (uploaded to Swarm)
  .env          — BEE_URL and BATCH_ID
```

## Step 1: Set Up the Project

**Run in your terminal:**

```bash
mkdir my-blog && cd my-blog
npm init -y
npm install @ethersphere/bee-js dotenv
```

Paste the output to confirm before continuing.

---

In VS Code, create a new file called `.env` and add these two lines (no leading spaces, no quotes):

**Save as `.env`:**

```
BEE_URL=http://localhost:1633
BATCH_ID=<your-stamp-batch-id>
```

Then run:

```bash
npm pkg set type=module
echo "config.json" >> .gitignore && echo ".env" >> .gitignore
```

Confirm with `cat .env` (Linux/macOS) or `Get-Content .env` (PowerShell) and paste the output before continuing.

Open the project in VS Code for easier file editing:

```bash
code .
```

(If `code` isn't found, open VS Code manually and use File → Open Folder.)

## Step 2: Site Renderer (`render.js`)

```javascript
import { writeFileSync, mkdirSync } from 'fs'

export function writeSiteFiles(posts) {
  mkdirSync('./site', { recursive: true })

  const postList = posts.length === 0
    ? '<p>No posts yet.</p>'
    : posts.map(p => `
        <article>
          <h2>${p.title}</h2>
          <time>${p.date}</time>
          <p>${p.body}</p>
        </article>`).join('\n')

  writeFileSync('./site/index.html', `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>My Swarm Blog</title></head>
<body>
  <h1>My Swarm Blog</h1>
  ${postList}
</body>
</html>`)
}
```

## Step 3: Initialize the Blog (`init.js`)

Run once. Generates a publisher key, uploads an empty blog, creates the feed and feed manifest, and saves config.

```javascript
import { Bee, Topic, PrivateKey } from '@ethersphere/bee-js'
import crypto from 'crypto'
import { writeFileSync } from 'fs'
import { config } from 'dotenv'
import { writeSiteFiles } from './render.js'

config()

const bee = new Bee(process.env.BEE_URL)
const batchId = process.env.BATCH_ID

// Generate publisher key — store securely, never commit
const hex = '0x' + crypto.randomBytes(32).toString('hex')
const pk = new PrivateKey(hex)
const owner = pk.publicKey().address()
const topic = Topic.fromString('blog')

// Upload empty blog
writeFileSync('posts.json', '[]')
writeSiteFiles([])

const upload = await bee.uploadFilesFromDirectory(batchId, './site', {
  indexDocument: 'index.html',
})
console.log('Uploaded empty blog:', upload.reference.toHex())

// Create feed and manifest
const writer = bee.makeFeedWriter(topic, pk)
await writer.uploadReference(batchId, upload.reference)

const manifest = await bee.createFeedManifest(batchId, topic, owner)
console.log('Feed manifest:', manifest.toHex())

// Save config
writeFileSync('config.json', JSON.stringify({
  privateKey: pk.toHex(),
  owner: owner.toHex(),
  topic: 'blog',
  manifest: manifest.toHex(),
}, null, 2))

console.log(`\nBlog live at: ${process.env.BEE_URL}/bzz/${manifest.toHex()}/`)
```

> **Security:** `config.json` contains your private key — it was added to `.gitignore` in Step 1, but double-check before any `git add`. Anyone with this key can publish to your blog.

Run it:

```bash
node init.js
```

Save the manifest hash — this is your permanent blog URL.

## Step 4: Manage Posts (`post.js`)

Create, edit, and delete posts. Each operation: updates `posts.json` → regenerates HTML → re-uploads site → updates feed.

```javascript
import { Bee, Topic, PrivateKey } from '@ethersphere/bee-js'
import { readFileSync, writeFileSync } from 'fs'
import { config } from 'dotenv'
import { writeSiteFiles } from './render.js'

config()

const bee = new Bee(process.env.BEE_URL)
const batchId = process.env.BATCH_ID
const cfg = JSON.parse(readFileSync('config.json', 'utf-8'))

const pk = new PrivateKey(cfg.privateKey)
const topic = Topic.fromString(cfg.topic)
const writer = bee.makeFeedWriter(topic, pk)

const [,, command, slug, title, body] = process.argv
let posts = JSON.parse(readFileSync('posts.json', 'utf-8'))

if (command === 'create') {
  if (posts.find(p => p.slug === slug)) {
    console.error(`Post "${slug}" already exists`)
    process.exit(1)
  }
  posts.push({ slug, title, body, date: new Date().toISOString().slice(0, 10) })

} else if (command === 'edit') {
  const i = posts.findIndex(p => p.slug === slug)
  if (i === -1) { console.error(`Post "${slug}" not found`); process.exit(1) }
  posts[i] = { ...posts[i], title, body, date: new Date().toISOString().slice(0, 10) }

} else if (command === 'delete') {
  posts = posts.filter(p => p.slug !== slug)

} else {
  console.error('Usage: node post.js <create|edit|delete> <slug> [title] [body]')
  process.exit(1)
}

writeFileSync('posts.json', JSON.stringify(posts, null, 2))
writeSiteFiles(posts)

const upload = await bee.uploadFilesFromDirectory(batchId, './site', {
  indexDocument: 'index.html',
})
console.log('Uploaded site:', upload.reference.toHex())

await writer.uploadReference(batchId, upload.reference)
console.log('Feed updated.')
console.log(`Blog: ${process.env.BEE_URL}/bzz/${cfg.manifest}/`)
```

Usage:

```bash
node post.js create hello-world "Hello World" "My first post on Swarm."
node post.js edit hello-world "Hello World" "Updated body."
node post.js delete hello-world
```

## Step 5: Read the Feed (`read.js`)

Anyone can read the feed with only the owner address and topic — no private key needed.

```javascript
import { Bee, Topic, EthAddress } from '@ethersphere/bee-js'
import { readFileSync } from 'fs'
import { config } from 'dotenv'

config()

const bee = new Bee(process.env.BEE_URL)
const cfg = JSON.parse(readFileSync('config.json', 'utf-8'))

const topic = Topic.fromString(cfg.topic)
const owner = new EthAddress(cfg.owner)
const reader = bee.makeFeedReader(topic, owner)

const result = await reader.downloadReference()

console.log('Latest reference:', result.reference.toHex())
console.log('Feed index:', result.feedIndex.toBigInt())
console.log(`View: ${process.env.BEE_URL}/bzz/${cfg.manifest}/`)
```

## Via swarm-cli (alternative)

If the developer prefers a simpler path without writing all the scripts above:

```bash
# Initialize identity (first time)
swarm-cli identity create blog-publisher

# Upload a post directory and create/update the feed
swarm-cli feed upload ./site \
  --identity blog-publisher \
  --topic-string blog \
  --stamp <BATCH_ID> \
  --index-document index.html

# The manifest hash (printed as "Feed Manifest URL") is the permanent address
```

This works well for simple static content but gives less control over post data management (no `posts.json`, no programmatic create/edit/delete).

## Connect to ENS (optional)

After `init.js` runs, point an ENS name at the feed manifest:

1. Go to app.ens.domains → your domain → Records
2. Set Content Hash to `bzz://<MANIFEST_HASH>`
3. Confirm the transaction

Your blog is then accessible at `https://yourname.eth.limo/` and `https://yourname.bzz.link/`.

Use the **manifest hash** (not the site upload hash) so ENS never needs updating when you publish new posts.

## Stamp Expiry

When your stamp expires, the blog silently goes offline — ENS still resolves but content is gone.

- Check TTL: `swarm-cli stamp show <stamp-id>`
- Top up before expiry: `swarm-cli stamp topup --stamp <stamp-id> --amount <amount>`
- Recommended minimum duration: **6 months** for any public blog

See `/stamps` for sizing and top-up guidance.

## If Something Goes Wrong

| Error | Fix |
|-------|-----|
| Feed not updating | Confirm `config.json` has the correct `privateKey` and `topic` |
| Old content showing | Feed index propagates in seconds — wait and refresh |
| "stamp not usable" | Wait 2-3 minutes after buying; stamp is still propagating |
| Blog goes blank after many posts | Stamp is mutable — buy an immutable stamp and re-initialize |
| "not found" on manifest | Stamp expired — top up and re-upload |
| Connection refused | Node isn't running — invoke `/setup-bee-interactive` directly |

## Reference

- Dynamic content guide: https://docs.ethswarm.org/docs/develop/dynamic-content
- Simple blog example: https://github.com/ethersphere/examples/tree/master/simple-blog
- Etherjot (full-featured Swarm blog): https://github.com/Cafe137/etherjot
- bee-js feeds: https://bee-js.ethswarm.org/docs/soc-and-feeds/
- swarm-cli: https://github.com/ethersphere/swarm-cli

