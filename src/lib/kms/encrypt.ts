import { GenerateDataKeyCommand, DecryptCommand } from "@aws-sdk/client-kms";
import { kmsClient, KMS_KEY_ID } from "./client";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

interface EncryptResult {
  encrypted: Buffer;
  encryptedDataKey: string;
  iv: string;
}

/**
 * Envelope encryption using AWS KMS
 * 1. Generate data key from KMS
 * 2. Encrypt document with data key (AES-256-GCM)
 * 3. Return encrypted document + encrypted data key + IV
 */
export async function encryptDocument(data: Buffer): Promise<EncryptResult> {
  const command = new GenerateDataKeyCommand({
    KeyId: KMS_KEY_ID,
    KeySpec: "AES_256",
  });

  const { Plaintext, CiphertextBlob } = await kmsClient.send(command);

  if (!Plaintext || !CiphertextBlob) {
    throw new Error("Failed to generate data key from KMS");
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(Plaintext), iv);

  const encrypted = Buffer.concat([
    cipher.update(data),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  return {
    encrypted,
    encryptedDataKey: Buffer.from(CiphertextBlob).toString("base64"),
    iv: iv.toString("base64"),
  };
}

/**
 * Decrypt document using envelope decryption
 * 1. Decrypt data key using KMS
 * 2. Decrypt document with data key (AES-256-GCM)
 */
export async function decryptDocument(
  encrypted: Buffer,
  encryptedDataKey: string,
  ivBase64: string
): Promise<Buffer> {
  const command = new DecryptCommand({
    CiphertextBlob: Buffer.from(encryptedDataKey, "base64"),
  });

  const { Plaintext } = await kmsClient.send(command);
  if (!Plaintext) {
    throw new Error("Failed to decrypt data key from KMS");
  }

  const iv = Buffer.from(ivBase64, "base64");

  // Separate auth tag (last 16 bytes) from ciphertext
  const authTag = encrypted.subarray(encrypted.length - 16);
  const ciphertext = encrypted.subarray(0, encrypted.length - 16);

  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(Plaintext), iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
