---
name: setup-bee-interactive
description: Interactive Bee setup that detects progress, runs one step at a time with verification, and completes funding, stamps, and upload checks.
user-invocable: true
---

# Set Up a Bee Node for Development

Guide a developer through getting a Bee light node running so they can build on Swarm. **Work through this interactively, one step at a time. Show each command, ask the user to run it, wait for them to paste the output, verify it, and only then proceed. Never show the next step until the current one is confirmed.**

## Formatting

When presenting to the user, use consistent labels before each code block:
- **Run in your terminal:** — a command the user should execute
- **Expected output:** — example of what a successful result looks like
- **Save as `filename`:** — file contents the user should write to disk

Add a `---` horizontal rule before each labeled code block to visually separate it from surrounding text.

---

## Before Starting (run immediately, silently)

Run all of these checks before showing anything to the user. Use the results to detect how far the user has already progressed and jump directly to the first incomplete step. Do not start from Step 1 if later steps are already done.

1. Detect platform:
   ```bash
   uname -s
   ```
   - **Linux:** Use the install script directly
   - **Darwin (macOS):** Use the install script (or Homebrew if available)
   - **Other / Windows:** Advise WSL2 first, then the Linux install path inside WSL2

2. Fetch the latest Bee version tag:
   ```bash
   curl -s https://api.github.com/repos/ethersphere/bee/releases/latest | jq -r .tag_name
   ```

3. Run all step-detection checks in order. Start the user at the **first step that fails**:

   | Step | Detection check | Pass condition |
   |------|----------------|----------------|
   | 0 — curl | `curl --version` | Any version output |
   | 1 — Node.js + npm | `node --version && npm --version` | Node.js ≥ v18, npm present |
   | 2 — swarm-cli | `swarm-cli --version` | Any version output |
   | 3 — Bee installed | `bee version` | Any version output |
   | 4 — Node running | `swarm-cli status` | Returns mode and connectivity info |
   | 5 — Light/ultra-light? | Same response as above | `"light"` or `"full"` → skip to Step 9; `"ultralight"` → ask if they want to upgrade (Step 5) |
   | 6 — Wallet address | `swarm-cli addresses` | Returns a `0x...` Ethereum address |
   | 7 — Wallet funded | `swarm-cli status` | Wallet section shows non-zero xBZZ and xDAI (only in light mode — skip if still ultra-light) |
   | 8 — Chain synced | `swarm-cli status` | Chainsync shows synchronized |
   | 9 — Stamp exists | `swarm-cli stamp list` | At least one usable stamp |
   | 10 — Upload works | `echo "ping" | swarm-cli upload --stdin --stamp <any-usable-batchID>` | Returns a hash |

   If all checks pass → tell the user their node is fully operational. Suggest running `/menu` to see all available skills.

   If resuming mid-flow, tell the user: "It looks like you've already completed steps 1–N. Picking up from Step N+1."

Store the platform and latest tag for use in install commands. Do not show the user any of these checks.

---

## Node Modes (show this once at the start, or when resuming from Step 1)

| Mode | Can download | Can upload | Needs funding | Use case |
|------|-------------|-----------|---------------|----------|
| Ultra-light | Yes | No | No | Exploring the API, downloading data |
| Light | Yes | Yes | Yes (~0.01 xDAI + ~0.2 xBZZ) | Development, uploads, feeds |
| Full | Yes | Yes | Yes + staking | Running infrastructure, PSS subscribe |

Tell the user: "I'll walk you through each step one at a time. Run each command and paste the output here — I'll confirm it looks right before we move on."

---

## Step 0: Check curl

Ask the user to run:

```bash
curl --version
```

**Expected:** Any version output (e.g., `curl 7.x.x`).

- **Found:** Confirm and move to Step 1.
- **"command not found":** curl isn't installed. Show install instructions for their platform:

  **Ubuntu/Debian:**
  ```bash
  sudo apt-get update && sudo apt-get install -y curl
  ```

  **macOS:** curl is pre-installed — if missing, `brew install curl`.

  Re-ask `curl --version` before continuing.

---

## Step 1: Check Node.js and npm

Ask the user to run:

```bash
node --version && npm --version
```

**Expected:** Two lines — Node.js `v18.x.x` or higher, then any npm version (e.g., `10.x.x`).

- **Both found, Node.js v18+:** Confirm and move to Step 2.
- **Node.js v14–v17:** Tell them they need v18+. Show install instructions for their platform (see below), then re-ask for the same command before continuing.
- **"command not found" for node or npm:** Tell them Node.js isn't installed (npm comes bundled with it). Show install instructions, then re-ask before continuing.

### Node.js install instructions by platform

**Linux (via nvm — recommended):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
```

**macOS (via Homebrew):**
```bash
brew install node
```

**macOS (via nvm):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.zshrc
nvm install --lts
```

**Windows:** Advise WSL2 first (`wsl --install` in PowerShell as Administrator, then restart). Then use the Linux/nvm path inside WSL2.

After install, ask for `node --version && npm --version` again. Confirm both before proceeding.

---

## Step 2: Install swarm-cli

Tell the user: "Next, install swarm-cli — the command-line tool for Swarm."

Ask them to run:

```bash
npm install -g @ethersphere/swarm-cli
```

Then verify:

```bash
swarm-cli --version
```

**Expected output (example):**

```
added 169 packages in 24s
...
2.35.0
```

Deprecation warnings (uuid, punycode) are normal — ignore them. The version number on the last line is what matters.

- Confirmed → move to Step 3.
- "command not found" → npm global bin may not be on PATH. Show fix:
  ```bash
  export PATH="$(npm root -g)/../bin:$PATH"
  ```
  Then re-ask for `swarm-cli --version` before continuing.

---

## Step 3: Install Bee

Tell the user: "Now let's install the Bee node itself."

Show the install command with the actual latest tag (from your pre-flight check):

```bash
curl -s https://raw.githubusercontent.com/ethersphere/bee/master/install.sh | TAG=<LATEST_TAG> sudo bash
```

Or with wget if curl is unavailable:

```bash
wget -q -O - https://raw.githubusercontent.com/ethersphere/bee/master/install.sh | TAG=<LATEST_TAG> sudo bash
```

Ask the user to paste the output, then ask them to verify:

```bash
bee version
```

**Expected:** A version string matching the tag you used (e.g., `2.7.1`).

- Confirmed → move to Step 4.
- "command not found" → the installer may have put `bee` in `~/.local/bin` or `/usr/local/bin`. Show fix:
  ```bash
  export PATH="$HOME/.local/bin:$PATH"
  ```
  Then re-ask for `bee version`.

---

## Step 4: Start Bee in Ultra-Light Mode

Tell the user: "Start the node in ultra-light mode first — no funding needed. You can explore the API and download data immediately."

Tell the user: "Choose a strong, unique password for your Bee node. Before running this command, save it somewhere secure — a 2FA-protected password manager (e.g., Bitwarden, 1Password) or written down and stored offline. If you lose this password, you lose access to your node's wallet."

Ask them to run:

```bash
bee start \
  --password YOUR_SECURE_PASSWORD \
  --api-addr 127.0.0.1:1633
```

Then ask them to verify in a new terminal tab (the node may return 503 for 10–30 seconds while initializing — this is normal, wait a moment and retry):

```bash
swarm-cli status
```

**Expected:** Mode shows `ultralight`.

- Confirmed → move to Step 6.
- Connection refused → node didn't start. Ask them to paste any error output from the bee start terminal. Common issues:
  - Port 1633 in use: suggest `--api-addr 127.0.0.1:1634`
  - Wrong password format: must be a plain string, not empty

---

## Step 5: Ask — Light Node or Ultra-Light?

Ask: "Would you like to upgrade to a **light node** so you can upload data and use stamps? This requires funding (~0.01 xDAI + ~0.2 xBZZ on Gnosis Chain). Or do you want to stay on ultra-light for now?"

Tell the user: "Note — a light node is required to follow any of the skills that guide you through building a project on Swarm (such as `/upload-download`, `/host-website`, `/feed`, `/blog`, `/act`, and `/messaging`). Ultra-light is fine for downloading data and exploring the API, but you won't be able to upload anything or buy stamps."

- **Stay ultra-light:** Tell them they're all set for downloading and API exploration. Let them know they can run `/setup-bee-interactive` again to upgrade later.
- **Upgrade to light:** Continue to Step 6.

---

## Step 6: Get Wallet Address

Ask them to run:

```bash
swarm-cli addresses
```

**Expected:** An `Ethereum: 0x...` address in the output.

Confirm the address and tell them: "This is your Bee node's wallet on Gnosis Chain. You'll send xDAI and xBZZ to this address."

Move to Step 7.

---

## Step 7: Fund the Node

Tell them the address they need to fund and ask which funding option they prefer:

**Important:** The wallet balance endpoint (`/wallet`) only becomes available after the node is restarted in light mode (Step 8). Do not attempt to verify the balance here — just confirm the on-chain transactions completed before continuing.

**Option A — Redeem a gift code (fastest)**
If they have a gift code private key from Swarm:
```bash
swarm-cli utility redeem <GIFT_CODE_PRIVATE_KEY> --json-rpc-url https://xdai.fairdatasociety.org
```
This auto-detects the Bee wallet and transfers xBZZ + xDAI automatically. If the command fails with a 429 error, try `--json-rpc-url https://rpc.gnosischain.com` instead.

**Option B — Multichain top-up (any chain/token, no bridging)**
→ https://fund.ethswarm.org — paste the wallet address and send from any chain. No bridging needed.

**Option C — Manual**

Send both xDAI and xBZZ to the same wallet address on **Gnosis Chain**:

- xDAI (~0.01): buy DAI on an exchange (e.g. [Binance](https://www.binance.com), [Coinbase](https://www.coinbase.com)) and withdraw directly to Gnosis Chain, or use a [Gnosis faucet](https://docs.gnosischain.com/tools/Faucets) (small free amount), or [bridge from Ethereum mainnet](https://bridge.gnosischain.com/)
- xBZZ (~0.2): buy BZZ on an exchange (e.g. [Binance](https://www.binance.com)) and withdraw to Gnosis Chain — see [full exchanges list](https://www.ethswarm.org/get-bzz)

Once the user confirms their transactions are complete on-chain, tell them: "Stop your Bee node now (Ctrl+C in the bee terminal) — we'll restart it in light mode in the next step once funding is confirmed."

Move to Step 8.

---

## Step 8: Upgrade to Light Node

Tell them: "Stop the ultra-light node (Ctrl+C in the bee terminal), then restart with swap enabled."

```bash
bee start \
  --password YOUR_SECURE_PASSWORD \
  --swap-enable \
  --api-addr 127.0.0.1:1633 \
  --blockchain-rpc-endpoint https://xdai.fairdatasociety.org
```

`xdai.fairdatasociety.org` is the Ethersphere-maintained endpoint and is archival — required for Bee to sync historical stamp batch data on first start. If it returns 429 (rate limited), try `https://rpc.gnosischain.com` or `https://gnosis-rpc.publicnode.com` as short-term fallbacks, but note these are not archival nodes and may produce an incomplete stamp batch list on first sync. For production use, a dedicated archival RPC from Ankr, QuickNode, or Alchemy is recommended.

The node will deploy a chequebook and sync chain data (~5 minutes). Ask them to run in a new tab:

```bash
swarm-cli status
```

**Expected:** Chainsync Δ (blocks behind) shows less than ~10, peers > 0.

Ask them to paste the output. If Δ is still high, tell them to wait a minute and re-check. Do not proceed until the node is caught up.

Once the node is caught up, verify the wallet balances are non-zero:

```bash
swarm-cli status
```

**Expected:** Wallet section shows non-zero xBZZ and xDAI values.

- Both non-zero → move to Step 9.
- Still zero → ask them to confirm the transactions went to the correct address on Gnosis Chain (not Ethereum mainnet). If the node just restarted, wait a minute for chain sync and retry.
- RPC error / can't connect to chain → try an alternative RPC endpoint:
  ```bash
  --blockchain-rpc-endpoint https://rpc.gnosischain.com
  ```
  Or: `https://gnosis-rpc.publicnode.com`

---

## Step 9: Buy a Postage Stamp

Tell them: "Before you can upload anything, you need a postage stamp. The interactive buyer will walk you through it."

Ask them to run:

```bash
swarm-cli stamp create
```

The command will prompt for:
1. **Capacity** — total data size (e.g. `500MB`, `1GB`)
2. **TTL** — how long the stamp should last (e.g. `1w`, `1month`, `1y`)

It then shows the cost in xBZZ and asks for confirmation before purchasing.

**Expected output (example):**
```
Capacity: 1.074 GB
TTL: 24 hours

Cost: 0.18 xBZZ
Available: 0.20 xBZZ
Type: Immutable
? Confirm the purchase (Y/n)
```

Ask them to paste the final output after confirming. Save the **Stamp ID** (batchID) from the result.

- Confirmed → move to Step 10.
- Insufficient funds → check balance: `swarm-cli status`. Fund via Step 7.
- Command hangs → node may not be fully synced yet. Wait for chainsync, then retry.

---

## Step 10: Test It

Tell them: "Let's do a quick upload and download to confirm everything is working."

```bash
echo "Hello Swarm" | swarm-cli upload --stdin --stamp <BATCH_ID> --name hello.txt
```

```powershell
"Hello Swarm" | swarm-cli upload --stdin --stamp <BATCH_ID> --name hello.txt
```

Ask them to paste the output. **Expected:** A Swarm hash reference.

Then download it back:

```bash
swarm-cli download <SWARM_HASH>
```

**Expected output (example):**
```
hello.txt OK
```

The file is saved into a directory named after the hash. Verify the contents:

```bash
cat <SWARM_HASH>/hello.txt
```

**Expected:** `Hello Swarm`

PowerShell alternative:

```powershell
Get-Content <SWARM_HASH>/hello.txt
```

- Both work → **Done!** Tell them their node is fully operational. Suggest running `/menu` to see all available skills and choose what to build next.
- "stamp not usable" → stamp is still propagating. Wait 2-3 minutes and retry.
- Other errors → route to `/troubleshoot`.

---

## Security

Always bind API to localhost (`127.0.0.1:1633`). Never expose port 1633 to the public internet.

## Reference

- Quick start: https://docs.ethswarm.org/docs/bee/installation/quick-start
- Fund your node: https://docs.ethswarm.org/docs/bee/installation/fund-your-node
- Configuration: `bee start --help`
- Bee API: https://docs.ethswarm.org/api/
- swarm-cli: https://github.com/ethersphere/swarm-cli

