---
name: docs
description: Answer Swarm conceptual questions from official docs with source links; use for APIs, behavior, configuration, and architecture clarifications.
user-invocable: true
---

# Swarm Documentation Reference

Use this skill when a developer asks a conceptual or technical question that is not explicitly covered by the steps in another skill. Do not answer from prior training knowledge — find the relevant page, fetch it, locate the most specific section, and cite it.

## What to Do

1. **Announce** that you are looking up the answer in the official documentation.
2. Identify the topic from the user's question.
3. Find the most relevant page(s) from the Official Sources map below.
4. Fetch each relevant page and read the content.
5. Write a concise summary answer based on what you read — not from prior training knowledge. Structure the answer in sections. Prefix each section heading with the appropriate source symbol to indicate where that section's information came from — ✅ if it came from an official source, ⚠️ if it came from an unofficial source.
6. Cite each source used in a "Sources:" section formatted exactly as:
   ```
   Sources:
   ✅ https://example.com/page#anchor
   ⚠️ https://example.com/other
   ```
   Use the direct link to the most specific section found (page URL + anchor if available). Do not use markdown link syntax — show the URL plainly.
7. If multiple topics apply, repeat for each.
8. If the official sources do not fully answer the question, search the web for additional sources, fetch them, summarize what they say, and cite them with the appropriate symbol.
9. Always include the source key at the end of your response.

Do not answer from prior training knowledge. After fetching the relevant pages, provide a concise summary answer drawn directly from the content you fetched — not from prior training. Then cite the sources used.

## Source Key

✅ **Official source** — maintained by the Ethswarm team (docs.ethswarm.org, bee-js.ethswarm.org, github.com/ethersphere/*)
⚠️ **Unofficial source** — community content, third-party blogs, or external references. May be outdated or inaccurate — verify against official sources.

## Official Sources

### Node installation and setup
- https://docs.ethswarm.org/docs/bee/installation/quick-start/
- https://docs.ethswarm.org/docs/bee/installation/fund-your-node/
- https://docs.ethswarm.org/docs/bee/installation/connectivity/
- https://docs.ethswarm.org/docs/bee/installation/docker/

### Node configuration and operation
- https://docs.ethswarm.org/docs/bee/working-with-bee/configuration/
- https://docs.ethswarm.org/docs/bee/working-with-bee/logs-and-files/
- https://docs.ethswarm.org/docs/bee/working-with-bee/backups/
- https://docs.ethswarm.org/docs/bee/working-with-bee/monitoring/
- https://docs.ethswarm.org/docs/bee/working-with-bee/cashing-out/
- https://docs.ethswarm.org/docs/bee/working-with-bee/staking/

### Postage stamps
- https://docs.ethswarm.org/docs/develop/tools-and-features/buy-a-stamp-batch/

### Uploading and downloading
- https://docs.ethswarm.org/docs/develop/upload-and-download/
- https://docs.ethswarm.org/docs/develop/tools-and-features/pinning/
- https://docs.ethswarm.org/docs/develop/tools-and-features/chunk-types/

### Feeds and dynamic content
- https://docs.ethswarm.org/docs/develop/tools-and-features/feeds/
- https://docs.ethswarm.org/docs/develop/dynamic-content/

### Website hosting
- https://docs.ethswarm.org/docs/develop/host-your-website/

### Access control (ACT)
- https://docs.ethswarm.org/docs/develop/act/
- https://bee-js.ethswarm.org/docs/act/

### Messaging (GSOC and PSS)
- https://docs.ethswarm.org/docs/develop/tools-and-features/gsoc/
- https://docs.ethswarm.org/docs/develop/tools-and-features/pss/
- https://bee-js.ethswarm.org/docs/gsoc/
- https://bee-js.ethswarm.org/docs/pss/

### Swarm Desktop app
- https://docs.ethswarm.org/docs/desktop/introduction/
- https://docs.ethswarm.org/docs/desktop/install/

### Getting started / developer intro
- https://docs.ethswarm.org/docs/develop/introduction/

### bee-js SDK reference
- https://bee-js.ethswarm.org/docs/
- https://bee-js.ethswarm.org/docs/api/classes/Bee/

### Bee HTTP API reference
- https://docs.ethswarm.org/api/

### Tools
- swarm-cli: https://github.com/ethersphere/swarm-cli
- create-swarm-app: https://github.com/ethersphere/create-swarm-app
- swarm-mcp (AI agent integration): https://github.com/ethersphere/swarm-mcp
- Beeport (no-node website deploy): https://beeport.ethswarm.org

### Support
- Discord: https://discord.gg/hyCr9BMX9U
- Bee GitHub issues: https://github.com/ethersphere/bee/issues
- bee-js GitHub issues: https://github.com/ethersphere/bee-js/issues

