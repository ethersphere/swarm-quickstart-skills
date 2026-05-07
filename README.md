# Swarm Quickstart Skills

Hands-on onboarding guides for developers building on the [Swarm](https://ethswarm.org) decentralized storage network. Drop one folder into your project, type `/swarm`, and get step-by-step guidance through installing a node, buying storage, uploading data, hosting a website, building a dApp, and more.

## What This Is

Swarm Quickstart Skills is a collection of interactive developer guides that run inside AI coding tools. Each guide walks you through a specific task — checking your environment first, running real commands against your Bee node, and explaining what's happening at each step. It's meant to replace the "read the docs, copy a command, wonder why it didn't work" loop with something you can actually follow.

These guides are for developers who are new to Swarm or who want a structured path through the stack: from installing a node all the way to uploading files, hosting a website, building a dApp, or setting up real-time messaging.

Currently supported: [Claude Code](https://claude.ai/code). 

## Quick Start

### 1. Clone into your project

Linux/macOS/WSL:

```bash
git clone https://github.com/ethersphere/swarm-quickstart-skills.git
cp -r swarm-quickstart-skills/.claude/ /path/to/your-project/
```

Windows (PowerShell):

```powershell
git clone https://github.com/ethersphere/swarm-quickstart-skills.git
Copy-Item -Recurse -Force swarm-quickstart-skills/.claude/ C:\path\to\your-project\
```

Or add directly to an existing project:

Linux/macOS/WSL:

```bash
cd your-project
curl -sL https://github.com/ethersphere/swarm-quickstart-skills/archive/main.tar.gz | tar xz --strip-components=1 "swarm-quickstart-skills-main/.claude"
```

Windows (PowerShell):

```powershell
Set-Location your-project
Invoke-WebRequest https://github.com/ethersphere/swarm-quickstart-skills/archive/main.tar.gz -OutFile swarm-quickstart-skills-main.tar.gz
tar -xzf swarm-quickstart-skills-main.tar.gz swarm-quickstart-skills-main/.claude --strip-components=1
```

### 2. Open Claude Code in your project

```bash
cd your-project
claude
```

### 3. Type `/swarm`

This detects your Bee installation status and routes you to the right next step — whether that's installing a node for the first time or jumping straight to uploading.

## Developer Onboarding Path

Start here if you're new to Swarm:

```
/swarm → /setup-bee-interactive → /stamps → /upload-download or /build-app
                                                      |
                                      /host-website  /upload-download  /blog  /act
```

**No node needed yet?** Deploy a website through [Beeport](https://beeport.ethswarm.org) — no Bee node required.

## Available Skills

### Setup & Infrastructure

| Skill | What it does |
|---|---|
| `/swarm` | Entry point — detects your setup and routes to the right next step |
| `/setup-bee-interactive` | Install and run a Bee node, step by step with verification at each stage |
| `/setup-bee` | Same as above but presented as a reference (all steps at once) |
| `/stamps` | List, buy, top up, dilute, and manage postage stamps |
| `/troubleshoot` | Diagnose node, connectivity, and upload issues |

### Store & Retrieve

| Skill | What it does |
|---|---|
| `/upload-download` | Upload and download data, files, or directories |
| `/host-website` | Deploy a static website to Swarm with optional ENS domain |

### Build

| Skill | What it does |
|---|---|
| `/build-app` | Scaffold a Swarm dApp or add bee-js to an existing project |
| `/feed` | Create updateable content at a fixed address (feeds) |
| `/blog` | Build a blog with posts, a feed index, and a permanent URL |

### Advanced

| Skill | What it does |
|---|---|
| `/act` | Encrypt data with per-account access control (ACT) |
| `/messaging` | Real-time messaging via GSOC or PSS |
| `/docs` | Look up any Swarm concept from the official documentation |

## What the Skills Actually Do

These aren't static docs. Each skill:

- **Checks prerequisites** — is your node running? Do you have a stamp? If not, it routes you to the right skill first.
- **Runs real commands** — queries your Bee node API, lists your stamps, uploads your files.
- **Covers multiple tools** — examples for both [bee-js](https://github.com/ethersphere/bee-js) (JavaScript SDK) and [swarm-cli](https://github.com/ethersphere/swarm-cli) (CLI tool).
- **Handles errors** — if something breaks, `/troubleshoot` walks through diagnostics step by step.

## Requirements

- [Claude Code](https://claude.ai/code) (other AI coding tools coming soon)
- [Node.js](https://nodejs.org) 18+
- For most skills: a running [Bee](https://docs.ethswarm.org/docs/bee/installation/install) light node at `http://localhost:1633`

## About Swarm

Swarm is a decentralized peer-to-peer storage network and part of the Ethereum ecosystem. Files are split into 4 KB chunks, distributed across nodes, and retrievable by content hash. Production-ready since 2021.

- Docs: https://docs.ethswarm.org
- bee-js SDK: https://bee-js.ethswarm.org/docs/
- Bee API reference: https://docs.ethswarm.org/api/
- swarm-cli: https://github.com/ethersphere/swarm-cli
- Beeport (no-node deploys): https://beeport.ethswarm.org
- Discord: https://discord.gg/hyCr9BMX9U

## Contributing

Skills are standalone markdown files in `.claude/skills/`. To edit or add a skill:

1. Skills should be self-contained — include everything needed for that topic.
2. Always check prerequisites and route to the right skill if something is missing.
3. Cover both bee-js and swarm-cli where applicable.
4. Reference other skills using `/skill-name` format.

## Codex Mirror Automation

This repository is the source of truth. A GitHub Action (`sync-codex-repo.yml`) syncs changes to `ethersphere/swarm-quickstart-skills-codex`.

Required secret in this repo:
- `CODEX_SYNC_TOKEN` — a token with write access to `ethersphere/swarm-quickstart-skills-codex`.

## License

MIT
