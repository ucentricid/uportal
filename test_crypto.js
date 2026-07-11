require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const RSA_PRIVATE_KEY = process.env.BACKOFFICE_RSA_PRIVATE_KEY || '';
console.log("Raw from env length:", RSA_PRIVATE_KEY.length);
console.log("Has literal \\n?", RSA_PRIVATE_KEY.includes('\\n'));
console.log("Has actual newline?", RSA_PRIVATE_KEY.includes('\n'));

const fixedKey = RSA_PRIVATE_KEY.replace(/\\n/g, '\n');

try {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update('test');
  sign.end();
  const signatureBase64 = sign.sign(fixedKey, 'base64');
  console.log("Success! Signature:", signatureBase64.substring(0, 20) + "...");
} catch (err) {
  console.error("Error signing:", err.message);
}
