# Scripts

This directory contains utility scripts for the Mobile Wallet Protocol client.

## Available Scripts

### `generate-domain-keys.ts`

Generates secp256k1 key pairs for Base domain verification.

**Usage:**
```bash
yarn generate-key-script
```

**What it does:**
- Generates a secp256k1 key pair
- Creates a `base-jwks.json` file in JWKS format
- Creates a `domain-verification-private-key.txt` file with the private key

**Output:**
- `base-jwks.json` - Public key in JWKS format for domain verification
- `domain-verification-private-key.txt` - Private key (keep secure!)