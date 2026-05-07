---
name: upload-download
description: Upload and download data, files, or directories on Swarm
user-invocable: true
---

# Upload and Download Data

Guide a developer through uploading and downloading data on Swarm. Requires a running Bee light node and a postage stamp.

## Formatting

When presenting to the user, use consistent labels before each code block:
- **Run in your terminal:** — a command the user should execute
- **Expected output:** — example of what a successful result looks like
- **Save as `filename`:** — file contents the user should write to disk

Add a `---` horizontal rule before each labeled code block to visually separate it from surrounding text.

---

## Before Starting (run immediately)

**Run these checks now — do not just show the commands to the user:**

1. Node running?
   ```bash
   curl -s http://localhost:1633/node
   ```
   If the request fails or returns no output → tell the user "Your Bee node isn't running." Ask: "Would you like me to walk you through installing and starting one?" If yes, run through the `/setup-bee-interactive` flow now. If no, note that a running node is required and wait for their direction.

2. Stamp available?
   ```bash
   swarm-cli stamp list
   ```
   If no usable stamps → route to `/stamps`

Present results briefly, then proceed.

## What to Ask

1. **What are you uploading?** (raw data/string, single file, multiple files, directory/website)
2. **Environment?** (Node.js or browser)
3. **bee-js or swarm-cli?**

## Prerequisites

- For bee-js: `npm install @ethersphere/bee-js`
- For swarm-cli: `npm install -g @ethersphere/swarm-cli`

## Upload a Single File

### Node.js

```javascript
import { Bee } from "@ethersphere/bee-js";
import { readFile } from "node:fs/promises";

const bee = new Bee("http://localhost:1633");

const data = await readFile("./hello.txt");
const { reference } = await bee.uploadFile(batchId, data, "hello.txt", {
  contentType: "text/plain",
});
console.log("Reference:", reference.toHex());
```

### Browser

```javascript
import { Bee } from "@ethersphere/bee-js";

const bee = new Bee("http://localhost:1633");

const file = new File(["Hello Swarm!"], "hello.txt", { type: "text/plain" });
const { reference } = await bee.uploadFile(batchId, file);
console.log("Reference:", reference.toHex());
```

### swarm-cli

```bash
swarm-cli upload ./hello.txt --stamp <BATCH_ID>
```

## Upload Multiple Files

### Browser

```javascript
import { Bee } from "@ethersphere/bee-js";

const bee = new Bee("http://localhost:1633");

const files = [
  new File(["<h1>Hello Swarm</h1>"], "index.html", { type: "text/html" }),
  new File(["body{font-family:sans-serif}"], "assets/main.css", { type: "text/css" }),
];

const res = await bee.uploadFiles(batchId, files);
console.log("Collection ref:", res.reference.toHex());
```

### Node.js (directory)

```javascript
import { Bee } from "@ethersphere/bee-js";

const bee = new Bee("http://localhost:1633");

const res = await bee.uploadFilesFromDirectory(batchId, "./my-files");
console.log("Collection reference:", res.reference.toHex());
```

### swarm-cli

```bash
swarm-cli upload ./my-files --stamp <BATCH_ID>
```

## Upload Raw Data

### bee-js

```javascript
const { reference } = await bee.uploadData(batchId, "Hello Swarm");
console.log("Reference:", reference.toHex());
```

### swarm-cli (stdin)

```bash
swarm-cli upload --stdin --stamp <BATCH_ID> <<< "Hello Swarm"
```

## Download

### bee-js — file

```javascript
const file = await bee.downloadFile(reference);
console.log(file.name);
console.log(file.contentType);
console.log(file.data.toUtf8());
```

### bee-js — file from collection (by path)

```javascript
const page = await bee.downloadFile(collectionReference, "index.html");
const style = await bee.downloadFile(collectionReference, "assets/main.css");
```

### bee-js — raw data

```javascript
const data = await bee.downloadData(reference);
console.log(data.toUtf8());
```

### swarm-cli

```bash
# Save to file in current directory (filename = reference hash)
swarm-cli download <REFERENCE>

# Print to stdout (single files only)
swarm-cli download <REFERENCE> --stdout
```

## API Endpoints Summary

| Action | Method | Endpoint |
|--------|--------|----------|
| Upload raw data | `POST` | `/bytes` |
| Download raw data | `GET` | `/bytes/{reference}` |
| Upload file/collection | `POST` | `/bzz` |
| Download file/collection | `GET` | `/bzz/{reference}` |

Headers for upload:
- `Swarm-Postage-Batch-Id` — required
- `Content-Type` — recommended

## If Something Goes Wrong

| Error | Fix |
|-------|-----|
| "stamp not usable" | Stamp hasn't propagated yet — wait 2-3 minutes after buying |
| "insufficient funds" | Wallet needs xBZZ — see `/setup-bee-interactive` funding section |
| Connection refused | Node isn't running — route to `/setup-bee-interactive` |
| 402 response | No usable stamp — route to `/stamps` |
| "not found" on download | Content may have expired, or reference is wrong |
| Other errors | Route to `/troubleshoot` |

## Reference

- Upload & download guide: https://docs.ethswarm.org/docs/develop/upload-and-download
- bee-js docs: https://bee-js.ethswarm.org/docs/
- Bee API: https://docs.ethswarm.org/api/
- swarm-cli: https://github.com/ethersphere/swarm-cli
