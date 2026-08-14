/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-KEY-MANAGEMENT-27
 * ============================================================
 *
 * Central Sovereign Key Management Engine.
 *
 * Responsibilities:
 * - Manage cryptographic key lifecycle.
 * - Generate sovereign cryptographic keys.
 * - Maintain key versions.
 * - Activate, rotate, disable and revoke keys.
 * - Enforce key purposes and algorithms.
 * - Prevent plaintext private-key exposure.
 * - Integrate with SOVEREIGN-SECRETS-25.
 * - Integrate with SOVEREIGN-CRYPTOGRAPHY-26.
 * - Preserve key-management audit events.
 *
 * KEY MANAGEMENT has NO sovereign authority.
 *
 * OWNER > STEWARD > CORE > POLICY > SECURITY
 * > IDENTITY > AUTHENTICATION > AUTHORIZATION
 * > SECRETS > CRYPTOGRAPHY > KEY MANAGEMENT
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. KEY PURPOSE
 * ============================================================
 */

export type SovereignKeyPurpose =
  | "ENCRYPTION"
  | "SIGNING"
  | "VERIFICATION"
  | "AUTHENTICATION"
  | "DATABASE"
  | "BACKUP"
  | "SESSION"
  | "SYSTEM"
  | "CUSTOM";

/* ============================================================
 * 2. KEY ALGORITHM
 * ============================================================
 */

export type SovereignKeyAlgorithm =
  | "AES-256-GCM"
  | "CHACHA20-POLY1305"
  | "ED25519"
  | "ECDSA-P256"
  | "RSA-PSS-SHA256";

/* ============================================================
 * 3. KEY STATUS
 * ============================================================
 */

export type SovereignKeyStatus =
  | "PENDING"
  | "ACTIVE"
  | "ROTATING"
  | "DISABLED"
  | "EXPIRED"
  | "REVOKED"
  | "DESTROYED";

/* ============================================================
 * 4. OPERATIONS
 * ============================================================
 */

export type SovereignKeyManagementOperation =
  | "CREATE"
  | "READ"
  | "ACTIVATE"
  | "ROTATE"
  | "DISABLE"
  | "REVOKE"
  | "DESTROY"
  | "LIST";

/* ============================================================
 * 5. KEY VERSION
 * ============================================================
 */

export interface SovereignKeyVersion {
  version: number;

  secretId: string;

  status:
    | "ACTIVE"
    | "INACTIVE"
    | "REVOKED"
    | "DESTROYED";

  createdAt: string;

  activatedAt?: string;

  retiredAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. KEY RECORD
 * ============================================================
 */

export interface SovereignKeyRecord {
  id: string;

  name: string;

  purpose: SovereignKeyPurpose;

  algorithm: SovereignKeyAlgorithm;

  status: SovereignKeyStatus;

  currentVersion: number;

  versions: SovereignKeyVersion[];

  ownerId: string;

  createdBy: string;

  createdAt: string;

  updatedAt: string;

  activatedAt?: string;

  rotatedAt?: string;

  expiresAt?: string;

  disabledAt?: string;

  revokedAt?: string;

  destroyedAt?: string;

  rotationIntervalDays?: number;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. CREATE REQUEST
 * ============================================================
 */

export interface SovereignKeyCreateRequest {
  id?: string;

  name: string;

  purpose: SovereignKeyPurpose;

  algorithm: SovereignKeyAlgorithm;

  ownerId: string;

  expiresAt?: string;

  rotationIntervalDays?: number;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 8. CONTEXT
 * ============================================================
 */

export interface SovereignKeyManagementContext {
  actorId: string;

  authority:
    | "OWNER"
    | "STEWARD"
    | "CORE"
    | "SYSTEM";

  authenticated: boolean;

  policyChecked: boolean;

  securityChecked: boolean;

  authorizationChecked: boolean;

  permissions: string[];

  sessionId?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 9. KEY GENERATOR
 * ============================================================
 */

export interface SovereignKeyGenerator {
  generate(
    algorithm: SovereignKeyAlgorithm,
    purpose: SovereignKeyPurpose
  ): Promise<{
    privateMaterial: Uint8Array;

    publicMaterial?: Uint8Array;

    metadata?: Record<string, unknown>;
  }>;
}

/* ============================================================
 * 10. SECRETS BRIDGE
 * ============================================================
 */

export interface SovereignKeySecretsBridge {
  storeKey(input: {
    secretId: string;

    name: string;

    value: Uint8Array;

    ownerId: string;

    createdBy: string;

    metadata?: Record<string, unknown>;
  }): Promise<void>;

  revokeKey(
    secretId: string
  ): Promise<void>;

  destroyKey(
    secretId: string
  ): Promise<void>;

  exists(
    secretId: string
  ): Promise<boolean>;
}

/* ============================================================
 * 11. STORE
 * ============================================================
 */

export interface SovereignKeyManagementStore {
  create(
    key: SovereignKeyRecord
  ): Promise<void>;

  update(
    key: SovereignKeyRecord
  ): Promise<void>;

  get(
    keyId: string
  ): Promise<SovereignKeyRecord | undefined>;

  list():
    Promise<SovereignKeyRecord[]>;
}

/* ============================================================
 * 12. ACCESS VALIDATOR
 * ============================================================
 */

export interface SovereignKeyManagementAccessValidator {
  validate(
    operation: SovereignKeyManagementOperation,
    context: SovereignKeyManagementContext,
    key?: SovereignKeyRecord
  ): {
    allowed: boolean;
    reason?: string;
  };
}

/* ============================================================
 * 13. EVENT BUS
 * ============================================================
 */

export interface SovereignKeyManagementEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    keyId?: string;

    actorId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 14. AUDIT
 * ============================================================
 */

export interface SovereignKeyManagementAudit {
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
 * 15. ENGINE
 * ============================================================
 */

export class SovereignKeyManagementEngine {
  public readonly id =
    "SOVEREIGN-KEY-MANAGEMENT-27";

  public readonly version =
    "1.0.0";

  private generator?:
    SovereignKeyGenerator;

  private secrets?:
    SovereignKeySecretsBridge;

  private store?:
    SovereignKeyManagementStore;

  private accessValidator?:
    SovereignKeyManagementAccessValidator;

  private eventBus?:
    SovereignKeyManagementEventBus;

  private audit?:
    SovereignKeyManagementAudit;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setGenerator(
    generator: SovereignKeyGenerator
  ): void {
    this.generator = generator;
  }

  setSecretsBridge(
    secrets: SovereignKeySecretsBridge
  ): void {
    this.secrets = secrets;
  }

  setStore(
    store: SovereignKeyManagementStore
  ): void {
    this.store = store;
  }

  setAccessValidator(
    validator: SovereignKeyManagementAccessValidator
  ): void {
    this.accessValidator = validator;
  }

  setEventBus(
    eventBus: SovereignKeyManagementEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: SovereignKeyManagementAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * CREATE KEY
   * ==========================================================
   */

  async create(
    request: SovereignKeyCreateRequest,
    context: SovereignKeyManagementContext
  ): Promise<SovereignKeyRecord> {
    this.requireAccess(
      "CREATE",
      context
    );

    this.validateCreateRequest(
      request
    );

    const store =
      this.requireStore();

    const keyId =
      request.id ??
      this.createId("KEY");

    if (
      await store.get(keyId)
    ) {
      throw new Error(
        `Sovereign key already exists: ${keyId}`
      );
    }

    const generated =
      await this.requireGenerator()
        .generate(
          request.algorithm,
          request.purpose
        );

    this.validateGeneratedMaterial(
      generated.privateMaterial
    );

    const secretId =
      `${keyId}-V1`;

    await this.requireSecrets()
      .storeKey({
        secretId,

        name:
          `${request.name}-V1`,

        value:
          generated.privateMaterial,

        ownerId:
          request.ownerId,

        createdBy:
          context.actorId,

        metadata: {
          keyId,

          version: 1,

          algorithm:
            request.algorithm,

          purpose:
            request.purpose,
        },
      });

    /*
     * Never retain generated private material
     * inside the key-management record.
     */
    generated.privateMaterial.fill(0);

    const now =
      this.now();

    const key:
      SovereignKeyRecord = {
      id:
        keyId,

      name:
        request.name,

      purpose:
        request.purpose,

      algorithm:
        request.algorithm,

      status:
        "PENDING",

      currentVersion:
        1,

      versions: [
        {
          version: 1,

          secretId,

          status:
            "INACTIVE",

          createdAt:
            now,

          metadata:
            generated.metadata,
        },
      ],

      ownerId:
        request.ownerId,

      createdBy:
        context.actorId,

      createdAt:
        now,

      updatedAt:
        now,

      expiresAt:
        request.expiresAt,

      rotationIntervalDays:
        request.rotationIntervalDays,

      metadata:
        request.metadata,
    };

    await store.create(key);

    await this.publish(
      "key.created",
      key.id,
      context.actorId,
      {
        algorithm:
          key.algorithm,

        purpose:
          key.purpose,

        version:
          key.currentVersion,
      }
    );

    await this.recordAudit(
      "key.create",
      key.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,

        algorithm:
          key.algorithm,

        purpose:
          key.purpose,
      }
    );

    return key;
  }

  /* ==========================================================
   * ACTIVATE
   * ==========================================================
   */

  async activate(
    keyId: string,
    context: SovereignKeyManagementContext
  ): Promise<SovereignKeyRecord> {
    const key =
      await this.requireKey(
        keyId
      );

    this.requireAccess(
      "ACTIVATE",
      context,
      key
    );

    if (
      key.status === "REVOKED" ||
      key.status === "DESTROYED"
    ) {
      throw new Error(
        "Revoked or destroyed key cannot be activated."
      );
    }

    const current =
      this.requireCurrentVersion(
        key
      );

    if (
      !(await this.requireSecrets()
        .exists(
          current.secretId
        ))
    ) {
      throw new Error(
        "Key material is unavailable."
      );
    }

    current.status =
      "ACTIVE";

    current.activatedAt =
      this.now();

    key.status =
      "ACTIVE";

    key.activatedAt =
      current.activatedAt;

    key.updatedAt =
      current.activatedAt;

    await this.requireStore()
      .update(key);

    await this.publish(
      "key.activated",
      key.id,
      context.actorId,
      {
        version:
          current.version,
      }
    );

    return key;
  }

  /* ==========================================================
   * ROTATE
   * ==========================================================
   */

  async rotate(
    keyId: string,
    context: SovereignKeyManagementContext
  ): Promise<SovereignKeyRecord> {
    const key =
      await this.requireKey(
        keyId
      );

    this.requireAccess(
      "ROTATE",
      context,
      key
    );

    if (
      key.status !==
      "ACTIVE"
    ) {
      throw new Error(
        "Only active keys may be rotated."
      );
    }

    key.status =
      "ROTATING";

    key.updatedAt =
      this.now();

    await this.requireStore()
      .update(key);

    const generated =
      await this.requireGenerator()
        .generate(
          key.algorithm,
          key.purpose
        );

    this.validateGeneratedMaterial(
      generated.privateMaterial
    );

    const newVersion =
      key.currentVersion + 1;

    const secretId =
      `${key.id}-V${newVersion}`;

    try {
      await this.requireSecrets()
        .storeKey({
          secretId,

          name:
            `${key.name}-V${newVersion}`,

          value:
            generated.privateMaterial,

          ownerId:
            key.ownerId,

          createdBy:
            context.actorId,

          metadata: {
            keyId:
              key.id,

            version:
              newVersion,

            algorithm:
              key.algorithm,

            purpose:
              key.purpose,
          },
        });

      generated.privateMaterial.fill(0);

      const oldVersion =
        this.requireCurrentVersion(
          key
        );

      oldVersion.status =
        "INACTIVE";

      oldVersion.retiredAt =
        this.now();

      const now =
        this.now();

      key.versions.push({
        version:
          newVersion,

        secretId,

        status:
          "ACTIVE",

        createdAt:
          now,

        activatedAt:
          now,

        metadata:
          generated.metadata,
      });

      key.currentVersion =
        newVersion;

      key.status =
        "ACTIVE";

      key.rotatedAt =
        now;

      key.updatedAt =
        now;

      await this.requireStore()
        .update(key);

      await this.publish(
        "key.rotated",
        key.id,
        context.actorId,
        {
          previousVersion:
            oldVersion.version,

          currentVersion:
            newVersion,
        }
      );

      await this.recordAudit(
        "key.rotate",
        key.id,
        "SUCCESS",
        {
          actorId:
            context.actorId,

          version:
            newVersion,
        }
      );

      return key;
    } catch (error) {
      generated.privateMaterial.fill(0);

      key.status =
        "ACTIVE";

      key.updatedAt =
        this.now();

      await this.requireStore()
        .update(key);

      await this.recordAudit(
        "key.rotate",
        key.id,
        "FAILED",
        {
          actorId:
            context.actorId,
        }
      );

      throw error;
    }
  }

  /* ==========================================================
   * DISABLE
  
