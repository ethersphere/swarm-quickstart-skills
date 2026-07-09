---
name: swarm-setup-bee
description: Install and run a Bee light node for Swarm development on Linux/macOS — system prerequisites (Node.js, curl), Bee and swarm-cli install, funding the node (gift code or xDAI/xBZZ on Gnosis Chain), upgrading ultra-light to light, and buying a first postage stamp. Use when the user has no node, gets connection-refused on localhost:1633, or needs to start or fund Bee.
user-invocable: true
---

# Set Up a Bee Node for Development

Guide a developer through getting a Bee light node running so they can build on Swarm.

## Before Starting (run immediately)

Run these checks now and **narrate each one in a short line** — say what you're checking, run it (don't paste the command), then report the result. Don't pause for confirmation; these are read-only checks.

1. **Say "Detecting your platform…"**, then run:
   ```bash
   uname -s
   ```
   - **Linux:** Use the install script directly
   - **Darwin (macOS):** Use the install script (or Homebrew if available)
   - **Other / Windows:** Advise WSL2 first, then the Linux install path

2. **Say "Fetching the latest Bee version…"**, then run:
   ```bash
   curl -s https://api.github.com/repos/ethersphere/bee/releases/latest | jq -r .tag_name
   ```
   Report it in one line (e.g. "✓ Latest is v2.8.0.") and use this tag in the install command below (replace TAG value).

## Node Modes

| Mode | Can download | Can upload | Needs funding | Use case |
|------|-------------|-----------|---------------|----------|
| Ultra-light | Yes | No | No | Exploring the API, downloading data |
| Light | Yes | Yes | Yes (~0.01 xDAI + ~0.2 xBZZ) | Development, uploads, feeds |
| Full | Yes | Yes | Yes + staking | Running infrastructure, PSS subscribe |

## Prerequisites

### curl or wget (required for the Bee install script)

**Ubuntu/Debian:**
```bash
sudo apt-get update && sudo apt-get install -y curl
```

**macOS:** Pre-installed. If missing: `brew install curl`

### Node.js v18+ and npm

**Ubuntu/Debian — via NodeSource (recommended, gets Node 20):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Ubuntu 24.04 — via apt (gets Node 18 from Ubuntu repos):**
```bash
sudo apt-get update && sudo apt-get install -y nodejs npm
```

**macOS — via Homebrew:**
```bash
brew install node
```

**Linux/macOS — via nvm:**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc   # or ~/.zshrc on macOS
nvm install --lts
```

**Windows:** Install WSL2 first (`wsl --install` in PowerShell as Administrator, then restart), then follow the Linux path inside WSL2.

Verify: `node --version && npm --version` — Node.js should be v18 or higher.

### Gnosis Chain tokens (for light node only)

~0.01 xDAI + ~0.2 xBZZ — not needed for ultra-light mode.

## Step 1: Install Bee

```bash
curl -s https://raw.githubusercontent.com/ethersphere/bee/master/install.sh | TAG=<LATEST_TAG> sudo bash
```

Or with wget:

```bash
wget -q -O - https://raw.githubusercontent.com/ethersphere/bee/master/install.sh | TAG=<LATEST_TAG> sudo bash
```

Verify: `bee version`

Install swarm-cli (v3.x, which bundles bee-js 12.x):

```bash
npm install -g @ethersphere/swarm-cli
```

> **Version note:** Run the latest Bee — **2.8.x**. 2.8 was a breaking change, so **do not run 2.7.x**. This guide targets Bee **2.8.0**, swarm-cli **3.x**, and bee-js **12.x**. As of bee-js **12.3.1** the tested-version constant (`SUPPORTED_BEE_VERSION`) is **2.8.1**, so `bee.isSupportedExactVersion()` returns `true` against a matching 2.8.x node and **no** version warning is printed. (Earlier 12.x releases lagged at **2.7.0** and warned cosmetically against 2.8 nodes — that's no longer the case.)

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
swarm-cli utility redeem <GIFT_CODE_PRIVATE_KEY> --json-rpc-url https://xdai.fairdatasociety.org
```

This transfers xBZZ and xDAI from the gift wallet to the Bee node wallet automatically. The node's wallet address is detected from the running Bee node. If the command fails with a 429 error, try `--json-rpc-url https://rpc.gnosischain.com` instead.

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

`xdai.fairdatasociety.org` is the Ethersphere-maintained endpoint and is archival — required for Bee to sync historical stamp batch data on first start. If it returns 429 (rate limited), try `https://rpc.gnosischain.com` or `https://gnosis-rpc.publicnode.com` as short-term fallbacks, but note these are not archival nodes and may produce an incomplete stamp batch list on first sync. For production use, a dedicated archival RPC from Ankr, QuickNode, or Alchemy is recommended.

The node deploys a chequebook and syncs chain data (~5 minutes). Monitor:

```bash
swarm-cli status
```

When the Δ (blocks behind) in Chainsync drops to less than ~10, your node is ready.

## Step 5: Buy a Postage Stamp

Required before any upload. **Depth** sets capacity, **amount** sets duration.

> **Budget check first.** Cost in xBZZ ≈ `amount × 2^depth ÷ 10^16`. A depth-22, 3-month stamp costs **~4.2 xBZZ** — but a standard gift code only provides **~0.5 xBZZ**, so a `--depth 22` buy fails with "You do not have enough BZZ". With a single gift code you can realistically only afford a small (depth-17, ~40 KB) stamp. Buy what your balance covers, or fund more xBZZ first (see Step 3).

### Compute the amount from the live price

The amount-per-day depends on the current network storage price, so don't hardcode it — read it live:

```bash
PRICE=$(curl -s http://localhost:1633/chainstate | jq .currentPrice)
# amount = currentPrice * 17280 (blocks/day) * desired_days
echo $((PRICE * 17280 * 30))   # ≈ amount for 30 days
```

### Budget-friendly stamp (fits a ~0.5 xBZZ gift code)

```bash
swarm-cli stamp buy --depth 17 --amount 9345732487    # ~40 KB, ~1 week, ~0.12 xBZZ
```

Or via API:

```bash
curl -X POST http://localhost:1633/stamps/9345732487/17
```

Save the **Stamp ID** returned.

### Stamp sizing

These are **effective (realistic) capacities** — not theoretical maximums (verify with `Utils.getStampEffectiveBytes(depth)` in bee-js 12.x):

| Depth | Effective capacity | | Duration | Amount (approx, varies with price) |
|-------|-------------------|-|----------|--------|
| 17 | ~40 KB | | 1 week | ~9,345,732,487 |
| 18 | ~6 MB | | 1 month | ~40,053,139,205 |
| 19 | ~110 MB | | 3 months | ~120,159,417,615 |
| 20 | ~680 MB | | 6 months | ~240,318,835,230 |
| 21 | ~2.6 GB | | 1 year | ~480,637,670,460 |
| 22 | ~7.7 GB | | | |

The amounts above are upper-bound estimates from a higher historical price and can overpay by ~40%. Always compute from the live `currentPrice` (above). For the full sizing/cost guide, see `/swarm-stamps`.

### Manage stamps later

```bash
swarm-cli stamp list
swarm-cli stamp show <stamp-id>
swarm-cli stamp topup --stamp <stamp-id> --amount <amount>
```

## Step 6: Test It

```bash
# Upload
echo "Hello Swarm" | swarm-cli upload --stdin --stamp <BATCH_ID> --name hello.txt

# Download
swarm-cli download <SWARM_HASH>
# File saved to <SWARM_HASH>/hello.txt
cat <SWARM_HASH>/hello.txt
```

```powershell
# Upload (PowerShell)
"Hello Swarm" | swarm-cli upload --stdin --stamp <BATCH_ID> --name hello.txt

# Download verification (PowerShell)
Get-Content <SWARM_HASH>/hello.txt
```

If `Hello Swarm` is printed, the node is fully operational.

## What's Next

Your node is running, funded, and you've bought a stamp and verified an upload. From here:

- **Store files or data** → `/swarm-upload-download`
- **Start coding against Swarm** → `/swarm-build-app`

Then build out:

- **Host a website** → `/swarm-host-website`
- **Updateable content at a fixed URL** → `/swarm-feed`
- **A blog with a permanent URL** → `/swarm-blog`
- **Encrypt data with access control** → `/swarm-act`
- **Real-time messaging** → `/swarm-messaging`

Manage stamps anytime with `/swarm-stamps`, or run `/swarm-troubleshoot` if something breaks. Run `/swarm` to see the full skill list.

## Security

Always bind API to localhost (`127.0.0.1:1633`). Never expose port 1633 to the public internet.

## Conceptual Questions

For any conceptual or technical question not covered by the steps above, invoke `/swarm-docs` to find the relevant authoritative source rather than answering from prior knowledge.

## Reference

- Quick start: https://docs.ethswarm.org/docs/bee/installation/quick-start
- Fund your node: https://docs.ethswarm.org/docs/bee/installation/fund-your-node
- Configuration: `bee start --help`
- Bee API: https://docs.ethswarm.org/api/
- swarm-cli: https://github.com/ethersphere/swarm-cli

