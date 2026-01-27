---
layout: layouts/post.njk
date: 2026-01-05
title: "Innslippsord"
category: Reverse Engineering
difficulty: Easy
tags: [ETJ2025]
description: "Reversing the innslippsord password check and assembly flow."
---

## Analysis
```sh
login@corax ~/1_grunnleggende/1.7_Innslippsord $ pwn checksec innslippsord
[*] '/home/login/1_grunnleggende/1.7_Innslippsord/innslippsord'
    Arch:       amd64-64-little
    RELRO:      Full RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        PIE enabled
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No

pwndbg ./innslippsord
pwndbg> info functions
pwndbg> disas check_pw
```

## check_pw
```asm
   0x00000000000011fe <+0>:     endbr64
   0x0000000000001202 <+4>:     push   rbp
   0x0000000000001203 <+5>:     mov    rbp,rsp
   0x0000000000001206 <+8>:     sub    rsp,0x70
   0x000000000000120a <+12>:    mov    QWORD PTR [rbp-0x68],rdi
   0x000000000000120e <+16>:    mov    rax,QWORD PTR fs:0x28
   0x0000000000001217 <+25>:    mov    QWORD PTR [rbp-0x8],rax
   0x000000000000121b <+29>:    xor    eax,eax
   0x000000000000121d <+31>:    movabs rax,0xa3555b22f1748b5
   0x0000000000001227 <+41>:    movabs rdx,0x4030201bac98030
   0x0000000000001231 <+51>:    mov    QWORD PTR [rbp-0x50],rax
   0x0000000000001235 <+55>:    mov    QWORD PTR [rbp-0x48],rdx
   0x0000000000001239 <+59>:    movabs rax,0xc0b0a0908070605
   0x0000000000001243 <+69>:    movabs rdx,0x14131211100f0e0d
   0x000000000000124d <+79>:    mov    QWORD PTR [rbp-0x40],rax
   0x0000000000001251 <+83>:    mov    QWORD PTR [rbp-0x38],rdx
   0x0000000000001255 <+87>:    movabs rax,0x3a2a1890f179f909
   0x000000000000125f <+97>:    movabs rdx,0x309ad966fdffce04
   0x0000000000001269 <+107>:   mov    QWORD PTR [rbp-0x30],rax
   0x000000000000126d <+111>:   mov    QWORD PTR [rbp-0x28],rdx
   0x0000000000001271 <+115>:   movabs rax,0x3cb79b4de323fccc
   0x000000000000127b <+125>:   movabs rdx,0x27921d845263e06a
   0x0000000000001285 <+135>:   mov    QWORD PTR [rbp-0x20],rax
   0x0000000000001289 <+139>:   mov    QWORD PTR [rbp-0x18],rdx
   0x000000000000128d <+143>:   mov    DWORD PTR [rbp-0x54],0x20
   0x0000000000001294 <+150>:   mov    DWORD PTR [rbp-0x5c],0x1234abcd
   0x000000000000129b <+157>:   mov    DWORD PTR [rbp-0x58],0x0
   0x00000000000012a2 <+164>:   jmp    0x1358 <check_pw+346>
   0x00000000000012a7 <+169>:   mov    eax,DWORD PTR [rbp-0x58]
   0x00000000000012aa <+172>:   movsxd rdx,eax
   0x00000000000012ad <+175>:   mov    rax,QWORD PTR [rbp-0x68]
   0x00000000000012b1 <+179>:   add    rax,rdx
   0x00000000000012b4 <+182>:   movzx  eax,BYTE PTR [rax]
   0x00000000000012b7 <+185>:   mov    BYTE PTR [rbp-0x5f],al
   0x00000000000012ba <+188>:   cmp    BYTE PTR [rbp-0x5f],0x0
   0x00000000000012be <+192>:   jne    0x12ca <check_pw+204>
   0x00000000000012c0 <+194>:   mov    eax,0x0
   0x00000000000012c5 <+199>:   jmp    0x1384 <check_pw+390>
   0x00000000000012ca <+204>:   mov    eax,DWORD PTR [rbp-0x58]
   0x00000000000012cd <+207>:   and    eax,0x1
   0x00000000000012d0 <+210>:   test   eax,eax
   0x00000000000012d2 <+212>:   je     0x12e4 <check_pw+230>
   0x00000000000012d4 <+214>:   movzx  eax,BYTE PTR [rbp-0x5f]
   0x00000000000012d8 <+218>:   mov    edx,eax
   0x00000000000012da <+220>:   shl    edx,0x4
   0x00000000000012dd <+223>:   add    eax,edx
   0x00000000000012df <+225>:   xor    DWORD PTR [rbp-0x5c],eax
   0x00000000000012e2 <+228>:   jmp    0x12f1 <check_pw+243>
   0x00000000000012e4 <+230>:   movzx  eax,BYTE PTR [rbp-0x5f]
   0x00000000000012e8 <+234>:   xor    eax,0xffffffa5
   0x00000000000012eb <+237>:   movzx  eax,al
   0x00000000000012ee <+240>:   add    DWORD PTR [rbp-0x5c],eax
   0x00000000000012f1 <+243>:   mov    eax,DWORD PTR [rbp-0x58]
   0x00000000000012f4 <+246>:   cdqe
   0x00000000000012f6 <+248>:   movzx  eax,BYTE PTR [rbp+rax*1-0x50]
   0x00000000000012fb <+253>:   xor    al,BYTE PTR [rbp-0x5f]
   0x00000000000012fe <+256>:   mov    BYTE PTR [rbp-0x5e],al
   0x0000000000001301 <+259>:   mov    eax,DWORD PTR [rbp-0x58]
   0x0000000000001304 <+262>:   add    eax,0x1
   0x0000000000001307 <+265>:   and    eax,0x7
   0x000000000000130a <+268>:   mov    edx,eax
   0x000000000000130c <+270>:   movzx  eax,BYTE PTR [rbp-0x5e]
   0x0000000000001310 <+274>:   mov    esi,edx
   0x0000000000001312 <+276>:   mov    edi,eax
   0x0000000000001314 <+278>:   call   0x11c9 <rol>
   0x0000000000001319 <+283>:   mov    BYTE PTR [rbp-0x5e],al
   0x000000000000131c <+286>:   mov    eax,DWORD PTR [rbp-0x58]
   0x000000000000131f <+289>:   cdqe
   0x0000000000001321 <+291>:   movzx  edx,BYTE PTR [rbp+rax*1-0x30]
   0x0000000000001326 <+296>:   mov    eax,DWORD PTR [rbp-0x58]
   0x0000000000001329 <+299>:   mov    ecx,eax
   0x000000000000132b <+301>:   mov    eax,ecx
   0x000000000000132d <+303>:   add    eax,eax
   0x000000000000132f <+305>:   add    eax,ecx
   0x0000000000001331 <+307>:   xor    eax,edx
   0x0000000000001333 <+309>:   mov    BYTE PTR [rbp-0x5d],al
   0x0000000000001336 <+312>:   mov    eax,DWORD PTR [rbp-0x58]
   0x0000000000001339 <+315>:   mov    edx,eax
   0x000000000000133b <+317>:   mov    eax,edx
   0x000000000000133d <+319>:   add    eax,eax
   0x000000000000133f <+321>:   add    eax,edx
   0x0000000000001341 <+323>:   xor    BYTE PTR [rbp-0x5e],al
   0x0000000000001344 <+326>:   movzx  eax,BYTE PTR [rbp-0x5e]
   0x0000000000001348 <+330>:   cmp    al,BYTE PTR [rbp-0x5d]
   0x000000000000134b <+333>:   je     0x1354 <check_pw+342>
   0x000000000000134d <+335>:   mov    eax,0x0
   0x0000000000001352 <+340>:   jmp    0x1384 <check_pw+390>
   0x0000000000001354 <+342>:   add    DWORD PTR [rbp-0x58],0x1
   0x0000000000001358 <+346>:   mov    eax,DWORD PTR [rbp-0x58]
   0x000000000000135b <+349>:   cmp    eax,DWORD PTR [rbp-0x54]
   0x000000000000135e <+352>:   jl     0x12a7 <check_pw+169>
   0x0000000000001364 <+358>:   mov    eax,DWORD PTR [rbp-0x54]
   0x0000000000001367 <+361>:   movsxd rdx,eax
   0x000000000000136a <+364>:   mov    rax,QWORD PTR [rbp-0x68]
   0x000000000000136e <+368>:   add    rax,rdx
   0x0000000000001371 <+371>:   movzx  eax,BYTE PTR [rax]
   0x0000000000001374 <+374>:   test   al,al
   0x0000000000001376 <+376>:   je     0x137f <check_pw+385>
   0x0000000000001378 <+378>:   mov    eax,0x0
   0x000000000000137d <+383>:   jmp    0x1384 <check_pw+390>
   0x000000000000137f <+385>:   mov    eax,0x1
   0x0000000000001384 <+390>:   mov    rdx,QWORD PTR [rbp-0x8]
   0x0000000000001388 <+394>:   sub    rdx,QWORD PTR fs:0x28
   0x0000000000001391 <+403>:   je     0x1398 <check_pw+410>
   0x0000000000001393 <+405>:   call   0x10b0 <__stack_chk_fail@plt>
   0x0000000000001398 <+410>:   leave
   0x0000000000001399 <+411>:   ret
```


## Findings
- The program has **two hidden lists of 32 bytes each** (A and B), stored on the stack.
- Your password must be **exactly 32 characters long**.
- For every character in your password, the program:
    - mixes it with a value from A
    - rotates the bits
    - compares it with a value from B
- If **any** character does not match → password is wrong.
- If **all 32 match**, and the string ends _exactly_ after 32 chars → password is correct.

```asm
mov    eax,DWORD PTR [rbp-0x58]      ; load i
cdqe                                 ; convert to 64-bit
movzx  eax,BYTE PTR [rbp+rax*1-0x50] ; eax = A[i]
xor    al,BYTE PTR [rbp-0x5f]        ; al = A[i] ^ pw[i]
mov    BYTE PTR [rbp-0x5e],al        ; store t = A[i] ^ pw[i]
```

- `A[i]` is stored at `[rbp - 0x50 + i]`
- `pw[i]` is at `[rbp - 0x5f]`
- `t` becomes `A[i] ^ pw[i]`

then it rotates the bits
```asm
mov    eax,DWORD PTR [rbp-0x58]
add    eax,1
and    eax,7                     ; s = (i+1) & 7
movzx  eax,BYTE PTR [rbp-0x5e]   ; load t
mov    esi,edx                   ; rotation amount
mov    edi,eax                   ; t
call   rol                       ; t = rol8(t, s)
```

Then it loads a byte from the second array B:
`movzx  edx,BYTE PTR [rbp+rax*1-0x30] ; edx = B[i]`

And compares the mixed/rotated value with another transformed version of B\[i\]:

```asm
xor BYTE PTR [rbp-0x5e], al      ; t ^= (3*i) 
cmp al, BYTE PTR [rbp-0x5d]      ; v1 = B[i] ^ (3*i) 
je  ok                           ; must match exactly`
```

So the logic is:
> Take A\[i\] and pw\[i\], mix them, rotate them, mix again with i, and check if it equals something derived from B\[i\].

## Pseudo C
```c
uint8_t rol8(uint8_t x, int s) {
    s &= 7; // keep only 0..7
    return (x << s) | (x >> (8 - s));
}

int check_pw(const char *pw) {
    uint8_t A[32] = { /* bytes from movabs */ };
    uint8_t B[32] = { /* bytes from movabs */ };

    for (int i = 0; i < 32; i++) {

        if (pw[i] == '\0')
            return 0;  // too short

        uint8_t t = A[i] ^ pw[i];
        t = rol8(t, (i+1) & 7);
        uint8_t v1 = B[i] ^ (3 * i);
        t ^= (3 * i);

        if (t != v1)
            return 0;  // wrong character at this position
    }

    if (pw[32] != '\0')
        return 0;  // too long

    return 1;      // password OK
}
```

### Why this produces **exactly one** valid password
The final comparison:
`rol8(A[i] ^ pw[i], (i+1)&7) == B[i]`

can be reversed mathematically, because:
- ROTL/ROTR is reversible
- XOR is reversible
So:
`A[i] ^ pw[i] = rotr8(B[i], (i+1)&7) pw[i] = A[i] ^ rotr8(B[i], (i+1)&7)`

For each position i, this gives **one and only one** correct byte.
Doing this for all 32 positions yields the final password.

## Flag
```
168065a0236e2e64c9c6cdd086c55f63
```
