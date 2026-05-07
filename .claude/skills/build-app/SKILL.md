---
name: build-app
description: Scaffold a Swarm app or add bee-js to an existing project, with core upload/download patterns and node-compatibility guidance.
user-invocable: true
---

# Build a Swarm App

Guide a developer through scaffolding and building an app that uses Swarm for decentralized storage.

## Formatting

When presenting to the user, use consistent labels before each code block:
- **Run in your terminal:** — a command the user should execute
- **Expected output:** — example of what a successful result looks like
- **Save as `filename`:** — file contents the user should write to disk

Add a `---` horizontal rule before each labeled code block to visually separate it from surrounding text.

---

## Before Starting (run immediately)

Silently check node status (`curl -s http://localhost:1633/node`). If the node is down, offer to walk through `/setup-bee-interactive` (a node is required to test uploads, though scaffolding can proceed without one).

Also check for an existing project (`test -f package.json` on Linux/macOS/WSL, or `Test-Path package.json` in PowerShell):
- **If `package.json` exists:** Default to adding bee-js. Ask: "I see you already have a project here. Want me to add bee-js to it, or scaffold a separate Swarm project?"
- **If no project:** Default to scaffolding. Ask what type.

## What to Ask

1. **What kind of app?** (Node.js backend, browser/React frontend, or both)

## Prerequisites

- Node.js 18+

## Option A: Scaffold with create-swarm-app (recommended)

Scaffolds a working project with bee-js wired up, ready to hack.

```bash
npm init swarm-app@latest my-app <type>
cd my-app
npm install
npm start
```

### Template types

| Type | What you get |
|------|-------------|
| `node` | Node.js + CommonJS |
| `node-esm` | Node.js + ES Modules |
| `node-ts` | Node.js + TypeScript |
| `vite-tsx` | React + Vite + TypeScript (browser app) |

### Optional flags

```bash
npm init swarm-app@latest my-app node-ts --host http://localhost:1633 --auth <API_KEY>
```

- `--host <url>` — Bee node URL (default: `http://localhost:1633`)
- `--auth <key>` — Bee node API key (if required)

### What the scaffold does

- Creates a project with bee-js as a dependency
- Sets up a `config.ts` (or `config.js`) with the Bee host URL
- Generates a working example that uploads data, downloads it back, and auto-finds or creates a postage stamp:

```javascript
import { Bee, Size, Duration } from '@ethersphere/bee-js'
import { BEE_HOST } from './config'

const bee = new Bee(BEE_HOST)

// Auto-find usable stamp or buy a new one
const batches = await bee.getPostageBatches()
const usable = batches.find(x => x.usable)
const batchId = usable ? usable.batchID : await bee.buyStorage(Size.fromGigabytes(1), Duration.fromDays(1))

// Upload
const uploadResult = await bee.uploadData(batchId, 'Hello, world!')
console.log('Swarm hash', uploadResult.reference.toHex())

// Download
const downloadResult = await bee.downloadData(uploadResult.reference)
console.log('Downloaded:', downloadResult.toUtf8())
```

## Option B: Add bee-js to an existing project

```bash
npm install @ethersphere/bee-js
```

### Basic connection

```javascript
import { Bee } from '@ethersphere/bee-js'

const bee = new Bee('http://localhost:1633')

// Check connection
const connected = await bee.isConnected()
console.log('Connected:', connected)
```

### Common patterns

**Upload data:**
```javascript
const { reference } = await bee.uploadData(batchId, 'my data')
```

**Upload file (Node.js):**
```javascript
import { readFile } from 'node:fs/promises'
const data = await readFile('./photo.png')
const { reference } = await bee.uploadFile(batchId, data, 'photo.png', {
  contentType: 'image/png'
})
```

**Upload file (Browser):**
```javascript
const { reference } = await bee.uploadFile(batchId, file) // File object from input
```

**Download:**
```javascript
const file = await bee.downloadFile(reference)
console.log(file.data.toUtf8())
```

**Auto-find or buy a stamp:**
```javascript
import { Bee, Size, Duration } from '@ethersphere/bee-js'

const bee = new Bee('http://localhost:1633')
const batches = await bee.getPostageBatches()
const usable = batches.find(x => x.usable)
const batchId = usable ? usable.batchID : await bee.buyStorage(Size.fromGigabytes(1), Duration.fromDays(1))
```

## Bee Node Compatibility

Not all features work on all node types:

| Feature | Ultra-light | Light | Full |
|---------|------------|-------|------|
| Download data | Yes | Yes | Yes |
| Upload data | No | Yes | Yes |
| Feeds | No | Yes | Yes |
| Buy stamps | No | Yes | Yes |
| ACT (access control) | No | Yes | Yes |
| PSS send | No | Yes | Yes |
| PSS subscribe | No | No | Yes |
| Staking | No | No | Yes |

## What's Next

Once the app is running, the developer can add:
- **File uploads** → `/upload-download`
- **Dynamic content** → `/feed`
- **Website hosting** → `/host-website`
- **Access control** → `/act`
- **Real-time messaging** → `/messaging`
- **AI agent integration** → [swarm-mcp](https://github.com/ethersphere/swarm-mcp) gives AI tools native Swarm capabilities via MCP

## Conceptual Questions

For any conceptual or technical question not covered by the steps above, invoke `/docs` to find the relevant authoritative source rather than answering from prior knowledge.

## Reference

- create-swarm-app: https://github.com/ethersphere/create-swarm-app
- bee-js docs: https://bee-js.ethswarm.org/docs/
- Bee API: https://docs.ethswarm.org/api/
- Developer intro: https://docs.ethswarm.org/docs/develop/introduction

