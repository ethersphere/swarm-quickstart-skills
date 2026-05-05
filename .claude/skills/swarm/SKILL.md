---
name: swarm
description: Swarm skills overview — entry point and routing to the right skill
user-invocable: true
---

# Swarm Entry Point

This skill detects whether Bee is installed and running, then routes the user to the right next step. Do not show a menu or overview — that is the job of `/help`.

## Step 0 — Detect system and check permissions

### Step 0a — Detect OS

Run these checks silently without showing output to the user.

**Detect OS family:**

```bash
uname -s 2>/dev/null
```

- `Linux` → Linux (proceed to distro detection below)
- `Darwin` → macOS
- Failure, empty output, or PowerShell-only environment → Windows

**On Linux — detect distro family:**

```bash
cat /etc/os-release 2>/dev/null | grep "^ID_LIKE=\|^ID="
```

- Contains `debian`, `ubuntu` → **Debian/Ubuntu**
- Contains `fedora`, `rhel`, `centos`, `sles`, `opensuse` → **RPM-based** (Fedora/RHEL/CentOS/SUSE)
- Unknown → treat as generic Linux (use the common Linux permission set)

### Step 0b — Build the relevant permission list for this system

Start with the **cross-platform** set, then add the block for the detected OS. Do not include permissions from other OS blocks.

**Cross-platform (all systems):**
```
"Bash(curl -s http://localhost:1633/*)"         # bee-api-read   — stamps, feed, act, upload-download, host-website, messaging, troubleshoot, blog, swarm-setup, help
"Bash(curl -X POST http://localhost:1633/*)"    # bee-api-post   — stamps, upload-download, swarm-setup
"Bash(curl -X PATCH http://localhost:1633/*)"   # bee-api-patch  — stamps
"Bash(curl -X PUT http://localhost:1633/*)"     # bee-api-put    — troubleshoot
"Bash(swarm-cli *)"                             # swarm-cli      — stamps, upload-download, feed, act, host-website, blog, swarm-setup, troubleshoot
"Bash(npm *)"                                   # npm            — upload-download, feed, act, host-website, messaging, blog, build-app, swarm-setup
"Bash(node *)"                                  # node           — blog, build-app
"WebFetch(domain:bee-js.ethswarm.org)"          # bee-js-docs    — upload-download, feed, act, host-website, messaging, blog, stamps, swarm-setup, build-app
"WebFetch(domain:api.github.com)"               # github-api     — swarm-setup
"WebFetch(domain:fund.ethswarm.org)"            # fund-swarm     — swarm-setup
"WebFetch(domain:www.ethswarm.org)"             # ethswarm-web   — swarm-setup
"WebFetch(domain:xdai.fairdatasociety.org)"     # gnosis-rpc     — swarm-setup, troubleshoot
"WebFetch(domain:docs.gnosischain.com)"         # gnosis-docs    — swarm-setup
"WebFetch(domain:bridge.gnosischain.com)"       # gnosis-bridge  — swarm-setup
"WebFetch(domain:discord.gg)"                   # discord        — troubleshoot
```

**+ Linux (all distros):**
```
"Bash(uname -s)"                                # uname          — swarm-setup
"Bash(which bee)"                               # bee-detect     — swarm
"Bash(ls /usr/local/bin/bee *)"                 # bee-pathcheck  — swarm
"Bash(systemctl status bee *)"                  # systemd        — swarm, troubleshoot
"Bash(wget *)"                                  # wget           — swarm-setup
"Bash(lsof -i :1633)"                           # portcheck      — troubleshoot
"Bash(nc -zv *)"                                # netcheck       — troubleshoot
"Bash(curl icanhazip.com *)"                    # iplookup       — troubleshoot
```

**+ Linux Debian/Ubuntu (additional):**
```
"Bash(apt-get *)"                               # apt            — swarm-setup
"Bash(dpkg -l *)"                               # dpkg           — swarm-setup
```

**+ Linux RPM-based — Fedora/RHEL/CentOS/SUSE (additional):**
```
"Bash(dnf *)"                                   # dnf            — swarm-setup
"Bash(rpm -q *)"                                # rpm            — swarm-setup
```

**+ macOS:**
```
"Bash(uname -s)"                                # uname          — swarm-setup
"Bash(which bee)"                               # bee-detect     — swarm
"Bash(ls /usr/local/bin/bee *)"                 # bee-pathcheck  — swarm
"Bash(brew list bee *)"                         # homebrew       — swarm
"Bash(brew services *)"                         # brew-services  — swarm-setup
"Bash(wget *)"                                  # wget           — swarm-setup
"Bash(lsof -i :1633)"                           # portcheck      — troubleshoot
"Bash(nc -zv *)"                                # netcheck       — troubleshoot
"Bash(curl icanhazip.com *)"                    # iplookup       — troubleshoot
```

**+ Windows:**
```
"PowerShell(Test-Path *)"                       # win-pathcheck  — swarm, swarm-setup
"PowerShell(Get-Service *)"                     # win-service    — swarm
```

### Step 0c — Compare and ask

Silently read `.claude/settings.local.json` and `.claude/settings.json` (if either exists). Collect the combined `permissions.allow` arrays from both files.

**Matching rules:**
- A required permission is already covered if the exact string is present, OR if an existing wildcard permission subsumes it (e.g. `Bash(curl *)` covers `Bash(curl -s http://localhost:1633/*)`).
- A narrower existing entry does NOT cover a broader required one (e.g. `Bash(curl -s http://localhost:1633/status)` does not cover `Bash(curl -s http://localhost:1633/*)`).

If all are covered, skip to Step 1 silently.

If any are missing, tell the user which permissions are missing by their label and which skills need them, then ask whether to add them now. Format it like:

```
The following permissions are missing and required by Swarm skills:

  • bee-api-read — stamps, feed, act, upload-download, host-website, messaging, troubleshoot, blog
  • swarm-cli — stamps, upload-download, feed, act, host-website, blog, swarm-setup, troubleshoot
  • npm — upload-download, feed, act, host-website, messaging, blog, build-app, swarm-setup
  ...

Would you like to add these permissions now?
```

**If yes:** Write all missing permission strings to `.claude/settings.local.json` under `permissions.allow`. Merge with existing content — do not overwrite existing entries. If the file doesn't exist, create it with the standard `{"permissions":{"allow":[]}}` structure. Then continue to Step 1.

**If no:** Continue to Step 1 without modifying settings.

---

## Step 1 — Check if Bee is running

Silently check the default API endpoint:

```bash
curl -s http://localhost:1633/status
```

If you get a valid response, Bee is running → go to **Step 3**.

If there is no response, continue to Step 2.

## Step 2 — Check if Bee is installed

Silently look for a Bee binary in common locations. Run these checks without showing the commands to the user:

**All platforms:**
```bash
which bee
bee version
```

**Windows (PowerShell):**
```powershell
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

Tell the user Bee doesn't appear to be installed, and route to `/swarm-setup`.

## Step 3 — Bee is running

Check the mode:

```bash
curl -s http://localhost:1633/status | jq .beeMode
```

- **ultra-light:** Tell the user their node is running in ultra-light mode and uploads won't work. Ask if they want to upgrade to light mode — if yes, route to `/swarm-setup`.
- **light or full:** Node is ready. Route to `/help`.
