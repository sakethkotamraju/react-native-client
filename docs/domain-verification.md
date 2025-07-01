# Domain Verification

Domain verification enables secure authentication for Coinbase Smart Wallet RPC requests across all platforms (web, mobile, server-side). This system uses cryptographic signatures to verify domain ownership, allowing applications to authenticate with CBSW without relying on browser APIs.

## Key Generation

### What is JWKS?

JWKS (JSON Web Key Set) is an industry standard format (RFC 7517) for representing cryptographic keys in JSON. It's widely used in OAuth 2.0, OpenID Connect, and other security protocols.

### Generate Your Key Pair

From the root directory of the repo, run:

```sh
yarn generate-key-script
```

This will create:
- `.well-known/base-jwks.json` - Your public key (host this on your domain)
- `domain-verification-private-key.txt` - Your private key (keep secure!)

### Host Your Public Key

Host the `base-jwks.json` file at:
```
https://yourdomain.com/.well-known/base-jwks.json
```

This allows Base to verify signatures from your domain.

### Example JWKS Output
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
      "kid": "base-domain-verification",
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
- `kid`: Key ID for identification ("base-domain-verification")
- `alg`: Algorithm ("ES256K" for ECDSA with secp256k1 and SHA-256)

## SDK Integration

### Basic Setup

Add the `originVerification` parameter to your provider configuration:

```typescript
import { EIP1193Provider, Wallets } from '@mobile-wallet-protocol/client';

const provider = new EIP1193Provider({
  metadata: {
    name: 'My App',
    customScheme: 'myapp://',
  },
  wallet: Wallets.CoinbaseSmartWallet,
  originVerification: {
    domain: "www.example.com",
    generateSignature: async (nonce, requestData) => {
      // Developer implements signing with their private key
      const dataToSign = JSON.stringify({ 
        domain: "www.example.com", 
        nonce, 
        requestData 
      });
      return await privateKey.sign(dataToSign);
    }
  }
});
```

### Signature Implementation

The `generateSignature` function receives:
- `nonce`: A unique identifier provided by the wallet to prevent replay attacks
- `requestData`: The RPC request being made

You must sign the payload: `JSON.stringify({ domain, nonce, requestData })`

### Example with secp256k1

```typescript
import { EIP1193Provider, Wallets } from '@mobile-wallet-protocol/client';
import { secp256k1 } from '@noble/curves/secp256k1';

// Load your private key (keep this secure!)
const privateKeyBase64 = 'your-private-key-here';
const privateKeyBytes = Buffer.from(privateKeyBase64, 'base64');

const provider = new EIP1193Provider({
  metadata: {
    name: 'My App',
    customScheme: 'myapp://',
  },
  wallet: Wallets.CoinbaseSmartWallet,
  originVerification: {
    domain: "www.example.com",
    generateSignature: async (nonce, requestData) => {
      const payload = JSON.stringify({
        domain: "www.example.com",
        nonce,
        requestData
      });
      
      // Create message hash
      const messageHash = new TextEncoder().encode(payload);
      
      // Sign with secp256k1
      const signature = secp256k1.sign(messageHash, privateKeyBytes);
      
      // Return signature as hex string
      return `0x${Buffer.from(signature.toCompactRawBytes()).toString('hex')}`;
    }
  }
});
```

### Wagmi Integration

```typescript
import { createConnectorFromWallet, Wallets } from '@mobile-wallet-protocol/wagmi-connectors';

const connector = createConnectorFromWallet({
  metadata: {
    name: 'My App',
    customScheme: 'myapp://',
  },
  wallet: Wallets.CoinbaseSmartWallet,
  originVerification: {
    domain: "www.example.com",
    generateSignature: async (nonce, requestData) => {
      // Your signature implementation
      return await signWithPrivateKey(nonce, requestData);
    }
  }
});
```

## Security Best Practices

**Keep your private key safe!** Never share it or commit it to source control.

- Store private keys in secure environment variables or key management systems
- Generate new key pairs periodically and update well-known files
- Limit access to private keys to authorized personnel only
- Monitor well-known file accessibility and alert on unauthorized changes
- Use HTTPS enforcement for well-known file fetches

## How It Works

1. **Nonce Request**: Before each RPC request, the SDK requests a nonce from the wallet
2. **Signature Generation**: Your `generateSignature` function creates a cryptographic signature
3. **Request Enhancement**: The signature is added to the RPC request
4. **Verification**: Base verifies the signature against your published public key
5. **Processing**: If verification passes, the RPC request is processed normally

This enables secure domain verification for Base Wallet SDK integrations across all platforms. 