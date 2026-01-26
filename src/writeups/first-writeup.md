---
layout: layouts/post.njk
title: "Crypto 101: One-Time Pad Reuse"
date: 2024-05-12
category: Crypto
difficulty: Easy
tags: [HTB]
description: "A short walk-through showing why OTP reuse leaks plaintext."
---

This writeup is a short sketch of a classic CTF crypto mistake: reusing a one-time pad.

## Quick intuition

If two ciphertexts share the same OTP key, XORing them removes the key and leaves
the XOR of the two plaintexts.

Inline math example: $C_1 \oplus C_2 = P_1 \oplus P_2$.

Block math example:

$$
P_1 = (C_1 \oplus C_2) \oplus P_2
$$

## Code sketch

```python
def xor_bytes(a, b):
    return bytes(x ^ y for x, y in zip(a, b))

c1 = bytes.fromhex("4b1f...")
c2 = bytes.fromhex("5a3a...")
leak = xor_bytes(c1, c2)
```

## Table snapshot

| Step | Goal | Output |
| --- | --- | --- |
| XOR ciphertexts | Remove key | $P_1 \\oplus P_2$ |
| Guess word | Recover segment | Partial plaintext |
| Iterate | Expand context | Full flag |
