#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const secp256k1 = require('secp256k1');
const path = require('path');

// Mock transaction data
const mockRequestData = {
  method: 'eth_sendTransaction',
  params: [
    {
      to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      value: '0xde0b6b3a7640000',
      gas: '0x5208',
      gasPrice: '0x3b9aca00',
    },
  ],
};

// Generate a mock nonce
const nonce = crypto.randomUUID();
const domain = 'www.example.com';

// Get the project root directory
let projectRoot = process.cwd();
if (projectRoot.includes('packages/client')) {
  // If we're in packages/client, go up to the project root
  projectRoot = projectRoot.replace('/packages/client', '');
}

// Check if required files exist
const privateKeyPath = path.join(projectRoot, 'domain-verification-private-key.txt');
const jwksPath = path.join(projectRoot, 'base-jwks.json');

if (!fs.existsSync(privateKeyPath)) {
  console.error('❌ Error: domain-verification-private-key.txt not found!');
  console.error(`   Expected location: ${privateKeyPath}`);
  console.error('   Please run "yarn generate-key-script" first to generate the required files.');
  process.exit(1);
}

if (!fs.existsSync(jwksPath)) {
  console.error('❌ Error: base-jwks.json not found!');
  console.error(`   Expected location: ${jwksPath}`);
  console.error('   Please run "yarn generate-key-script" first to generate the required files.');
  process.exit(1);
}

try {
  // Read the private key from file (now in hex format)
  const privateKeyHex = fs.readFileSync(privateKeyPath, 'utf8').trim();
  const privateKey = Buffer.from(privateKeyHex, 'hex');

  // Read the JWKS file to get public key
  const jwksData = JSON.parse(fs.readFileSync(jwksPath, 'utf8'));
  const publicKeyData = jwksData.keys[0];

  // Convert JWKS coordinates to public key buffer
  const x = Buffer.from(publicKeyData.x, 'base64url');
  const y = Buffer.from(publicKeyData.y, 'base64url');
  const publicKey = Buffer.concat([Buffer.from([0x04]), x, y]);

  console.log('🔑 Private Key (hex):', privateKeyHex);
  console.log('🌐 Domain:', domain);
  console.log('🎲 Nonce:', nonce);
  console.log('📝 Request Data:', JSON.stringify(mockRequestData, null, 2));

  // Create the payload to sign
  const payload = {
    domain: domain,
    nonce: nonce,
    requestData: mockRequestData,
  };

  // Serialize payload deterministically
  const serializedPayload = JSON.stringify(payload);
  console.log('\n📦 Serialized Payload:', serializedPayload);

  // Create message hash
  const messageHash = crypto.createHash('sha256').update(serializedPayload).digest();
  console.log('🔍 Message Hash:', messageHash.toString('hex'));

  // Sign the message hash
  const signature = secp256k1.ecdsaSign(messageHash, privateKey);
  const signatureHex = '0x' + signature.signature.toString('hex');
  console.log('✍️  Signature:', signatureHex);

  // Verify the signature
  const isValid = secp256k1.ecdsaVerify(signature.signature, messageHash, publicKey);
  console.log('\n✅ Signature Verification:', isValid ? 'PASSED' : 'FAILED');

  if (isValid) {
    console.log('🎉 Domain verification simulation successful!');
  } else {
    console.log('❌ Domain verification simulation failed!');
  }
} catch (error) {
  console.error('❌ Error during signature verification:', error.message);
  if (error.code === 'ENOENT') {
    console.error('   This usually means one of the required files is missing or corrupted.');
    console.error('   Please run "yarn generate-key-script" to regenerate the files.');
  }
  process.exit(1);
} 