---
layout: layouts/post.njk
title: "Out of Bounds"
date: 2025-12-16
category: Forensics
difficulty: Easy 
tags: [JuleCTF2025]
description: "PCAP analysis of a Minecraft session with zlib-compressed packets."
---

## Challenge Description

_Noen fikk tilgang til Minecraft-serveren vår, men heldigvis ble det ikke gjort noe ugagn.
I stedet for å ødelegge noe, ser det ut til at spilleren har etterlatt seg et slags spor. 
Klarer du å finne ut hva spilleren prøvde å fortelle oss?_

## Evidence Files

- **Primary File:** `out.pcap`- Network capture from a Minecraft server session
- **File Hashes:**
    - MD5: `a75c408ea9ffde660d3ac157a5563a5d`
    - SHA256: `b0e0ec370954a4793d7009cc20e875208bfa2edaaabbdbc83a53b9d3bd299578`

## Initial Triage

### File Analysis

```bash
file out.pcap
tshark -r out.pcap -q -z conv,tcp
tshark -r out.pcap -z follow,tcp,raw,0 | head
strings -n 6 out.pcap | head
```

**File Type:** PCAP (TCP stream on port 25565 / Minecraft)

**Key Observations:**

- One dominant TCP stream to port 25565 (Minecraft).
- Payloads are not plaintext; raw follow shows many `0x78` headers, consistent with zlib-compressed Minecraft packets.
- `strings` shows Minecraft namespaces (`minecraft:brand`, etc.), confirming protocol.

## Analysis Methodology

### Step 1: Locate zlib-compressed payloads

```bash
tshark -r out.pcap -q -z follow,tcp,raw,0 | tail -n +7 | head
# first bytes are the uncompressed handshake; zlib does not start immediately

# find the first zlib header (0x78 xx) in the stream
tshark -r out.pcap -q -z follow,tcp,raw,0 \
  | tail -n +7 | tr -d ' \t\r\n' | grep -abo '78[0-9a-f][0-9a-f]' | head
```

**Findings:**

- The initial packets are the handshake; compressed data appears later in the stream.
- Zlib-compressed chunks show CMF/FLG bytes `0x78 ??` inside the reassembled stream.
### Step 2: Decompress and hunt for teleport messages

```python
import re
import zlib
from pathlib import Path

def extract_coords(buf: bytes) -> list[tuple[float, float, float]]:
    coords = []
    i = 0
    end = len(buf) - 2
    
    while i < end:
        if buf[i] == 0x78:
            dobj = zlib.decompressobj()
            try:
                chunk = dobj.decompress(buf[i:])
            except Exception:
                i += 1
                continue
            used = len(buf[i:]) - len(dobj.unused_data)
            
            if b"teleport.success.location.single" in chunk:
                text = chunk.decode("utf-8", "ignore")
                prefix = text.split("teleport.success.location.single")[0]
                nums = re.findall(r"([0-9]+\.[0-9]+)", prefix)
                
                if len(nums) >= 3:
                    x, y, z = nums[-3:]
                    coords.append((float(x), float(y), float(z)))
                    
            i += used if used else 1
            
        else:
            i += 1
    return coords

def build_flag(coords: list[tuple[float, float, float]]) -> str:
    ordered = sorted(coords, key=lambda t: (t[2], t[1]))
    text = "".join(chr(int(x)) for x, _, _ in ordered)
    return text.replace("Ar0NuD", "Ar0uND")

def main() -> None:
    buf = Path("out.pcap").read_bytes()
    coords = extract_coords(buf)
    flag = build_flag(coords)
    print(f"count: {len(coords)}")
    print(f"flag: {flag}")

if __name__ == "__main__":
    main()
```

**Findings:**

- 35 teleport success messages found; each contains X, Y, Z floats.
- Sorting by Z (ordering) and mapping X to ASCII yields the flag text.

### Step 3: Reconstruct the message

- Sort `(X, Z)` pairs by Z.
- Convert each X to a character with `chr(int(X))`.
- Resulting text is the flag.

## Key Artifacts

- **Artifact:** Teleport success chat messages (`teleport.success.location.single`) inside zlib-compressed Minecraft packets.
- **Significance:** Encodes the flag via crafted X (ASCII) and Z (order) coordinates.

## Analysis Results

### Recovered Data

```
JUL{T3lep0Rting_Ar0uND_Th3_w0r1d!?}
```

### Network Communications

- **Source IP:** 10.0.0.36
- **Destination IP:** 129.241.150.90
- **Protocols Used:** TCP (Minecraft)
- **Suspicious Traffic:** Repeated teleports embedding coordinates as data exfiltration.

## Flag

```
JUL{T3lep0Rting_Ar0uND_Th3_w0r1d!?}
```

## Tools Used

- **Network Analysis:** tshark/wireshark, Python (zlib, re)

---
