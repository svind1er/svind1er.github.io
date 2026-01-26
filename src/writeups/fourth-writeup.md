---
layout: layouts/post.njk
title: "Forensics: Memory Strings Sweep"
date: 2024-07-02
category: Forensics
difficulty: Medium
tags: [HTB]
description: "Quick triage workflow for memory dumps using targeted strings."
---

We scan the dump for high-signal strings to narrow the search space.

Inline formula: $\\text{signal} = \\frac{\\text{hits}}{\\text{total}}$.

```bash
strings -el memory.raw | rg -i \"flag|ctf|token\"
```

| Step | Tool | Result |
| --- | --- | --- |
| Unicode sweep | `strings -el` | Wide hits |
| Narrow regex | `rg` | Candidate lines |
| Extract region | `volatility` | Flag |
