/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-CRYPTOGRAPHY-26
 * ============================================================
 *
 * Central Sovereign Cryptography Engine.
 *
 * Responsibilities:
 * - Sovereign encryption and decryption.
 * - Digital signing and verification.
 * - Cryptographic hashing.
 * - Secure random generation.
 * - Key-reference based cryptographic operations.
 * - Prevent raw private-key exposure.
 * - Enforce security and authorization boundaries.
 * - Preserve cryptographic audit events.
 *
 * This engine DOES NOT store secret keys.
 * Key material remains inside SOVEREIGN-SECRETS-25 / vault.
 *
 * CRYPTOGRAPHY has NO sovereign authority.
 *
 * OWNER > STEWARD > CORE > POLICY > SECURITY
 * > IDENTITY > AUTHENTICATION > AUTHORIZATION
 * > SECRETS > CRYPTOGRAPHY
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. ALGORITHMS
 * ============================================================
 */

export type SovereignEncryptionAlgorithm =
  | "AES-256-GCM"
  | "CHACHA20-POLY1305";

export type SovereignSigningAlgorithm =
  | "ED25519"
  | "ECDSA-P256"
  | "RSA-PSS-SHA256";

export type SovereignHashAlgorithm =
  | "SHA-256"
  | "SHA-384"
  | "SHA-512";

/* ============================================================
 * 2. OPERATIONS
 * ============================================================
 */

export type SovereignCryptographyOperation =
  | "ENCRYPT"
  | "DECRYPT"
  | "SIGN"
  | "VERIFY"
  | "HASH"
  | "RANDOM";

/* ============================================================
 * 3. CONTEXT
 * ============================================================
 */

export interface SovereignCryptographyContext {
  actorId: string;

  authority:
    | "OWNER"
    | "STEWARD"
    | "CORE"
    | "SYSTEM"
    | "AGENT"
    | "CAPABILITY";

  authenticated: boolean;

  policyChecked: boolean;

  securityChecked: boolean;

  authorizationChecked: boolean;

  permissions: string[];

  sessionId?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 4. KEY REFERENCE
 * ============================================================
 */

export interface SovereignCryptographicKeyReference {
  secretId: string;

  version?: number;

  purpose:
    | "ENCRYPTION"
    | "SIGNING"
    | "VERIFICATION";

  algorithm:
    | SovereignEncryptionAlgorithm
    | SovereignSigningAlgorithm;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 5. SECRET BRIDGE
 * ============================================================
 */

export interface SovereignCryptographySecretBridge {
  useKey<T>(
    keyReference: SovereignCryptographicKeyReference,
    operation: SovereignCryptographyOperation,
    handler: (
      keyMaterial: Uint8Array
    ) => Promise<T>
  ): Promise<T>;
}

/* ============================================================
 * 6. CRYPTO PROVIDER
 * ============================================================
 */

export interface SovereignCryptographyProvider {
  encrypt(input: {
    algorithm: SovereignEncryptionAlgorithm;
    key: Uint8Array;
    plaintext: Uint8Array;
    additionalData?: Uint8Array;
  }): Promise<{
    ciphertext: Uint8Array;
    iv: Uint8Array;
    authenticationTag?: Uint8Array;
  }>;

  decrypt(input: {
    algorithm: SovereignEncryptionAlgorithm;
    key: Uint8Array;
    ciphertext: Uint8Array;
    iv: Uint8Array;
    authenticationTag?: Uint8Array;
    additionalData?: Uint8Array;
  }): Promise<Uint8Array>;

  sign(input: {
    algorithm: SovereignSigningAlgorithm;
    key: Uint8Array;
    data: Uint8Array;
  }): Promise<Uint8Array>;

  verify(input: {
    algorithm: SovereignSigningAlgorithm;
    key: Uint8Array;
    data: Uint8Array;
    signature: Uint8Array;
  }): Promise<boolean>;

  hash(input: {
    algorithm: SovereignHashAlgorithm;
    data: Uint8Array;
  }): Promise<Uint8Array>;

  randomBytes(
    length: number
  ): Promise<Uint8Array>;
}

/* ============================================================
 * 7. ACCESS VALIDATOR
 * ============================================================
 */

export interface SovereignCryptographyAccessValidator {
  validate(
    operation: SovereignCryptographyOperation,
    context: SovereignCryptographyContext,
    keyReference?: SovereignCryptographicKeyReference
  ): {
    allowed: boolean;
    reason?: string;
  };
}

/* ============================================================
 * 8. EVENT BUS
 * ============================================================
 */

export interface SovereignCryptographyEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    actorId?: string;

    keyReference?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 9. AUDIT
 * ============================================================
 */

export interface SovereignCryptographyAudit {
  record(
    operation: string,
    subjectId: string | undefined,
    result:
      | "SUCCESS"
      | "FAILED"
      | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/* ============================================================
 * 10. ENCRYPTED PAYLOAD
 * ============================================================
 */

export interface SovereignEncryptedPayload {
  algorithm: SovereignEncryptionAlgorithm;

  keyReference: {
    secretId: string;
    version?: number;
  };

  ciphertext: Uint8Array;

  iv: Uint8Array;

  authenticationTag?: Uint8Array;

  createdAt: string;
}

/* ============================================================
 * 11. SIGNATURE RESULT
 * ============================================================
 */

export interface SovereignSignatureResult {
  algorithm: SovereignSigningAlgorithm;

  keyReference: {
    secretId: string;
    version?: number;
  };

  signature: Uint8Array;

  createdAt: string;
}

/* ============================================================
 * 12. CRYPTOGRAPHY ENGINE
 * ============================================================
 */

export class SovereignCryptographyEngine {
  public readonly id =
    "SOVEREIGN-CRYPTOGRAPHY-26";

  public readonly version =
    "1.0.0";

  private provider?:
    SovereignCryptographyProvider;

  private secretBridge?:
    SovereignCryptographySecretBridge;

  private accessValidator?:
    SovereignCryptographyAccessValidator;

  private eventBus?:
    SovereignCryptographyEventBus;

  private audit?:
    SovereignCryptographyAudit;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setProvider(
    provider: SovereignCryptographyProvider
  ): void {
    this.provider = provider;
  }

  setSecretBridge(
    bridge: SovereignCryptographySecretBridge
  ): void {
    this.secretBridge = bridge;
  }

  setAccessValidator(
    validator: SovereignCryptographyAccessValidator
  ): void {
    this.accessValidator = validator;
  }

  setEventBus(
    eventBus: SovereignCryptographyEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: SovereignCryptographyAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * ENCRYPT
   * ==========================================================
   */

  async encrypt(
    plaintext: Uint8Array,
    keyReference: SovereignCryptographicKeyReference,
    context: SovereignCryptographyContext,
    additionalData?: Uint8Array
  ): Promise<SovereignEncryptedPayload> {
    this.requireAccess(
      "ENCRYPT",
      context,
      keyReference
    );

    if (
      keyReference.purpose !==
      "ENCRYPTION"
    ) {
      throw new Error(
        "Key reference is not authorized for encryption."
      );
    }

    if (
      !this.isEncryptionAlgorithm(
        keyReference.algorithm
      )
    ) {
      throw new Error(
        "Invalid encryption algorithm."
      );
    }

    const algorithm =
      keyReference.algorithm;

    try {
      const result =
        await this.requireSecretBridge()
          .useKey(
            keyReference,
            "ENCRYPT",
            async (key) =>
              this.requireProvider()
                .encrypt({
                  algorithm,
                  key,
                  plaintext,
                  additionalData,
                })
          );

      const payload:
        SovereignEncryptedPayload = {
        algorithm,

        keyReference: {
          secretId:
            keyReference.secretId,

          version:
            keyReference.version,
        },

        ciphertext:
          result.ciphertext,

        iv:
          result.iv,

        authenticationTag:
          result.authenticationTag,

        createdAt:
          this.now(),
      };

      await this.publish(
        "cryptography.encrypted",
        context,
        keyReference,
        {
          algorithm,
          bytes:
            plaintext.byteLength,
        }
      );

      await this.recordAudit(
        "cryptography.encrypt",
        keyReference.secretId,
        "SUCCESS",
        {
          actorId:
            context.actorId,

          algorithm,
        }
      );

      return payload;
    } catch (error) {
      await this.recordAudit(
        "cryptography.encrypt",
        keyReference.secretId,
        "FAILED",
        {
          actorId:
            context.actorId,

          algorithm,
        }
      );

      throw error;
    }
  }

  /* ==========================================================
   * DECRYPT
   * ==========================================================
   */

  async decrypt(
    payload: SovereignEncryptedPayload,
    keyReference: SovereignCryptographicKeyReference,
    context: SovereignCryptographyContext,
    additionalData?: Uint8Array
  ): Promise<Uint8Array> {
    this.requireAccess(
      "DECRYPT",
      context,
      keyReference
    );

    if (
      keyReference.purpose !==
      "ENCRYPTION"
    ) {
      throw new Error(
        "Key reference is not authorized for decryption."
      );
    }

    if (
      payload.keyReference.secretId !==
      keyReference.secretId
    ) {
      throw new Error(
        "Encrypted payload key reference mismatch."
      );
    }

    if (
      payload.algorithm !==
      keyReference.algorithm
    ) {
      throw new Error(
        "Encrypted payload algorithm mismatch."
      );
    }

    try {
      const plaintext =
        await this.requireSecretBridge()
          .useKey(
            keyReference,
            "DECRYPT",
            async (key) =>
              this.requireProvider()
                .decrypt({
                  algorithm:
                    payload.algorithm,

                  key,

                  ciphertext:
                    payload.ciphertext,

                  iv:
                    payload.iv,

                  authenticationTag:
                    payload.authenticationTag,

                  additionalData,
                })
          );

      await this.publish(
        "cryptography.decrypted",
        context,
        keyReference,
        {
          algorithm:
            payload.algorithm,

          bytes:
            plaintext.byteLength,
        }
      );

      await this.recordAudit(
        "cryptography.decrypt",
        keyReference.secretId,
        "SUCCESS",
        {
          actorId:
            context.actorId,

          algorithm:
            payload.algorithm,
        }
      );

      return plaintext;
    } catch (error) {
      await this.recordAudit(
        "cryptography.decrypt",
        keyReference.secretId,
        "FAILED",
        {
          actorId:
            context.actorId,

          algorithm:
            payload.algorithm,
        }
      );

      throw error;
    }
  }

  /* ==========================================================
   * SIGN
   * ==========================================================
   */

  async sign(
    data: Uint8Array,
    keyReference: SovereignCryptographicKeyReference,
    context: SovereignCryptographyContext
  ): Promise<SovereignSignatureResult> {
    this.requireAccess(
      "SIGN",
      context,
      keyReference
    );

    if (
      keyReference.purpose !==
      "SIGNING"
    ) {
      throw new Error(
        "Key reference is not authorized for signing."
      );
    }

    if (
      !this.isSigningAlgorithm(
        keyReference.algorithm
      )
    ) {
      throw new Error(
        "Invalid signing algorithm."
      );
    }

    const algorithm =
      keyReference.algorithm;

    try {
      const signature =
        await this.requireSecretBridge()
          .useKey(
            keyReference,
            "SIGN",
            async (key) =>
              this.requireProvider()
                .sign({
                  algorithm,
                  key,
                  data,
                })
          );

      const result:
        SovereignSignatureResult = {
        algorithm,

        keyReference: {
          secretId:
            keyReference.secretId,

          version:
            keyReference.version,
        },

        signature,

        createdAt:
          this.now(),
      };

      await this.publish(
        "cryptography.signed",
        context,
        keyReference,
        {
          algorithm,
          bytes:
            data.byteLength,
        }
      );

      await this.recordAudit(
        "cryptography.sign",
        keyReference.secretId,
        "SUCCESS",
        {
          actorId:
            context.actorId,

          algorithm,
        }
      );

      return result;
    } catch (error) {
      await this.recordAudit(
        "cryptography.sign",
        keyReference.secretId,
        "FAILED",
        {
          actorId:
            context.actorId,

          algorithm,
        }
      );

      throw error;
    }
  }

  /* ==========================================================
   * VERIFY
   * ==========================================================
   */

  async verify(
    data: Uint8Array,
    signature: SovereignSignatureResult,
    keyReference: SovereignCryptographicKeyReference,
    context: SovereignCryptographyContext
  ): Promise<boolean> {
    this.requireAccess(
      "VERIFY",
      context,
      keyReference
    );

    if (
      keyReference.purpose !==
        "VERIFICATION" &&
      keyReference.purpose !==
        "SIGNING"
    ) {
      throw new Error(
        "Key reference is not authorized for verification."
      );
    }

    if (
      !this.isSigningAlgorithm(
        keyReference.algorithm
      )
    ) {
      throw new Error(
        "Invalid verification algorithm."
      );
    }

    if (
      signature.algorithm !==
      keyReference.algorithm
    ) {
      throw new Error(
        "Signature algorithm mismatch."
      );
    }

    const algorithm =
      keyReference.algorithm;

    const valid =
      await this.requireSecretBridge()
        .useKey(
          keyReference,
          "VERIFY",
          async (key) =>
            this.requireProvider()
              .verify({
                algorithm,
                key,
                data,
                signature:
                  signature.signature,
              })
        );

    await this.publish(
      valid
        ? "cryptography.signature.valid"
        : "cryptography.signature.invalid",
      context,
      keyReference,
      {
        algorithm,
      }
    );

    await this.recordAudit(
      "cryptography.verify",
      keyReference.secretId,
      valid
        ? "SUCCESS"
        : "FAILED",
      {
        actorId:
          context.actorId,

        algorithm,
      }
    );

    return valid;
  }

  /* ==========================================================
   * HASH
   * ==========================================================
   */

  async hash(
    data: Uint8Array,
    algorithm: SovereignHashAlgorithm,
    context: SovereignCryptographyContext
  ): Promise<Uint8Array> {
    this.requireAccess(
      "HASH",
      context
    );

    const digest =
      await this.requireProvider()
        .hash({
          algorithm,
          data,
        });

   
