---
name: swarm-troubleshoot
description: Diagnose and fix common Bee node, connectivity, sync, funding, stamp, and upload/download problems — an ordered triage from 'is the node running?' through peers, chain sync, wallet balance, stamp validity, and Bee API error codes (400/404/422/500/503). Use when something on Swarm is failing, erroring out, or won't connect.
user-invocable: true
---

# Troubleshoot Bee Node

Guide a developer through diagnosing and fixing common Bee node issues. **Run these checks in order** — each step depends on the previous one passing. Stop at the first failure, fix it, then continue.

## Formatting

When presenting to the user, use consistent labels before each code block:
- **Run in your terminal:** — a command the user should execute
- **Expected output:** — example of what a successful result looks like
- **Save as `filename`:** — file contents the user should write to disk

Add a `---` horizontal rule before each labeled code block to visually separate it from surrounding text.

---

## Triage Tree

```
(1) Is the bee process running?
    └─ No → start bee / check port conflict
    └─ Yes ↓
(2) Is the API reachable at localhost:1633?
    └─ No → check firewall / port binding
    └─ Yes ↓
(3) Does the node have peers / is it synced?
    └─ No → wait / check RPC endpoint
    └─ Yes ↓
(4) Is the wallet funded?
    └─ No → route to /swarm-setup-bee-interactive funding
    └─ Yes ↓
(5) Does a valid, non-expired stamp exist?
    └─ No → route to /swarm-stamps
    └─ Yes ↓
(6) Is the upload/download itself failing?
    └─ Yes → check error code table below
    └─ No → problem is elsewhere
```

## Step 1: Is the node running?

```bash
swarm-cli status
```

If swarm-cli isn't installed, run `/swarm` first — it will detect what's missing and route to the right setup skill.

If this fails or returns a connection error, the node isn't running or the API port is wrong.

**Fixes:**
- Start the node: `bee start --password YOUR_PASSWORD --api-addr 127.0.0.1:1633`
- Check if another process uses port 1633:
  - Linux/macOS: `lsof -i :1633`
  - Windows (PowerShell): `Get-NetTCPConnection -LocalPort 1633 -ErrorAction SilentlyContinue`
- Check Bee logs for startup errors

## Step 2: Is the node connected to peers?

```bash
swarm-cli status
```

If connected peers = 0:
- Node may still be initializing — wait a few minutes
- Check internet connectivity
- Check firewall isn't blocking port 1634 (p2p port)
- See connectivity section below

## Step 3: Is the chain synced?

```bash
swarm-cli status
```

Watch the "Chainsync" section. It shows current vs. latest block and a gap, e.g. `Block: 45,299,125 / 45,299,131 (Δ 6)` — it never prints "synchronized". A small gap (roughly **Δ < 10**) means the node is caught up; a large/growing gap means it's still syncing (~5 minutes typical) or stuck.

If chain sync is stuck:
- Check the RPC endpoint is reachable: `curl -s https://xdai.fairdatasociety.org`
- If it returns 429 (rate limited): restart Bee with `--blockchain-rpc-endpoint https://rpc.gnosischain.com` as a short-term fallback
- Note: `rpc.gnosischain.com` and `gnosis-rpc.publicnode.com` are not archival nodes — they may cause an incomplete stamp batch list on first sync. If your stamp list looks empty after syncing, switch back to `xdai.fairdatasociety.org` or use a dedicated archival RPC provider (Ankr, QuickNode, Alchemy)
- For production: use a dedicated archival Gnosis Chain RPC endpoint

## Step 4: Is the wallet funded?

```bash
swarm-cli addresses
```

Check balances:

```bash
swarm-cli status
```

If xDAI or xBZZ is zero, fund the wallet — see `/swarm-setup-bee-interactive` for funding options.

**Note:** If the node was left unfunded too long after first start, it may have shut itself down. Fund and restart.

## Step 5: Are stamps usable?

```bash
swarm-cli stamp list
```

Common stamp issues:
- **No stamps** → buy one: see `/swarm-stamps`
- **Usable: No** → stamp is still propagating (wait a few minutes after purchase) or has expired
- **TTL: 0** or expired TTL → stamp expired, buy a new one
- **Stamp full** (immutable) → buy a new one or dilute: `swarm-cli stamp dilute --depth <new-depth> --stamp <id>`

## Step 6: Upload failing?

**"stamp not usable"** → stamp hasn't propagated yet. Wait 2-3 minutes after buying.

**"insufficient funds"** → wallet needs more xBZZ. Fund via `/swarm-setup-bee-interactive`.

**Ultra-light node** → can't upload. Upgrade to light node (restart with `--swap-enable` and `--blockchain-rpc-endpoint`).

**"act: invalid history"** → wrong history address for ACT upload. Double-check the history reference.

## Step 7: Download failing?

**"not found"** → content may have expired (stamp TTL ran out), reference is wrong, or content was uploaded with ACT and you're missing the ACT flags.

**Check retrievability:**

```javascript
import { Bee } from '@ethersphere/bee-js'
const bee = new Bee('http://localhost:1633')
const isRetrievable = await bee.isReferenceRetrievable(reference)
console.log('Retrievable:', isRetrievable)
```

## Connectivity Issues

If the node has zero or few peers, check network connectivity.

### Check your public IP

```bash
curl icanhazip.com --ipv4
```

### Test p2p port (1634) reachability

```bash
nc -zv <YOUR_PUBLIC_IP> 1634
```

Windows (PowerShell) alternative:

```powershell
Test-NetConnection -ComputerName <YOUR_PUBLIC_IP> -Port 1634
```

### Common fixes

| Problem | Fix |
|---------|-----|
| Behind NAT/router | Set up port forwarding: public 1634 → local IP:1634. Start with `--nat-addr <PUBLIC_IP>:1634` |
| Firewall blocking | Allow TCP+UDP on port 1634 |
| Docker | Ensure port 1634 is mapped (`-p 1634:1634`) |
| Only outgoing works | Bee can function with outgoing only, but performance is reduced |

### Test connectivity step by step

```bash
# 1. Localhost
nc -zv 127.0.0.1 1634

# 2. Local network (your private IP)
nc -zv 192.168.x.x 1634

# 3. Public IP
nc -zv <PUBLIC_IP> 1634
```

Windows (PowerShell) alternatives:

```powershell
# 1. Localhost
Test-NetConnection -ComputerName 127.0.0.1 -Port 1634

# 2. Local network
Test-NetConnection -ComputerName 192.168.x.x -Port 1634

# 3. Public IP
Test-NetConnection -ComputerName <PUBLIC_IP> -Port 1634
```

If step 1 fails → OS firewall or port conflict.
If step 2 fails → machine firewall.
If step 3 fails → router/ISP firewall or port forwarding missing.

## Quick Health Check (all at once)

```bash
swarm-cli status
swarm-cli addresses
swarm-cli stamp list
```

## Common Bee API Error Codes

| Code | Meaning | Fix |
|------|---------|-----|
| 400 | Bad request — malformed input or missing required header (e.g. `"invalid header params: want required"` when stamp header is absent or malformed) | Check request format and ensure `Swarm-Postage-Batch-Id` header is present and correctly formatted |
| 404 | Content not found OR stamp batch not found (`"batch with id not found"`) | Content may have expired, reference is wrong, stamp ID is invalid, or ACT flags missing |
| 422 | Unprocessable entity | Check parameter types (e.g., batch ID format) |
| 500 | Internal server error | Check Bee logs, restart node |
| 503 | Node not ready (still syncing) | Wait for chain sync to complete (up to ~30s right after start) |

> **Note:** A missing/insufficient stamp does **not** return 402 in current Bee — a missing stamp header returns **400** and an invalid stamp ID returns **404**. Treat stamp problems as 400/404.

## Security Reminder

- API port (1633) should **never** be exposed to the public internet — always bind to `127.0.0.1`
- Only the p2p port (1634) should be publicly accessible

## Conceptual Questions

For any conceptual or technical question not covered by the steps above, invoke `/swarm-docs` to find the relevant authoritative source rather than answering from prior knowledge.

## Reference

- Connectivity guide: https://docs.ethswarm.org/docs/bee/installation/connectivity
- Bee API: https://docs.ethswarm.org/api/
- swarm-cli: https://github.com/ethersphere/swarm-cli
- Discord support: https://discord.gg/hyCr9BMX9U

