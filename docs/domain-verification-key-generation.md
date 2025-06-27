# Domain Verification Key Generation

This script generates a secp256k1 key pair and outputs a JWKS (JSON Web Key Set) file for Coinbase domain verification, as well as a private key for signing.

## What is JWKS?

JWKS (JSON Web Key Set) is an industry standard format (RFC 7517) for representing cryptographic keys in JSON. It's widely used in OAuth 2.0, OpenID Connect, and other security protocols.

## Where is the Public Key?

Your public key is stored as **x and y coordinates** in the JWKS:

```json
{
  "x": "base64url-encoded-x-coordinate",
  "y": "base64url-encoded-y-coordinate"
}
```

### How to Reconstruct the Full Public Key:

The full public key is: `04 + [x-coordinate] + [y-coordinate]`

- `04` = uncompressed point prefix
- `x` = 32-byte x-coordinate (base64url decoded)
- `y` = 32-byte y-coordinate (base64url decoded)

**Total: 65 bytes** (1 + 32 + 32)

## What does it do?
- Generates a secp256k1 key pair
- Outputs a `.well-known/base-jwks.json` file in the current directory (for hosting at `https://yourdomain.com/.well-known/base-jwks.json`)
- Outputs a `domain-verification-private-key.txt` file (for secure storage and use with the SDK)

## Usage

From the root directory of the repo, run:

```sh
yarn generate-key-script
```

## Output
- `.well-known/base-jwks.json`: Public key in JWKS format for domain verification
- `domain-verification-private-key.txt`: Private key (keep this secure!)

## Getting Started with Origin Verification

### Step 1: Generate Your Key Pair

First, generate your domain verification keys:

```sh
yarn generate-key-script
```

This will create:
- `.well-known/base-jwks.json` - Your public key (host this on your domain)
- `domain-verification-private-key.txt` - Your private key (keep secure!)

### Step 2: Host Your Public Key

Host the `base-jwks.json` file at:
```
https://yourdomain.com/.well-known/base-jwks.json
```

This allows Coinbase to verify signatures from your domain.

## Example JWKS Output
```json
{
  "version": "1.0",
  "keys": [
    {
      "kty": "EC",
      "crv": "secp256k1",
      "x": "base64url-encoded-x-coordinate",
      "y": "base64url-encoded-y-coordinate",
      "use": "sig",
      "kid": "coinbase-domain-verification",
      "alg": "ES256K"
    }
  ]
}
```

### JWKS Field Descriptions:
- `version`: Format version for tracking changes
- `kty`: Key type ("EC" for Elliptic Curve)
- `crv`: Curve name ("secp256k1" for Bitcoin/Ethereum curve)
- `x`, `y`: Base64URL-encoded x and y coordinates of the public key
- `use`: Key usage ("sig" for signing)
- `kid`: Key ID for identification ("coinbase-domain-verification")
- `alg`: Algorithm ("ES256K" for ECDSA with secp256k1 and SHA-256)

## Why?
This enables secure domain verification for Coinbase Wallet SDK integrations. The SDK will use the private key to sign requests, and Coinbase will verify signatures using the public key hosted at your domain.

---
**Keep your private key safe!** Never share it or commit it to source control. 