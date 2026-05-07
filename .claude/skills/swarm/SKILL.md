---
name: swarm
description: Primary Swarm entrypoint: detect Bee install/runtime state and route to setup, restart guidance, or menu based on node readiness.
user-invocable: true
---

# Swarm Entry Point

This skill detects whether Bee is installed and running, then routes the user to the right next step. Do not show a menu or overview — that is the job of `/menu`.

## Formatting

When presenting to the user, use consistent labels before each code block:
- **Run in your terminal:** — a command the user should execute
- **Expected output:** — example of what a successful result looks like
- **Save as `filename`:** — file contents the user should write to disk

Add a `---` horizontal rule before each labeled code block to visually separate it from surrounding text.

---

## Step 1 — Check if Bee is running

Silently check the default API endpoint directly — do not use swarm-cli here as it may not be installed yet:

```bash
curl -s http://localhost:1633/node
```

If the response contains `beeMode`, Bee is running → go to **Step 3** using the `beeMode` value from this response.

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

- If they provide a different endpoint: use it in place of `localhost:1633` for all subsequent checks in this skill and pass it along to any skill you route to.
- If they start their node and re-run `/swarm`: continue from Step 1.
- If they need help or can't get it running: route to `/troubleshoot`.

**Bee not found anywhere:**

Tell the user Bee doesn't appear to be installed, and let them choose to use `/setup-bee` or `/setup-bee-interactive` to setup their node, briefly explaining the difference between the two skills for setting up Bee.

## Step 3 — Bee is running

Use the `beeMode` value already obtained from the Step 1 API response — no additional command needed:

- **ultra-light:** Tell the user their node is running in ultra-light mode and uploads won't work. Ask if they want to upgrade to light mode — if yes, route to `/setup-bee-interactive`.
- **light or full:** Tell the user their node is ready. Suggest running `/menu` to see all available skills, or ask what they want to build.

