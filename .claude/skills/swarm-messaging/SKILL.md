---
name: swarm-messaging
description: Set up real-time messaging on Swarm with GSOC (many-to-one, e.g. chat or notifications) or PSS (point-to-point, optionally encrypted, offline-capable), via bee-js. Covers mining keys, sending, subscribing, full-node requirements, and mutable-stamp needs. Use for chat, notifications, webhooks, or private peer-to-peer messages.
user-invocable: true
---

# Real-Time Messaging (GSOC & PSS)

Guide a developer through setting up real-time messaging on Swarm. Two protocols available depending on the use case.

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
2. **Say "Checking for a usable postage stamp…"**, then run `swarm-cli stamp list`. None usable → route to `/swarm-stamps` (stamps are required for GSOC sending).

## What to Ask

1. **What's the messaging pattern?** Many-to-one (notifications, chat) → GSOC. Point-to-point (private messages) → PSS.

**Note:** GSOC and PSS are currently only supported via bee-js. swarm-cli does not have messaging commands.

## Which Protocol?

| | GSOC | PSS |
|---|---|---|
| **Pattern** | Many writers → one service node | Point-to-point |
| **Encryption** | No (plain data) | Optional (recipient's public key) |
| **Service node** | Must be **full node** | Must be **full node** (to subscribe) |
| **Writer node** | Light or full | Light or full |
| **Offline delivery** | No | Yes — messages sync as chunks |
| **Use cases** | Chat rooms, notifications, webhooks | Private messages, encrypted comms |

## Prerequisites

- **GSOC:** Service node must be a full node. Stamps must be **mutable** (`immutable: false`).
- **PSS:** Receiving node must be a full node.
- `npm install @ethersphere/bee-js`

## GSOC (Graffiti Single Owner Chunk)

Many-to-one messaging. Multiple writer nodes send messages to a single service node.

### Service node — mine key and listen

```javascript
import { Bee, NULL_IDENTIFIER } from '@ethersphere/bee-js'

const bee = new Bee('http://localhost:1633')

// Mine a GSOC key for this node's overlay
const addresses = await bee.getNodeAddresses()
const privateKey = bee.gsocMine(addresses.overlay, NULL_IDENTIFIER, 12)
console.log('Overlay:', addresses.overlay.toHex())
console.log('Public key:', privateKey.publicKey().toCompressedHex())

// Subscribe to messages
const subscription = bee.gsocSubscribe(
  privateKey.publicKey().address(),
  NULL_IDENTIFIER,
  {
    onMessage: message => console.log('Received:', message.toUtf8()),
    onError: err => console.error('Error:', err),
    onClose: () => console.log('Subscription closed'),
  }
)

// To stop listening:
// subscription.cancel()
```

Share the **public key** and **overlay address** with writer nodes.

### Writer node — send messages

> **Note:** The writer uses port 1643, assuming a separate Bee node. If testing on a single machine, start a second node with `--api-addr 127.0.0.1:1643 --p2p-addr :1644 --data-dir ~/.bee2`. For single-node testing, use `http://localhost:1633` instead.

```javascript
import { Bee, NULL_IDENTIFIER } from '@ethersphere/bee-js'

const bee = new Bee('http://localhost:1643')
const TARGET_OVERLAY = '<SERVICE_NODE_OVERLAY>'

// Mine the same GSOC key using the service node's overlay
const privateKey = bee.gsocMine(TARGET_OVERLAY, NULL_IDENTIFIER, 12)

// Send a message
const message = JSON.stringify({ name: 'Alice', body: 'Hello!' })
await bee.gsocSend(batchId, privateKey, NULL_IDENTIFIER, message)
```

**Important:** Use **mutable** postage stamps for GSOC. Immutable stamps fill up after just a few messages because each update uses the same batch bucket slot.

### GSOC key methods

| Method | Purpose |
|--------|---------|
| `bee.gsocMine(overlay, identifier, proximity)` | Mine a private key for a target overlay |
| `bee.gsocSend(batchId, signer, identifier, data)` | Send a message |
| `bee.gsocSubscribe(address, identifier, handler)` | Listen for messages (returns subscription with `.cancel()`) |

## PSS (Postal Service on Swarm)

Point-to-point messaging. Messages are disguised as normal Swarm chunks — they arrive even if the recipient was offline when sent.

### Subscribe to messages

```javascript
import { Bee, Topic } from '@ethersphere/bee-js'

const bee = new Bee('http://localhost:1633')
const topic = Topic.fromString('my-topic')

// Continuous subscription.
// In bee-js 12.x all three handlers are required — omitting onClose throws
// "Expected function for onClose, got: undefined".
bee.pssSubscribe(topic, {
  onMessage: msg => console.log('Received:', msg.toUtf8()),
  onError: err => console.error('Error:', err.message),
  onClose: () => console.log('Subscription closed'),
})
```

### One-time receive (with timeout)

```javascript
// Wait up to 3 hours for a single message
const message = await bee.pssReceive(topic, 1000 * 60 * 60 * 3)
console.log('Received:', message.toUtf8())
```

### Send a message

> **Note:** Uses port 1643 (separate sender node). See GSOC writer note above for single-machine setup.

```javascript
import { Bee, Topic, Utils } from '@ethersphere/bee-js'

const bee = new Bee('http://localhost:1643')
const topic = Topic.fromString('my-topic')
const recipientOverlay = '<RECIPIENT_OVERLAY_ADDRESS>'
const target = Utils.makeMaxTarget(recipientOverlay)

// Unencrypted
await bee.pssSend(batchId, topic, target, 'Hello from light node!')

// Encrypted (with recipient's PSS public key)
const recipientPssPublicKey = '<RECIPIENT_PSS_PUBLIC_KEY>'
await bee.pssSend(batchId, topic, target, 'Secret message', recipientPssPublicKey)
```

### Get recipient info

The sender needs the recipient's overlay address (and optionally PSS public key for encryption):

```javascript
const addresses = await bee.getNodeAddresses()
console.log('Overlay:', addresses.overlay.toHex())
console.log('PSS Public Key:', addresses.pssPublicKey.toCompressedHex())
```

### PSS methods

| Method | Purpose |
|--------|---------|
| `bee.pssSend(batchId, topic, target, data, publicKey?)` | Send a message (optionally encrypted) |
| `bee.pssSubscribe(topic, handler)` | Subscribe to incoming messages |
| `bee.pssReceive(topic, timeout)` | Wait for one message |
| `Utils.makeMaxTarget(overlay)` | Create target prefix from overlay address |

## If Something Goes Wrong

| Error | Fix |
|-------|-----|
| "stamp not usable" | Wait 2-3 minutes after buying |
| GSOC fills up fast | Must use **mutable** stamps (`immutable: false`) |
| PSS messages not arriving | Receiving node must be a **full node** |
| No messages received | Check overlay address and topic match between sender/receiver |
| Other errors | Route to `/swarm-troubleshoot` |

## Conceptual Questions

For any conceptual or technical question not covered by the steps above, invoke `/swarm-docs` to find the relevant authoritative source rather than answering from prior knowledge.

## Reference

- GSOC docs: https://docs.ethswarm.org/docs/develop/tools-and-features/gsoc
- GSOC bee-js: https://bee-js.ethswarm.org/docs/gsoc/
- PSS docs: https://docs.ethswarm.org/docs/develop/tools-and-features/pss
- PSS bee-js: https://bee-js.ethswarm.org/docs/pss/

