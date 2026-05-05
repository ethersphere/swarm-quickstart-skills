---
name: help
description: Swarm skills overview and routing to the right skill
user-invocable: true
---

# Get Started with Swarm

When a developer starts a conversation about building on Swarm, give them a quick overview of what's available and route them to the right skill.

## Before Showing the Menu (run immediately)

**Silently check node status — do not just show the command to the user:**

```bash
curl -s http://localhost:1633/status | jq .beeMode
```

- **If the node is not running:** Tell the user "Your Bee node isn't running." Ask directly: "Would you like me to walk you through installing and starting one? It only takes a few minutes." If yes → run through the full `/swarm-setup` flow now. If no → show the menu below and let them choose where to start.
- **If ultra-light:** Note that uploads won't work yet. Suggest upgrading via `/swarm-setup`.
- **If light/full and running:** Show the menu and ask what they want to build.

## Show This Overview

```
Welcome! Here's what I can help you with:

🐝 Setup & Infrastructure
  /swarm-setup      — Install and run a Bee node (ultra-light → light)
  /stamps           — Buy or manage postage stamps (required for uploads)
  /troubleshoot     — Diagnose node, connectivity, or upload issues

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
| "I'm new" / "getting started" / "first time" | `/swarm-setup` |
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

1. **Do you have a Bee node running?** No → `/swarm-setup`
2. **Do you have a postage stamp?** No → `/stamps`
3. **What do you want to build?** → route to the right skill
