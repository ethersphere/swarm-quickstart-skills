---
name: act
description: Encrypt data on Swarm with per-account access control (ACT)
user-invocable: true
---

# Access Control (ACT)

Guide a developer through encrypting data on Swarm and controlling who can read it. ACT (Access Control Trie) lets you define per-account read permissions using Ethereum public keys.

## Before Starting (run immediately)

**Run these checks now — do not just show the commands to the user:**

1. Node running?
   ```bash
   curl -s http://localhost:1633/status | jq .beeMode
   ```
   If this fails or returns no output → tell the user "Your Bee node isn't running." Ask: "Would you like me to walk you through installing and starting one?" If yes, run through the `/swarm-setup` flow now. If no, note that a running node is required and wait for their direction.

2. Stamp available?
   ```bash
   curl -s http://localhost:1633/stamps | jq '.stamps[] | select(.usable==true) | {batchID, depth, batchTTL}'
   ```
   If no usable stamps → route to `/stamps`

Present results briefly, then proceed.

## What to Ask

1. **What data are you protecting?** (files, website, app data)
2. **Who should have access?** (specific Ethereum public keys)
3. **swarm-cli or bee-js?**

## Prerequisites

- For swarm-cli: `npm install -g @ethersphere/swarm-cli`
- For bee-js: `npm install @ethersphere/bee-js`

## How ACT Works

- Data is uploaded encrypted — only authorized accounts can decrypt
- Access is controlled via a **grantee list** of Ethereum public keys
- The publisher manages the list: add or revoke access at any time
- Unauthorized download attempts return "not found" — the data is invisible without access
- The publisher always has access

## Via swarm-cli

### Upload with ACT

```bash
swarm-cli upload test.txt --act --stamp <BATCH_ID>
```

First upload — omit `--act-history-address` to create a new history. The response returns:
- Encrypted Swarm reference
- History reference

> **Warning:** Save the history reference securely. Losing it means **permanent, irrecoverable loss** of access to your encrypted data. There is no recovery mechanism.

For subsequent uploads to the same history:

```bash
swarm-cli upload test.txt --act --stamp <BATCH_ID> --act-history-address <HISTORY_REF>
```

### Download with ACT

```bash
swarm-cli download <SWARM_HASH> output.txt \
  --act \
  --act-history-address <HISTORY_REF> \
  --act-publisher <PUBLIC_KEY>
```

- `--act-publisher` — the uploader's public key (needed for decryption)
- `--act-timestamp` — optional, defaults to current time. Use to access a specific version.

**Without the ACT flags, the download will fail with "not found".**

### Create a grantee list

Create a JSON file with the public keys of accounts that should have access:

```json
{
  "grantees": [
    "03ec55e9fb2aefb8600f69142abaad79311516c232b28919d66efb4d41bce15bfa",
    "03fdcab22b455ce08a481d929a4cb9f447752545818eded1ad1785c51581e822c6"
  ]
}
```

```bash
swarm-cli grantee create grantees.json --stamp <BATCH_ID>
```

Returns a grantee reference and history reference — save both.

### Update access (add/revoke)

Create a patch JSON:

```json
{
  "add": ["03fdcab22b455ce08a481d929a4cb9f447752545818eded1ad1785c51581e822c6"],
  "revoke": ["03ec55e9fb2aefb8600f69142abaad79311516c232b28919d66efb4d41bce15bfa"]
}
```

```bash
swarm-cli grantee patch grantees-patch.json \
  --reference <GRANTEE_REF> \
  --history <GRANTEE_HISTORY_REF> \
  --stamp <BATCH_ID>
```

**Note:** Wait at least 1 second between grantee list updates — updating within the same second causes an error.

### View grantee list

```bash
swarm-cli grantee get <GRANTEE_REF>
```

## Via bee-js

### Upload with ACT

```javascript
import { Bee } from '@ethersphere/bee-js'

const bee = new Bee('http://localhost:1633')

// Upload a file with ACT encryption enabled
const result = await bee.uploadFile(batchId, 'Secret data', 'secret.txt', {
  act: true
})

console.log('Encrypted reference:', result.reference.toHex())
console.log('History address:', result.historyAddress.toHex())
// WARNING: Save both — losing the history address means permanent loss of access to encrypted data
```

### Download with ACT

```javascript
import { Bee } from '@ethersphere/bee-js'

const bee = new Bee('http://localhost:1633')

const file = await bee.downloadFile(reference, 'secret.txt', {
  actHistoryAddress: historyAddress,
  actPublisher: publisherPublicKey
})

console.log('Decrypted:', file.data.toUtf8())
// Without ACT parameters, this returns "not found"
```

### Manage grantees

```javascript
import { Bee } from '@ethersphere/bee-js'

const bee = new Bee('http://localhost:1633')

// Create grantee list
const granteeResult = await bee.createGrantees(batchId, [
  '03ec55e9fb2aefb8600f69142abaad79311516c232b28919d66efb4d41bce15bfa'
])
console.log('Grantee ref:', granteeResult)

// Get current grantees
const grantees = await bee.getGrantees(granteeReference)
console.log('Grantees:', grantees)

// Update access — add and revoke
await bee.patchGrantees(batchId, granteeReference, historyReference, {
  add: ['03fdcab22b455ce08a481d929a4cb9f447752545818eded1ad1785c51581e822c6'],
  revoke: ['03ec55e9fb2aefb8600f69142abaad79311516c232b28919d66efb4d41bce15bfa']
})
```

## Use Cases

- **Private file sharing** — share documents with specific accounts
- **Paid content** — grant access after payment
- **Subscriber-only access** — manage a grantee list for subscribers
- **Team collaboration** — restrict project data to team members

## Important Notes

- Grantees are identified by their **Ethereum public keys** (compressed, 33 bytes hex)
- Only the publisher (uploader) can manage the grantee list
- Revoking access prevents future decryption but doesn't delete already-downloaded data
- Invalid history addresses return "not found" errors
- Wait at least 1 second between grantee list updates

## If Something Goes Wrong

| Error | Fix |
|-------|-----|
| "not found" on download | Missing ACT flags, wrong history address, or access revoked |
| "act: invalid history" | Wrong history address — double-check reference |
| "stamp not usable" | Wait 2-3 minutes after buying |
| 1-second update error | Wait at least 1 second between grantee list updates |
| Other errors | Route to `/troubleshoot` |

## Reference

- ACT guide: https://docs.ethswarm.org/docs/develop/act
- ACT concepts: https://docs.ethswarm.org/docs/develop/access-the-swarm/access-control
- bee-js docs: https://bee-js.ethswarm.org/docs/
- swarm-cli: https://github.com/ethersphere/swarm-cli
