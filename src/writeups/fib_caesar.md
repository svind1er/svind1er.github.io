---
layout: layouts/post.njk
date: 2026-02-22
title: "Fibonacci Caesar"
category: Reverse Engineering
difficulty: Easy
tags: [DDC2026]
description: "Fib-based Caesar with random key; recover plaintext via Pisano period brute force."
---

## Challenge overview
`main.py` encrypts a plaintext into `encryption.txt` using a Fibonacci-driven Caesar shift with a random key.

## Source
Key setup and encrypt call:

```python
alphabet = 'abcdefghijklmnopqrstuvwxyz'

key = random.randint(0, 2**128)

ciphertext = fib_caesar_encrypt(key, text)
```

Encryptor (Fibonacci stream modulo 26):

```python
def fib_caesar_encrypt(n, text):
    a = fib(n, len(alphabet))
    b = fib(n + 1, len(alphabet))
    out = []
    for c in text:
        if c in string.whitespace:
            out.append(c)
            continue
        k = a % len(alphabet)
        a, b = b, a + b
        out.append(alphabet[(alphabet.index(c) + k) % len(alphabet)])
    return "".join(out)
```

## Observation
The cipher depends on Fibonacci values modulo 26, so the stream repeats with the Pisano period for 26. The period is at most $\large m^2$ for modulus $\large m$, and the actual period here is 84, so only 84 keys matter.

## Solver
Brute force all `n` in the period and pick the readable plaintext:

```python
alphabet = "abcdefghijklmnopqrstuvwxyz"

def fib(n, mod):
    def _fib(k):
        if k == 0:
            return (0, 1)
        a, b = _fib(k >> 1)
        c = (a * ((b << 1) - a)) % mod
        d = (a * a + b * b) % mod
        if k & 1:
            return (d, (c + d) % mod)
        return (c, d)
    return _fib(n)[0]


def pisano_period(mod):
    prev, curr = 0, 1
    for p in range(1, mod * mod + 1):
        prev, curr = curr, (prev + curr) % mod
        if prev == 0 and curr == 1:
            return p
    raise RuntimeError("Pisano period not found")


def fib_caesar_decrypt(n, text):
    a = fib(n, len(alphabet))
    b = fib(n + 1, len(alphabet))
    out = []
    for c in text:
        if c in string.whitespace:
            out.append(c)
            continue
        k = a % len(alphabet)
        a, b = b, a + b
        out.append(alphabet[(alphabet.index(c) - k) % len(alphabet)])
    return "".join(out)
```

## Result
Readable candidate at `n=?`:

```text
n=?: ddc ? ? ? ? ?
```

Flag:

```text
ddc{..}
```
