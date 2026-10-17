// ============================================
// Net-On API — AES-256-GCM Encryption Service
// ============================================
// Provides authenticated encryption and decryption
// for infrastructure passwords and sensitive tokens.
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly config: ConfigService) {
    const rawSecret =
      this.config.get<string>('ENCRYPTION_SECRET') ||
      this.config.get<string>('JWT_ACCESS_SECRET') ||
      'net-on-default-encryption-secret-key-32-bytes!';

    // Derive a fixed 32-byte key using SHA-256
    this.key = crypto.createHash('sha256').update(rawSecret).digest();
  }

  /**
   * Encrypt a plaintext string using AES-256-GCM.
   * Returns a colon-delimited string: "iv:authTag:ciphertext" (all in hex).
   */
  encrypt(plaintext: string): string {
    if (!plaintext) return '';

    // 12-byte IV is standard and recommended for AES-GCM
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt an AES-256-GCM encrypted string.
   * Expects format: "iv:authTag:ciphertext" (all in hex).
   * If decryption fails or data was not encrypted, falls back safely or throws.
   */
  decrypt(encryptedData: string): string {
    if (!encryptedData) return '';

    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      // If data is not in expected encrypted format, return as is (for backwards compatibility)
      return encryptedData;
    }

    const [ivHex, authTagHex, ciphertextHex] = parts;

    try {
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (err: any) {
      this.logger.error(`Decryption failed: ${err.message}`);
      throw new Error('Failed to decrypt data — authentication tag mismatch or corrupted ciphertext');
    }
  }

  /**
   * Check if a string appears to be encrypted with this service format.
   */
  isEncrypted(data: string): boolean {
    if (!data) return false;
    const parts = data.split(':');
    return parts.length === 3 && parts[0].length === 24 && parts[1].length === 32;
  }
}
