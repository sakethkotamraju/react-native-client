# Domain Verification Key Generation

This script generates a secp256k1 key pair and outputs a JWKS (JSON Web Key Set) file for Coinbase domain verification, as well as a private key for signing.

## What is JWKS?

JWKS (JSON Web Key Set) is an industry standard format (RFC 7517) for representing cryptographic keys in JSON. It's widely used in OAuth 2.0, OpenID Connect, and other security protocols.

### Why JWKS instead of simple JSON?

- **Industry Standard**: IETF standard format used by major platforms
- **Rich Metadata**: Includes algorithm, usage, and key identification
- **Key Rotation**: Can contain multiple keys for seamless rotation
- **Interoperability**: Works with standard JWT libraries and tools
- **Base64URL Encoding**: URL-safe encoding for key components

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
- Outputs a `.well-known/jwks.json` file in the current directory (for hosting at `https://yourdomain.com/.well-known/jwks.json`)
- Outputs a `domain-verification-private-key.txt` file (for secure storage and use with the SDK)

## Usage

From the root directory of the repo, run:

```sh
yarn generate-key-script
```

## Output
- `.well-known/jwks.json`: Public key in JWKS format for domain verification
- `domain-verification-private-key.txt`: Private key (keep this secure!)

## Getting Started with Origin Verification

### Step 1: Generate Your Key Pair

First, generate your domain verification keys:

```sh
yarn generate-key-script
```

This will create:
- `.well-known/jwks.json` - Your public key (host this on your domain)
- `domain-verification-private-key.txt` - Your private key (keep secure!)

### Step 2: Host Your Public Key

Host the `jwks.json` file at:
```
https://yourdomain.com/.well-known/jwks.json
```

This allows Coinbase to verify signatures from your domain.

### Step 3: Initialize the SDK with Origin Verification

```typescript
import { EIP1193Provider } from '@mobile-wallet-protocol/client';

// Read your private key (store this securely!)
const privateKeyHex = 'your-private-key-from-domain-verification-private-key.txt';

// Create a signing function using your private key
const generateSignature = async (nonce: string, payload: unknown): Promise<string> => {
  // Import your private key (you'll need a crypto library like ethers.js or viem)
  const privateKey = new ethers.SigningKey(privateKeyHex);
  
  // Create the data to sign
  const dataToSign = JSON.stringify({
    domain: 'www.example.com', // Your domain
    nonce, // The SDK will provide a nonce for you to use
    requestData: payload
  });
  
  // Sign the data
  const signature = await privateKey.sign(dataToSign);
  return signature;
};

// Initialize the provider with origin verification
const provider = new EIP1193Provider({
  metadata: {
    name: 'My Dapp',
    logoUrl: 'https://example.com/logo.png',
    chainIds: [1, 137], // Ethereum mainnet and Polygon
    customScheme: 'myapp://',
    originVerification: {
      domain: 'www.example.com', // Your domain
      generateSignature
    }
  },
  wallet: {
    type: 'web',
    scheme: 'https://wallet.coinbase.com'
  }
});

// Get a provider
const provider = sdk.getProvider();
```

### Step 4: Use the SDK with Origin Verification

The SDK automatically handles nonce requests and signature generation behind the scenes. Simply make your RPC requests as usual:

```typescript
// The SDK automatically requests a nonce and generates a signature for you
const accounts = await provider.request({
  method: 'eth_requestAccounts'
});

// All subsequent RPC requests will also include origin verification
const balance = await provider.request({
  method: 'eth_getBalance',
  params: [accounts[0], 'latest']
});
```

### Complete Example

Here's a complete example showing how to set up origin verification:

```typescript
import { EIP1193Provider } from '@mobile-wallet-protocol/client';
import { ethers } from 'ethers';

class DomainVerificationManager {
  private privateKey: ethers.SigningKey;
  private domain: string;

  constructor(privateKeyHex: string, domain: string) {
    this.privateKey = new ethers.SigningKey(privateKeyHex);
    this.domain = domain;
  }

  async generateSignature(nonce: string, payload: unknown): Promise<string> {
    const dataToSign = JSON.stringify({
      domain: this.domain,
      nonce, // The SDK will provide a nonce for you to use
      requestData: payload
    });
    
    const signature = await this.privateKey.sign(dataToSign);
    return signature;
  }
}

// Initialize with your private key and domain
const privateKeyHex = 'your-private-key-here';
const domain = 'www.example.com';

const verificationManager = new DomainVerificationManager(privateKeyHex, domain);

const provider = new EIP1193Provider({
  metadata: {
    name: 'My Secure Dapp',
    logoUrl: 'https://example.com/logo.png',
    chainIds: [1, 137],
    customScheme: 'myapp://',
    originVerification: {
      domain,
      generateSignature: verificationManager.generateSignature.bind(verificationManager)
    }
  },
  wallet: {
    type: 'web',
    scheme: 'https://wallet.coinbase.com'
  }
});

// Usage example - no manual nonce requests needed!
async function connectWallet() {
  try {
    // The SDK automatically handles nonce requests and signature generation
    const accounts = await provider.request({
      method: 'eth_requestAccounts'
    });
    
    console.log('Connected accounts:', accounts);
    
    // All subsequent requests will also include origin verification automatically
    const balance = await provider.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest']
    });
    
    console.log('Account balance:', balance);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}
```

## Security Best Practices

1. **Store Private Keys Securely**: Never commit private keys to source control
2. **Use Environment Variables**: Store private keys in environment variables
3. **Rotate Keys Regularly**: Generate new keys periodically
4. **Validate Domain**: Ensure your domain matches exactly
5. **Handle Errors Gracefully**: Implement proper error handling for signature failures

### Environment Setup Example

```bash
# .env file
DOMAIN_VERIFICATION_PRIVATE_KEY=your-private-key-here
DOMAIN=www.example.com
```

```typescript
// Load from environment
const privateKey = process.env.DOMAIN_VERIFICATION_PRIVATE_KEY;
const domain = process.env.DOMAIN;

if (!privateKey || !domain) {
  throw new Error('Missing domain verification configuration');
}
```

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