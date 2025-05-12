// utils/encryption.util.js

const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV = process.env.IV;

const encrypt = (text) => {
  if (!text) return null;
  
  // Handle the case where text is an array or object
  if (typeof text !== 'string') {
    if (Array.isArray(text)) {
      console.warn('Warning: Trying to encrypt an array. Converting to string.');
      text = text[0]; // Use first element if it's an array
      if (typeof text !== 'string') {
        text = String(text);
      }
    } else if (typeof text === 'object') {
      console.warn('Warning: Trying to encrypt an object. Converting to string.');
      text = String(text);
    } else {
      text = String(text);
    }
  }

  if (!ENCRYPTION_KEY || !IV) {
    throw new Error('ENCRYPTION_KEY or IV is not set in the environment variables');
  }

  const ivBuffer = Buffer.from(IV, 'hex');
  const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');

  if (ivBuffer.length !== 16) {
    throw new Error('IV must be 16 bytes');
  }
  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes');
  }

  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, ivBuffer);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  
  if (!ENCRYPTION_KEY || !IV) {
    throw new Error('ENCRYPTION_KEY or IV is not set in the environment variables');
  }

  const ivBuffer = Buffer.from(IV, 'hex');
  const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');

  if (ivBuffer.length !== 16) {
    throw new Error('IV must be 16 bytes');
  }
  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes');
  }

  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

const safeDecrypt = (value) => {
  try {
    return value ? decrypt(value) : null;
  } catch (err) {
    console.error('❌ Decryption failed:', err);
    return null;
  }
};

const safeEncrypt = (value) => {
  try {
    return value ? encrypt(value) : null;
  } catch (err) {
    console.error('❌ Encryption failed:', err);
    return null;
  }
};

module.exports = {
  encrypt,
  decrypt,
  safeDecrypt,
  safeEncrypt
};