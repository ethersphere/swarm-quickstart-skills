---
name: menu
description: Overview of all available Swarm skills with routing to the right one based on what the user wants to build. Checks node status first and offers to start the setup flow if the node is not running. Lists skills for node setup, stamps, uploading and downloading, website hosting, feeds, blogs, access control, messaging, and troubleshooting. Use when starting a session and unsure where to begin, or when the user asks what they can build on Swarm.
user-invocable: true
---

# Swarm Skills Menu

Show the user all available Swarm skills and route them to the right one based on what they want to do.

## Before Showing the Menu (run immediately)

**Silently check node status using the API directly — do not use swarm-cli here as it may not be installed yet:**

```bash
curl -s http://localhost:1633/node
```

- **If the request fails or returns no output:** Tell the user "Your Bee node isn't running." Ask directly: "Would you like me to walk you through installing and starting one? It only takes a few minutes." If yes → run through the full `/setup-bee-interactive` flow now. If no → show the menu below and let them choose where to start.
- **If `beeMode` is `ultra-light`:** Note that uploads won't work yet. Suggest upgrading via `/setup-bee-interactive`.
- **If `beeMode` is `light` or `full`:** Show the menu and ask what they want to build.

## Show This Overview

```
Welcome! Here's what I can help you with:

🚀 Not sure where to start?
  /swarm  — Detects your Bee installation and routes you to the right next step

🐝 Setup & Infrastructure
  /setup-bee-interactive — Install and run a Bee node, step-by-step with verification
  /setup-bee             — Install and run a Bee node (reference, all steps at once)
  /stamps                — Buy or manage postage stamps (required for uploads)
  /troubleshoot          — Diagnose node, connectivity, or upload issues

📦 Store & Retrieve 
  /upload-download  — Upload and download data, files, or directories
  /host-website     — Deploy a website to Swarm (with optional ENS)

🔧 Build
  /build-app        — Scaffold a Swarm dApp or add bee-js to your project
  /feed             — Create updateable content at a fixed address
  /blog             — Build a blog with posts, feeds, and a permanent URL

🔒 Advanced
  /act              — Encrypt data with per-account access control
  /messaging        — Real-time messaging (GSOC or PSS)
```

## Then Ask

"What are you looking to build?" and route them based on their answer:

| They say... | Route to |
|---|---|
| "I'm new" / "getting started" / "first time" | `/setup-bee-interactive` (guided) or `/setup-bee` (reference) |
| "upload" / "store data" / "download" | `/upload-download` (check node first) |
| "deploy a website" / "host a site" | `/host-website` |
| "build an app" / "scaffold" / "dApp" | `/build-app` |
| "feed" / "dynamic content" / "update without changing URL" | `/feed` |
| "blog" / "posts" / "publish articles" | `/blog` |
| "stamp" / "storage" / "how much does it cost" | `/stamps` |
| "encrypt" / "private" / "access control" | `/act` |
| "chat" / "messaging" / "real-time" / "notifications" | `/messaging` |
| "not working" / "error" / "can't connect" | `/troubleshoot` |
| "no code" / "just deploy" | Suggest Beeport (beeport.ethswarm.org) — no node needed |

## Quick Path Check

If unclear where they are in their journey (and the node check above didn't resolve it), ask:

1. **Do you have a Bee node running?** No → `/setup-bee-interactive` (guided) or `/setup-bee` (reference)
2. **Do you have a postage stamp?** No → `/stamps`
3. **What do you want to build?** → route to the right skill
