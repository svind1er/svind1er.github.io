---
layout: layouts/post.njk
title: "Solve Me"
date: 2026-01-05
category: Reverse Engineering
difficulty: Easy 
tags: [ETJ2025]
description: "Multi-stage password checks and a Salsa-like decrypt for flags."
---

## Overview
`solveMe` asks for four passwords. Each correct password reveals a flag. The first three are straightforward string checks; the fourth uses a custom Salsa-like decryption on embedded data and requires a 4-letter lowercase password.

Known passwords & flags:
1. Password: `SuperSecretPass!` → `FLAG{Strings_are_all_you_need}`
2. Password: `a beautiful pass` → `FLAG{Start_the_day_on_the_right_offset}`
3. Password: `n0PlaceLik3aH0m3` → `FLAG{Don't_get_lost_on_your_way_home}`
4. Password: `qbit` → `FLAG{Brutus_doesnt_remember_passwords}`
5. Flag 5 found in hexdump during decrypt loop: `FLAG{A_sparkling_hidden_gem}` (lucky lol)

## Passwords 1–3 (straight from the code)

### Password 1
`checkPassword1` enforces:
- Length 16
- Exact match to the hardcoded string `SuperSecretPass!`

```cpp
if (Mysize != 16 || memcmp(guessedPassword, "SuperSecretPass!", 0x10u))
    exit(1);
```
### Password 2
`checkPassword2` builds the string `What a beautiful password you have chosen for yourself!` and compares the first 16 characters of your input to the substring starting at offset 5:
```cpp
const char* congrats = "What a beautiful password you have chosen for yourself!";
for (int i = 0; i < 16; ++i) {
    if (guessed[i] != congrats[i + 5]) exit(1);
}
```

`congrats[5:21]` is `a beautiful pass`, so that’s the required password.
### Password 3
`checkPassword3` requires length 16, then checks each 4‑byte chunk against precomputed constants with a simple XOR/add transform.

decompiled logic:
```cpp
if (guessedPassword->_Mypair._Myval2._Mysize != 16) {
    std::cout << "Do not waste my time!" << std::endl;
    exit(1);
}
uint32_t correct[4] = {0x8f92b6d0, 0x6b7c4aa9, 0x8c5a89e5, 0x629e8d6a};
uint32_t v4 = 0x010203; // 66051
for (int i = 0; i < 4; ++i) {
    uint32_t chunk = *(uint32_t*)&guessedPasswordBytes[i * 4];
    // transform: (chunk ^ v4) + 0x23105c63 must equal correct[i]
    if (correct[i] != (chunk ^ v4) + 0x23105c63) {
        std::cout << "Please try again..." << std::endl;
        exit(1);
    }
    v4 += 0x4040404; // 67372036
}
```

reconstruction:
```python
correct = [-1888201328, 1803782281, -1940028283, 1652777322]
v4 = 66051
pw_bytes = b""
for i, target in enumerate(correct):
    # mask to 32 bits to avoid negative to_bytes overflow
    val = ((target - 589505315) ^ v4) & 0xFFFFFFFF
    pw_bytes += val.to_bytes(4, "little", signed=False)
    v4 += 67372036
print(pw_bytes.decode())

# n0PlaceLik3aH0m3
```

## Fourth Password
`checkPassword4` enforces:
- Length exactly 4
- Characters must be lowercase `a`–`z`

Then it calls `decrypt` on a 64-byte blob (`flag4`) using the four passwords as a key material. The decryption core is a custom 20-round Salsa-like function plus a per-byte subtraction of `0x111111 * char` for each of the 16 dwords.
### Brute Force
Because the space is only 26^4 = 456,976, a direct brute force works. The following Python script feeds candidates into the binary and stops when a new flag appears:

```python
import itertools
import string
import subprocess
import sys

PASSWORDS = b"SuperSecretPass!\na beautiful pass\nn0PlaceLik3aH0m3\n"
KNOWN_FLAGS = {
    b"FLAG{Strings_are_all_you_need}",
    b"FLAG{Start_the_day_on_the_right_offset}",
    b"FLAG{Don't_get_lost_on_your_way_home}",
}

def main():
    for idx, cand in enumerate(map("".join, itertools.product(string.ascii_lowercase, repeat=4)), 1):
        data = PASSWORDS + cand.encode() + b"\n"
        try:
            out = subprocess.run(["./solveMe"], input=data, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True).stdout
        except subprocess.CalledProcessError:
            continue

        for line in out.splitlines():
            if line.startswith(b"FLAG{") and line not in KNOWN_FLAGS:
                print(f"FOUND password={cand} flag={line.decode()}")
                return

        if idx % 1000 == 0:
            print(f"\rtried {idx:6d} candidates, last tested: {cand}", end="", file=sys.stderr, flush=True)

    print(file=sys.stderr)

if __name__ == "__main__":
    main()

```

Running this finds:
```
FOUND password=qbit flag=FLAG{Brutus_doesnt_remember_passwords}
```
