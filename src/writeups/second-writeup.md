---
layout: layouts/post.njk
title: "Web: JWT None Algorithm"
date: 2024-06-03
category: Web
difficulty: Easy
tags: [picoCTF]
description: "Abusing the `alg: none` pitfall to bypass signature checks."
---

This challenge uses a weak JWT validation routine that trusts `alg: none`.

## Concept map

- The server accepts unsigned tokens.
- The header can be edited without detection.

Inline math: $\\text{verified} = \\text{false}$ when the key is missing.

```sql
SELECT role FROM users
WHERE username = 'admin';
```

| Step | Payload | Result |
| --- | --- | --- |
| Edit header | `{\"alg\":\"none\"}` | Signature ignored |
| Elevate role | `role=admin` | Access granted |
