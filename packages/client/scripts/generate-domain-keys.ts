#!/usr/bin/env node

import { secp256k1 } from '@noble/curves/secp256k1';
import { randomBytes } from '@noble/hashes/utils';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Base64URL encoding function
function base64url(buffer: Uint8Array): string {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateDomainVerificationKeys() {
  // Generate a random private key
  const privateKeyBytes = randomBytes(32);
  const privateKey = Buffer.from(privateKeyBytes).toString('hex');
  
  // Get the uncompressed public key from the private key
  const publicKey = secp256k1.getPublicKey(privateKeyBytes, false); // false = uncompressed
  
  // Extract x and y coordinates from the public key
  // secp256k1 uncompressed public key is 65 bytes: 1 byte prefix + 32 bytes x + 32 bytes y
  const x = base64url(publicKey.slice(1, 33));
  const y = base64url(publicKey.slice(33));
  
  // Create the JWK
  const jwk = {
    kty: 'EC',
    crv: 'secp256k1',
    x,
    y,
    use: 'sig',
    kid: 'base-domain-verification',
    alg: 'ES256K'
  };
  
  // Create the JWKS
  const jwks = {
    version: "1.0",
    keys: [jwk]
  };
  
  return { jwks, privateKey };
}

function main() {
  try {
    const { jwks, privateKey } = generateDomainVerificationKeys();
    
    // Try to get the project root by going up from the current directory
    let projectRoot = process.cwd();
    if (projectRoot.includes('packages/client')) {
      // If we're in packages/client, go up to the project root
      projectRoot = projectRoot.replace('/packages/client', '');
    }
    
    // Write the JWKS file in the project root directory
    const jwksPath = join(projectRoot, 'base-jwks.json');
    writeFileSync(jwksPath, JSON.stringify(jwks, null, 2));
    
    // Write the private key to a separate file in the project root directory
    const privateKeyPath = join(projectRoot, 'domain-verification-private-key.txt');
    writeFileSync(privateKeyPath, privateKey);
    
  } catch (error) {
    process.exit(1);
  }
}

main(); 