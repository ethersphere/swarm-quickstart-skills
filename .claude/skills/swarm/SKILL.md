---
name: swarm
description: Primary Swarm entry point — detects whether Bee is installed and running, routes to setup/troubleshoot if not, and otherwise shows the full skill menu and routes the developer to the right workflow (storage, website, app, access control, messaging). Use at the start of any Swarm task or when unsure where to begin.
user-invocable: true
---

# Swarm Entry Point

The starting point for building on Swarm. This skill detects whether Bee is installed and running, routes the user to setup or troubleshooting if needed, and once a node is ready, shows the full menu of skills and routes the user to the right one.

## Formatting

When presenting to the user, use consistent labels before each code block:
- **Run in your terminal:** — a command the user should execute
- **Expected output:** — example of what a successful result looks like
- **Save as `filename`:** — file contents the user should write to disk

Add a `---` horizontal rule before each labeled code block to visually separate it from surrounding text.

---

## Step 1 — Check if Bee is running

**Say "Checking your Bee node…"**, then probe the default API endpoint directly — don't use swarm-cli here (it may not be installed yet), and don't pause for confirmation (read-only check):

```bash
curl -s http://localhost:1633/status | jq .beeMode
```

If it returns a `beeMode` value (`ultra-light`, `light`, or `full`), Bee is running → go to **Step 3** with that value.

If the request fails or returns no output, continue to Step 2.

## Step 2 — Check if Bee is installed

Silently look for a Bee binary in common locations. Run these checks without showing the commands to the user:

**All platforms:**
```bash
bee version
```

**Windows (PowerShell):**
```powershell
where.exe bee
Get-Command bee -ErrorAction SilentlyContinue
Test-Path "$env:APPDATA\bee\bee.exe"
Test-Path "$env:LOCALAPPDATA\bee\bee.exe"
Test-Path "$env:PROGRAMFILES\bee\bee.exe"
Test-Path "$env:PROGRAMFILES(x86)\bee\bee.exe"
Test-Path "$env:USERPROFILE\.bee\bee.exe"
Get-Service bee -ErrorAction SilentlyContinue
```

**Linux/macOS:**
```bash
ls /usr/local/bin/bee /usr/bin/bee ~/.bee/bin/bee 2>/dev/null
systemctl status bee 2>/dev/null
brew list bee 2>/dev/null
```

### Route based on findings

**Bee found but not responding at localhost:1633:**

Tell the user:
> "I detected a Bee installation on your system, but I'm not getting a response from the default endpoint at `http://localhost:1633`. Please start your Bee node and then run `/swarm` again — or, if your node is running on a non-default endpoint, let me know the address and I'll use that instead."

- If they provide a different endpoint: use it in place of `localhost:1633` for all subsequent checks and pass it along to any skill you route to.
- If they start their node and re-run `/swarm`: continue from Step 1.
- If they need help or can't get it running: route to `/swarm-troubleshoot`.

**Bee not found anywhere:**

Tell the user Bee doesn't appear to be installed, and let them choose `/swarm-setup-bee-interactive` (guided, step-by-step with verification) or `/swarm-setup-bee` (reference, all steps at once) to set up their node. Briefly explain the difference between the two.

## Step 3 — Bee is running

Use the `beeMode` value from Step 1 — no extra command needed:

- **ultra-light:** Tell the user their node is running in ultra-light mode and uploads won't work. Ask if they want to upgrade to light mode — if yes, route to `/swarm-setup-bee-interactive`. Otherwise, show the menu below (downloads still work).
- **light or full:** Tell the user their node is ready, then show the menu below and ask what they want to build.

## Step 4 — Show the menu

```
Welcome! Here's what I can help you with:

🐝 Setup & Infrastructure
  /swarm-setup-bee-interactive — Install and run a Bee node, step-by-step with verification
  /swarm-setup-bee             — Install and run a Bee node (reference, all steps at once)
  /swarm-stamps                — Buy or manage postage stamps (required for uploads)
  /swarm-troubleshoot          — Diagnose node, connectivity, or upload issues

📦 Store & Retrieve
  /swarm-upload-download  — Upload and download data, files, or directories
  /swarm-host-website     — Deploy a website to Swarm (with optional ENS)

🔧 Build
  /swarm-build-app        — Scaffold a Swarm dApp or add bee-js to your project
  /swarm-feed             — Create updateable content at a fixed address
  /swarm-blog             — Build a blog with posts, feeds, and a permanent URL

🔒 Advanced
  /swarm-act              — Encrypt data with per-account access control
  /swarm-messaging        — Real-time messaging (GSOC or PSS)

📚 Questions
  /swarm-docs             — Answer Swarm concepts from the authoritative docs
```

### Then route

"What are you looking to build?" and route based on their answer:

| They say... | Route to |
|---|---|
| "I'm new" / "getting started" / "first time" | `/swarm-setup-bee-interactive` (guided) or `/swarm-setup-bee` (reference) |
| "upload" / "store data" / "download" | `/swarm-upload-download` |
| "deploy a website" / "host a site" | `/swarm-host-website` |
| "build an app" / "scaffold" / "dApp" | `/swarm-build-app` |
| "feed" / "dynamic content" / "update without changing URL" | `/swarm-feed` |
| "blog" / "posts" / "publish articles" | `/swarm-blog` |
| "stamp" / "storage" / "how much does it cost" | `/swarm-stamps` |
| "encrypt" / "private" / "access control" | `/swarm-act` |
| "chat" / "messaging" / "real-time" / "notifications" | `/swarm-messaging` |
| "how does X work" / "explain" / concept question | `/swarm-docs` |
| "not working" / "error" / "can't connect" | `/swarm-troubleshoot` |
| "no code" / "just deploy" | Suggest Beeport (beeport.ethswarm.org) — no node needed |

### Quick path check

If still unclear where they are in their journey:

1. **Do you have a Bee node running?** No → `/swarm-setup-bee-interactive` (guided) or `/swarm-setup-bee` (reference)
2. **Do you have a postage stamp?** No → `/swarm-stamps`
3. **What do you want to build?** → route to the right skill
