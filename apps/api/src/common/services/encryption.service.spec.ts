// ============================================
// Net-On API — Encryption Service Unit Tests
// ============================================

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultVal?: string) => {
              if (key === 'ENCRYPTION_SECRET') return 'test-super-secret-key-at-least-32-chars-long!';
              return defaultVal;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should encrypt plaintext into IV:AuthTag:Ciphertext format', () => {
    const plaintext = 'MikroTikSuperSecretPassword123!';
    const encrypted = service.encrypt(plaintext);

    expect(encrypted).toBeDefined();
    expect(encrypted).not.toEqual(plaintext);
    expect(service.isEncrypted(encrypted)).toBe(true);

    const parts = encrypted.split(':');
    expect(parts.length).toBe(3);
    expect(parts[0].length).toBe(24); // 12 bytes = 24 hex chars
    expect(parts[1].length).toBe(32); // 16 bytes = 32 hex chars
  });

  it('should successfully decrypt encrypted ciphertext back to plaintext', () => {
    const original = 'RouterOS#Secret@2026';
    const encrypted = service.encrypt(original);
    const decrypted = service.decrypt(encrypted);

    expect(decrypted).toEqual(original);
  });

  it('should produce different ciphertexts for identical plaintext due to random IV', () => {
    const plaintext = 'ConsistentPassword123';
    const enc1 = service.encrypt(plaintext);
    const enc2 = service.encrypt(plaintext);

    expect(enc1).not.toEqual(enc2);
    expect(service.decrypt(enc1)).toEqual(plaintext);
    expect(service.decrypt(enc2)).toEqual(plaintext);
  });

  it('should throw when ciphertext has been tampered with', () => {
    const original = 'ValidPayload';
    const encrypted = service.encrypt(original);
    const parts = encrypted.split(':');

    // Tamper with ciphertext
    const tampered = `${parts[0]}:${parts[1]}:badc0de12345`;

    expect(() => service.decrypt(tampered)).toThrow();
  });

  it('should handle empty strings gracefully', () => {
    expect(service.encrypt('')).toBe('');
    expect(service.decrypt('')).toBe('');
  });
});
