import { createServer } from 'node:http';
import { generateKeyPairSync, createPublicKey } from 'node:crypto';
import jwt from 'jsonwebtoken';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const jwk = createPublicKey(publicKey).export({ format: 'jwk' });
const jwks = {
  keys: [
    {
      ...jwk,
      alg: 'RS256',
      kid: 'qubito-smoke-key',
      use: 'sig',
    },
  ],
};

const server = createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(jwks));
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Could not start JWKS server');

process.env.ENTITLEMENTS_JWKS_URL = `http://127.0.0.1:${address.port}/jwks.json`;
process.env.ENTITLEMENTS_JWT_SECRET = 'legacy-smoke-secret';

const { verifyEntitlementsTokenAsync } = await import('../src/lib/entitlements.ts');

const now = Math.floor(Date.now() / 1000);
const token = jwt.sign(
  {
    sub: 'smoke-user',
    customerId: 'smoke-customer',
    entitlements: ['qubito.apprentice'],
    aud: 'qubito',
    iss: 'pixelgrimoire-entitlements',
    iat: now,
    exp: now + 600,
  },
  privateKey,
  {
    algorithm: 'RS256',
    keyid: 'qubito-smoke-key',
  }
);

const payload = await verifyEntitlementsTokenAsync(token, 'qubito');
if (payload.sub !== 'smoke-user') throw new Error('Unexpected token subject');
if (!payload.entitlements.includes('qubito.apprentice')) throw new Error('Missing entitlement');

await new Promise((resolve) => server.close(resolve));
console.log('qubito entitlements jwks smoke ok');
