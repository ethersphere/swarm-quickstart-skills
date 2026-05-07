---
name: setup-bee
description: Install and run a Bee light node for Swarm development
user-invocable: true
---

# Set Up a Bee Node for Development

Guide a developer through getting a Bee light node running so they can build on Swarm.

## Before Starting (run immediately)

**Run these checks now — do not just show the commands to the user:**

1. Detect platform:
   ```bash
   uname -s
   ```
   - **Linux:** Use the install script directly
   - **Darwin (macOS):** Use the install script (or Homebrew if available)
   - **Other / Windows:** Advise WSL2 first, then the Linux install path

2. Fetch the latest Bee version tag:
   ```bash
   curl -s https://api.github.com/repos/ethersphere/bee/releases/latest | jq -r .tag_name
   ```

Use this tag in the install command below (replace TAG value).

## Node Modes

| Mode | Can download | Can upload | Needs funding | Use case |
|------|-------------|-----------|---------------|----------|
| Ultra-light | Yes | No | No | Exploring the API, downloading data |
| Light | Yes | Yes | Yes (~0.01 xDAI + ~0.2 xBZZ) | Development, uploads, feeds |
| Full | Yes | Yes | Yes + staking | Running infrastructure, PSS subscribe |

## Requirements

- Linux or macOS (Windows: use WSL2)
- Node.js v18+ and npm
- curl or wget
- ~0.01 xDAI + ~0.2 xBZZ on Gnosis Chain (for upgrading to light node)

## Step 1: Install Bee

```bash
curl -s https://raw.githubusercontent.com/ethersphere/bee/master/install.sh | TAG=<LATEST_TAG> sudo bash
```

Or with wget:

```bash
wget -q -O - https://raw.githubusercontent.com/ethersphere/bee/master/install.sh | TAG=<LATEST_TAG> sudo bash
```

Verify: `bee version`

Install swarm-cli:

```bash
npm install -g @ethersphere/swarm-cli
```

## Step 2: Start in Ultra-Light Mode

No funding needed — lets you explore the API and download data immediately.

```bash
bee start \
  --password YOUR_SECURE_PASSWORD \
  --api-addr 127.0.0.1:1633
```

Verify it's running (the node may return 503 for 10–30 seconds while initializing — this is normal, wait a moment and retry):

```bash
swarm-cli status
```

## Step 3: Fund Your Node

Get your wallet address:

```bash
swarm-cli addresses
```

Send tokens to this address on **Gnosis Chain** (not Ethereum mainnet):
- **xDAI** — gas for transactions on Gnosis Chain (~0.01 needed)
- **xBZZ** — payment for storage on Swarm (~0.2+ needed, scales with usage)

### Funding options

**Option A — Redeem a gift code (fastest)**

If the developer has a gift code (a private key from Swarm), redeem it directly to the Bee wallet:

```bash
swarm-cli utility redeem <GIFT_CODE_PRIVATE_KEY>
```

This transfers xBZZ and xDAI from the gift wallet to the Bee node wallet automatically. The node's wallet address is detected from the running Bee node.

To redeem to a specific wallet instead:

```bash
swarm-cli utility redeem <GIFT_CODE_PRIVATE_KEY> --target <WALLET_ADDRESS>
```

**Option B — Multichain top-up (any chain/token, no bridging)**

→ https://fund.ethswarm.org

**Option C — Manual**

xDAI from Gnosis faucets (https://docs.gnosischain.com/tools/Faucets) or bridge (https://bridge.gnosischain.com/). xBZZ from exchanges (https://www.ethswarm.org/get-bzz).

## Step 4: Upgrade to Light Node

Stop the ultra-light node (Ctrl+C), then restart with swap enabled:

```bash
bee start \
  --password YOUR_SECURE_PASSWORD \
  --swap-enable \
  --api-addr 127.0.0.1:1633 \
  --blockchain-rpc-endpoint https://xdai.fairdatasociety.org
```

The node deploys a chequebook and syncs chain data (~5 minutes). Monitor:

```bash
swarm-cli status
```

When the Δ (blocks behind) in Chainsync drops to less than ~10, your node is ready.

## Step 5: Buy a Postage Stamp

Required before any upload.

```bash
swarm-cli stamp create
```

Enter capacity (e.g. `500MB`, `1GB`) and TTL (e.g. `1w`, `1month`, `1y`). The command shows the cost in xBZZ and asks for confirmation before purchasing. Save the **Stamp ID** returned.

For detailed sizing and management options, see `/stamps`.

### Manage stamps later

```bash
swarm-cli stamp list
swarm-cli stamp show <stamp-id>
swarm-cli stamp topup --stamp <stamp-id> --amount <amount>
```

## Step 6: Test It

```bash
# Upload
swarm-cli upload --stdin --stamp <BATCH_ID> --name hello.txt <<< "Hello Swarm"

# Download
swarm-cli download <SWARM_HASH>
# File saved to <SWARM_HASH>/hello.txt
cat <SWARM_HASH>/hello.txt
```

If `Hello Swarm` is printed, the node is fully operational.

## Security

Always bind API to localhost (`127.0.0.1:1633`). Never expose port 1633 to the public internet.

## Reference

- Quick start: https://docs.ethswarm.org/docs/bee/installation/quick-start
- Fund your node: https://docs.ethswarm.org/docs/bee/installation/fund-your-node
- Configuration: `bee start --help`
- Bee API: https://docs.ethswarm.org/api/
- swarm-cli: https://github.com/ethersphere/swarm-cli
