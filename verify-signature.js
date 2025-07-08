const crypto = require('crypto');
const fs = require('fs');
const secp256k1 = require('secp256k1');

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

// Read the private key from file
const privateKeyBase64 = fs.readFileSync('./domain-verification-private-key.txt', 'utf8').trim();
const privateKey = Buffer.from(privateKeyBase64, 'base64');

// Read the JWKS file to get public key
const jwksData = JSON.parse(fs.readFileSync('./base-jwks.json', 'utf8'));
const publicKeyData = jwksData.keys[0];

// Convert JWKS coordinates to public key buffer
const x = Buffer.from(publicKeyData.x, 'base64url');
const y = Buffer.from(publicKeyData.y, 'base64url');
const publicKey = Buffer.concat([Buffer.from([0x04]), x, y]);

console.log('🔑 Private Key:', privateKeyBase64);
console.log('�� Domain:', domain);
console.log('🎲 Nonce:', nonce);
console.log('📝 Request Data:', JSON.stringify(mockRequestData, null, 2));

// Create the payload to sign
const payload = {
  domain: domain,
  nonce: nonce,
  requestData: mockRequestData,
};

// Serialize payload deterministically
const serializedPayload = JSON.stringify(payload, Object.keys(payload).sort());
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