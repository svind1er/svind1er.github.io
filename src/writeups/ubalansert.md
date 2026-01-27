---
layout: layouts/post.njk
title: "Ubalansert"
date: 2026-01-05
category: Cryptography
difficulty: Easy
tags: [ETJ2025]
description: "Exploit unbalanced RSA primes with Pollard's Rho."
---

## Analysis
The challenge hint, "Everything is not as balanced as it seems," suggests a flaw in the prime generation. In RSA, the modulus $\large n$ is the product of two primes, $\large p$ and $\large q$. For maximum security, these should have the same bit-length. An "imbalance" indicates that one prime is much smaller than the other.

## Vulnerability
If the prime factors are unbalanced, the modulus $\large n$ becomes vulnerable to **Pollard's Rho algorithm**. While secure RSA requires factoring $\large n$ to be computationally infeasible, Rhos method can find a small factor $\large p$ in approximately $\large O(\sqrt{p})$ steps. Once the small prime is found, the entire RSA cryptosystem collapses.

## Exploitation
The attack was executed using the following mathematical steps:

1. **Factorization**: Rhos method was used to find $\large p$. The second prime was then found via: $$\huge q = \frac{n}{p}$$
2. **Totient Calculation**: The Euler's totient function was calculated: $$\huge \phi(n) = (p - 1)(q - 1)$$
3. **Private Key Derivation**: The private exponent $\large d$ was calculated as the modular multiplicative inverse of $\large e$ modulo $\large \phi(n)$: $$\huge d \equiv e^{-1} \pmod{\phi(n)}$$
4. **Decryption**: The ciphertext $\large c$ was decrypted to find the message $\large m$: $$\huge m \equiv c^d \pmod{n}$$
5. **Decoding**: The integer $\large m$ was converted to ASCII to reveal the flag.

## Challenge

**1. Input Values:**
- $\large n = 121177..3877$
- $\large e = 65537$
- $\large c = 136485..650$

**2. Factorization (Finding $\large p$ and $\large q$):** 
Since $\large n$ has a small factor, Rhos method was used to extract it. This algorithm is efficient because its complexity depends on the size of the smallest factor rather than the total size of $\large n$.

```python
import gmpy2

def pollards_rho(n):
    x, y, d, c = 2, 2, 1, 1
    f = lambda x: (x**2 + c) % n
    while d == 1:
        x = f(x)
        y = f(f(y))
        d = gmpy2.gcd(abs(x - y), n)
    return d

p = pollards_rho(n)
q = n // p
```

**3. Factored Results:** 
The script successfully split the modulus $\large n$ into:
- $\large p = 4368083$ (approx. $\large 22$ bits)
- $\large q = 73725722...6669683$ (approx. $\large 2048$ bits)

**4. The Imbalance:** 
The security failure is caused by the massive gap in bit-length: $$\huge \text{Bit-length}(q) \gg \text{Bit-length}(p)$$In a secure RSA setup, both primes should be roughly 1024 bits each. Here, $\large p$ is so small that it can be found in a fraction of a second. The total 2048-bit length of $\large n$ provides a false sense of security because the difficulty of factoring it is tied only to the smallest factor, $\large p$.

**5. Recovery of Plaintext:**
Once you have $\large p$ and $\large q$, you can bypass the security of the modulus. The following Python snippet calculates the private exponent and decodes the message:

```python
# 1. Calculate the totient (phi)
phi = (p - 1) * (q - 1)

# 2. Calculate the private key d (modular inverse of e mod phi)
d = gmpy2.invert(e, phi)

# 3. Decrypt the ciphertext c
m = pow(c, d, n)

# 4. Convert the large integer m back to readable text
# We use 'big' because RSA integers are stored in big-endian format
byte_length = (m.bit_length() + 7) // 8
flag = m.to_bytes(byte_length, 'big').decode()

print(f"Decrypted Flag: {flag}")
```

## Summary
To get from the factors to the flag, the logic follows these steps:
1. **The Totient:** $$\huge \phi(n) = (p - 1)(q - 1)$$
2. **The Private Key:** $$\huge d \cdot e \equiv 1 \pmod{\phi(n)}$$
3. **The Decryption:** $$\huge m \equiv c^d \pmod{n}$$
## Solution
```python
import gmpy2

n = 3220400754238202061781251914995435264732318174482765169331795884593241326420375704675214035152827573720388930809775261470702050758691213422440413562439642865949407161085588489381043681376138238326586665459068025141951028342701397020830706271636407958209373133213710382252444824049984463278729298760773532084799000984604307841825788741782578493919696881862922264915324501250081383327000337481958850284409366488681648360821860708683512450374639594476105658596779781478405295536908596351242954075566616141514156783587173290655774002039564408387248272551248596876508900652920852722789212661920752164966732033945824631479680913085674104670989014941975529785913063075103912888366495312714026942383075130726822265897500715653901796315699488862004310020306153676480356656088986856936102005370890342215440452697160076270658509898876927688964856675456856842317740759318302246005614389024793338548424770232444248537017039529996717078474887543013787998901743028948016218257849692865136536693308631721782283990062011595162755424987194202154750195755945475504871394590719516755292274764625302653697743473172993534825500491806864146833441837634172573568106988482202046818059132212238473594476747343716231335798867398016744056607423864108747252761308927689
e = 65537
c = 1422753909948395314646006472071254361532630325250368813541948964201446802143155132895264260394616371614846584545966664514222434444977999340373884455836663809084067020913246159470418600871024118551826323293836349720409047353535936125979966123258624540348333885255448580865109191443183740046237276637974965190322691920400270785273951737405071605888358871471785310665656382456856081509253179421415649984191431649774414201066746199351922703357373475506848925939679021227847405889897652008092943482933180318265072346450338965177459143920248638012339176290751780733735968297859795949400403196371556866214892960754383543485233611884729186779459506788535464939499893268696584240053265373159550526364216287786443680335759372755202259341301843491663886728062956331758909676211337903338883251410564958813757661036016935759093830497797621284302942258820994808155797372953101586129779205708730478923897953236800065495588983902682741975848274664776247534755446017834050517343816840870021865156773538993828460708433992818383336024152253829195071237053302254491474515282627091277303838787290205584935460731148951562919350237691151203215177985174318125193262644277451610279023478863560822577085725322180650626735193397641058822629584593311352682719764458890

def pollards_rho(n):
    x, y, d, c = 2, 2, 1, 1
    f = lambda x: (x**2 + c) % n
    while d == 1:
        x = f(x)
        y = f(f(y))
        d = gmpy2.gcd(abs(x - y), n)
    return d

p = pollards_rho(n)
q = n // p

print(f"p = {p} \n q = {q}")

phi = (p - 1) * (q - 1)

d = gmpy2.invert(e, phi)

m = pow(c, d, n)

blength = (m.bit_length() + 7) // 8
flag = m.to_bytes(blength, 'big').decode()

print(f"flag: {flag}")
```
