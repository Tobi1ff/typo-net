
const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_DERIVATION_ALGORITHM = 'PBKDF2';
const HASH_ALGORITHM = 'SHA-256';
const ITERATIONS = 100000;

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: KEY_DERIVATION_ALGORITHM },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: KEY_DERIVATION_ALGORITHM,
      salt,
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    passphraseKey,
    { name: ENCRYPTION_ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptMessage(text: string, passphrase: string): Promise<{ encryptedText: string; iv: string; salt: string }> {
  const encoder = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGORITHM, iv },
    key,
    encoder.encode(text)
  );

  const encryptedArray = new Uint8Array(encryptedBuffer);
  let binary = '';
  for (let i = 0; i < encryptedArray.length; i++) {
    binary += String.fromCharCode(encryptedArray[i]);
  }

  const ivArray = new Uint8Array(iv);
  let ivBinary = '';
  for (let i = 0; i < ivArray.length; i++) {
    ivBinary += String.fromCharCode(ivArray[i]);
  }

  const saltArray = new Uint8Array(salt);
  let saltBinary = '';
  for (let i = 0; i < saltArray.length; i++) {
    saltBinary += String.fromCharCode(saltArray[i]);
  }

  return {
    encryptedText: btoa(binary),
    iv: btoa(ivBinary),
    salt: btoa(saltBinary),
  };
}

export async function decryptMessage(encryptedText: string, iv: string, salt: string, passphrase: string): Promise<string> {
  const decoder = new TextDecoder();
  
  const encryptedBinary = atob(encryptedText);
  const encryptedBuffer = new Uint8Array(encryptedBinary.length);
  for (let i = 0; i < encryptedBinary.length; i++) {
    encryptedBuffer[i] = encryptedBinary.charCodeAt(i);
  }

  const ivBinary = atob(iv);
  const ivBuffer = new Uint8Array(ivBinary.length);
  for (let i = 0; i < ivBinary.length; i++) {
    ivBuffer[i] = ivBinary.charCodeAt(i);
  }

  const saltBinary = atob(salt);
  const saltBuffer = new Uint8Array(saltBinary.length);
  for (let i = 0; i < saltBinary.length; i++) {
    saltBuffer[i] = saltBinary.charCodeAt(i);
  }
  
  const key = await deriveKey(passphrase, saltBuffer);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGORITHM, iv: ivBuffer },
      key,
      encryptedBuffer
    );
    return decoder.decode(decryptedBuffer);
  } catch (e) {
    throw new Error('Decryption failed. Incorrect passphrase?');
  }
}
