// ============================================
// Net-On API — Password Service
// ============================================
// Argon2id password hashing with secure defaults.
// ============================================

import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  private readonly hashOptions: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 65536,   // 64 MB
    timeCost: 3,         // 3 iterations
    parallelism: 4,      // 4 parallel threads
  };

  /**
   * Hash a plain-text password with Argon2id.
   */
  async hash(password: string): Promise<string> {
    return argon2.hash(password, this.hashOptions);
  }

  /**
   * Verify a plain-text password against a stored hash.
   */
  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /**
   * Check if a hash needs to be re-hashed (e.g., cost factors changed).
   */
  needsRehash(hash: string): boolean {
    return argon2.needsRehash(hash, this.hashOptions);
  }
}
