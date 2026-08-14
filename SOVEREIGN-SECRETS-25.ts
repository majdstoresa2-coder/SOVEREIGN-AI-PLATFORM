/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-SECRETS-25
 * ============================================================
 *
 * Central Sovereign Secrets Engine.
 *
 * Responsibilities:
 * - Store secret material through a sovereign vault adapter.
 * - Never expose plaintext secrets through metadata or listings.
 * - Control secret access.
 * - Support secret rotation.
 * - Support expiration and revocation.
 * - Track secret versions.
 * - Enforce Policy, Security and Authorization.
 * - Preserve access audit events.
 *
 * SECRETS has NO sovereign authority.
 *
 * OWNER > STEWARD > CORE > POLICY > SECURITY
 * > IDENTITY > AUTHENTICATION > AUTHORIZATION > SECRETS
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. TYPES
 * ============================================================
 */

export type SovereignSecretType =
  | "API_KEY"
  | "PASSWORD"
  | "TOKEN"
  | "PRIVATE_KEY"
  | "CERTIFICATE"
  | "DATABASE_CREDENTIAL"
  | "ENCRYPTION_KEY"
  | "SIGNING_KEY"
  | "WEBHOOK_SECRET"
  | "CUSTOM";

export type SovereignSecretStatus =
  | "ACTIVE"
  | "ROTATING"
  | "EXPIRED"
  | "REVOKED"
  | "DISABLED";

export type SovereignSecretOperation =
  | "CREATE"
  | "READ"
  | "ROTATE"
  | "REVOKE"
  | "DISABLE"
  | "DELETE"
  | "LIST";

/* ============================================================
 * 2. SECRET RECORD
 * ============================================================
 */

export interface SovereignSecretRecord {
  id: string;

  name: string;

  type: SovereignSecretType;

  status: SovereignSecretStatus;

  version: number;

  vaultReference: string;

  ownerId: string;

  createdBy: string;

  createdAt: string;

  updatedAt: string;

  rotatedAt?: string;

  expiresAt?: string;

  revokedAt?: string;

  disabledAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 3. CREATE REQUEST
 * ============================================================
 */

export interface SovereignSecretCreateRequest {
  id?: string;

  name: string;

  type: SovereignSecretType;

  value: string | Uint8Array;

  ownerId: string;

  expiresAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 4. SECRET ACCESS CONTEXT
 * ============================================================
 */

export interface SovereignSecretContext {
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
 * 5. VAULT ADAPTER
 * ============================================================
 */

export interface SovereignSecretVaultAdapter {
  store(
    secretId: string,
    version: number,
    value: string | Uint8Array
  ): Promise<string>;

  retrieve(
    vaultReference: string
  ): Promise<string | Uint8Array>;

  delete(
    vaultReference: string
  ): Promise<void>;

  exists(
    vaultReference: string
  ): Promise<boolean>;
}

/* ============================================================
 * 6. METADATA STORE
 * ============================================================
 */

export interface SovereignSecretMetadataStore {
  create(
    record: SovereignSecretRecord
  ): Promise<void>;

  update(
    record: SovereignSecretRecord
  ): Promise<void>;

  get(
    secretId: string
  ): Promise<SovereignSecretRecord | undefined>;

  list():
    Promise<SovereignSecretRecord[]>;
}

/* ============================================================
 * 7. ACCESS VALIDATOR
 * ============================================================
 */

export interface SovereignSecretAccessValidator {
  validate(
    operation: SovereignSecretOperation,
    context: SovereignSecretContext,
    secret?: SovereignSecretRecord
  ): {
    allowed: boolean;
    reason?: string;
  };
}

/* ============================================================
 * 8. EVENT BUS
 * ============================================================
 */

export interface SovereignSecretEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    secretId?: string;

    actorId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 9. AUDIT
 * ============================================================
 */

export interface SovereignSecretAudit {
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
 * 10. SECRET RESULT
 * ============================================================
 */

export interface SovereignSecretAccessResult {
  secretId: string;

  version: number;

  value: string | Uint8Array;

  accessedAt: string;
}

/* ============================================================
 * 11. SECRETS ENGINE
 * ============================================================
 */

export class SovereignSecretsEngine {
  public readonly id =
    "SOVEREIGN-SECRETS-25";

  public readonly version =
    "1.0.0";

  private vault?:
    SovereignSecretVaultAdapter;

  private store?:
    SovereignSecretMetadataStore;

  private accessValidator?:
    SovereignSecretAccessValidator;

  private eventBus?:
    SovereignSecretEventBus;

  private audit?:
    SovereignSecretAudit;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setVault(
    vault: SovereignSecretVaultAdapter
  ): void {
    this.vault = vault;
  }

  setStore(
    store: SovereignSecretMetadataStore
  ): void {
    this.store = store;
  }

  setAccessValidator(
    validator: SovereignSecretAccessValidator
  ): void {
    this.accessValidator = validator;
  }

  setEventBus(
    eventBus: SovereignSecretEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: SovereignSecretAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * CREATE
   * ==========================================================
   */

  async create(
    request: SovereignSecretCreateRequest,
    context: SovereignSecretContext
  ): Promise<SovereignSecretRecord> {
    this.requireAccess(
      "CREATE",
      context
    );

    if (!request.name.trim()) {
      throw new Error(
        "Secret name is required."
      );
    }

    if (!request.ownerId.trim()) {
      throw new Error(
        "Secret owner is required."
      );
    }

    this.validateSecretValue(
      request.value
    );

    const id =
      request.id ??
      this.createId("SECRET");

    const existing =
      await this.requireStore()
        .get(id);

    if (existing) {
      throw new Error(
        `Secret already exists: ${id}`
      );
    }

    const version = 1;

    const vaultReference =
      await this.requireVault()
        .store(
          id,
          version,
          request.value
        );

    const now = this.now();

    const record:
      SovereignSecretRecord = {
      id,

      name:
        request.name,

      type:
        request.type,

      status:
        "ACTIVE",

      version,

      vaultReference,

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

      metadata:
        this.sanitizeMetadata(
          request.metadata
        ),
    };

    await this.requireStore()
      .create(record);

    await this.publish(
      "secrets.created",
      record.id,
      context.actorId,
      {
        type:
          record.type,

        version:
          record.version,
      }
    );

    await this.recordAudit(
      "secrets.create",
      record.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,

        type:
          record.type,
      }
    );

    return this.publicRecord(
      record
    );
  }

  /* ==========================================================
   * READ SECRET VALUE
   * ==========================================================
   */

  async read(
    secretId: string,
    context: SovereignSecretContext
  ): Promise<SovereignSecretAccessResult> {
    const secret =
      await this.requireSecret(
        secretId
      );

    this.requireAccess(
      "READ",
      context,
      secret
    );

    this.requireUsable(
      secret
    );

    const vault =
      this.requireVault();

    if (
      !(await vault.exists(
        secret.vaultReference
      ))
    ) {
      await this.recordAudit(
        "secrets.read",
        secret.id,
        "FAILED",
        {
          actorId:
            context.actorId,

          reason:
            "VAULT_REFERENCE_MISSING",
        }
      );

      throw new Error(
        "Secret material is unavailable."
      );
    }

    const value =
      await vault.retrieve(
        secret.vaultReference
      );

    await this.publish(
      "secrets.accessed",
      secret.id,
      context.actorId,
      {
        version:
          secret.version,
      }
    );

    await this.recordAudit(
      "secrets.read",
      secret.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,

        sessionId:
          context.sessionId,
      }
    );

    return {
      secretId:
        secret.id,

      version:
        secret.version,

      value,

      accessedAt:
        this.now(),
    };
  }

  /* ==========================================================
   * ROTATE
   * ==========================================================
   */

  async rotate(
    secretId: string,
    newValue: string | Uint8Array,
    context: SovereignSecretContext,
    options?: {
      expiresAt?: string;
    }
  ): Promise<SovereignSecretRecord> {
    const secret =
      await this.requireSecret(
        secretId
      );

    this.requireAccess(
      "ROTATE",
      context,
      secret
    );

    this.validateSecretValue(
      newValue
    );

    if (
      secret.status === "REVOKED"
    ) {
      throw new Error(
        "Revoked secret cannot be rotated."
      );
    }

    secret.status =
      "ROTATING";

    secret.updatedAt =
      this.now();

    await this.requireStore()
      .update(secret);

    const oldReference =
      secret.vaultReference;

    const newVersion =
      secret.version + 1;

    try {
      const newReference =
        await this.requireVault()
          .store(
            secret.id,
            newVersion,
            newValue
          );

      secret.vaultReference =
        newReference;

      secret.version =
        newVersion;

      secret.status =
        "ACTIVE";

      secret.rotatedAt =
        this.now();

      secret.updatedAt =
        secret.rotatedAt;

      if (options?.expiresAt) {
        secret.expiresAt =
          options.expiresAt;
      }

      await this.requireStore()
        .update(secret);

      /*
       * Delete previous secret material only after
       * new material and metadata are committed.
       */
      if (
        oldReference !==
        newReference
      ) {
        await this.requireVault()
          .delete(
            oldReference
          );
      }

      await this.publish(
        "secrets.rotated",
        secret.id,
        context.actorId,
        {
          version:
            secret.version,
        }
      );

      await this.recordAudit(
        "secrets.rotate",
        secret.id,
        "SUCCESS",
        {
          actorId:
            context.actorId,

          version:
            secret.version,
        }
      );

      return this.publicRecord(
        secret
      );
    } catch (error) {
      secret.status =
        "ACTIVE";

      secret.updatedAt =
        this.now();

      await this.requireStore()
        .update(secret);

      await this.recordAudit(
        "secrets.rotate",
        secret.id,
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
   * REVOKE
   * ==========================================================
   */

  async revoke(
    secretId: string,
    context: SovereignSecretContext
  ): Promise<SovereignSecretRecord> {
    const secret =
      await this.requireSecret(
        secretId
      );

    this.requireAccess(
      "REVOKE",
      context,
      secret
    );

    secret.status =
      "REVOKED";

    secret.revokedAt =
      this.now();

    secret.updatedAt =
      secret.revokedAt;

    await this.requireStore()
      .update(secret);

    await this.publish(
      "secrets.revoked",
      secret.id,
      context.actorId,
      {}
    );

    await this.recordAudit(
      "secrets.revoke",
      secret.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,
      }
    );

    return this.publicRecord(
      secret
    );
  }

  /* ==========================================================
   * DISABLE
   * ==========================================================
   */

  async disable(
    secretId: string,
    context: SovereignSecretContext
  ): Promise<SovereignSecretRecord> {
    const secret =
      await this.requireSecret(
        secretId
      );

    this.requireAccess(
      "DISABLE",
      context,
      secret
    );

    if (
      secret.status ===
      "REVOKED"
    ) {
      throw new Error(
        "Revoked secret cannot be disabled."
      );
    }

    secret.status =
      "DISABLED";

    secret.disabledAt =
      this.now();

    secret.updatedAt =
      secret.disabledAt;

    await this.requireStore()
      .update(secret);

    await this.publish(
      "secrets.disabled",
      secret.id,
      context.actorId,
      {}
    );

    return this.publicRecord(
      secret
    );
  }

  /* ==========================================================
   * DELETE
   * ==========================================================
   */

  async delete(
    secretId: string,
    context: SovereignSecretContext
  ): Promise<void> {
    const secret =
      await this.requireSecret(
        secretId
      );

    this.requireAccess(
      "DELETE",
      context,
      secret
    );

    /*
     * Destructive deletion requires OWNER.
     * Other actors must revoke instead.
     */
    if (
      context.authority !==
      "OWNER"
    ) {
      throw new Error(
        "Permanent secret deletion requires OWNER authority."
      );
    }

    await this.requireVault()
      .delete(
        secret.vaultReference
      );

    secret.status =
      "REVOKED";

    secret.revokedAt =
      this.now();

    secret.updatedAt =
      secret.revokedAt;

    secret.vaultReference =
      "DESTROYED";

    await this.requireStore()
      .update(secret);

    await this.publish(
      "secrets.destroyed",
      secret.id,
      context.actorId,
      {}
    );

    await this.recordAudit(
      "secrets.delete",
      secret.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,
      }
    );
  }

  /* ==========================================================
   * GET METADATA
   * ==========================================================
   */

  async getMetadata(
    secretId: string,
    context: SovereignSecretContext
  ): Promise<SovereignSecretRecord> {
    const secret =
      await this.requireSecret(
        secretId
      );

    this.requireAccess(
      "LIST",
      context,
      secret
    );

    return this.publicRecord(
      secret
    );
  }

  /* ==========================================================
   * LIST
   * ==========================================================
   */

  async list(
    context: SovereignSecretContext
  ): Promise<SovereignSecretRecord[]> {
    this.requireAccess(
      "LIST",
      context
    );

    const records =
      await this.requireStore()
        .list();

    return records.map(
      (record) =>
        this.publicRecord(
          record
        )
    );
  }

  /* ==========================================================
   * EXPIRATION
   * ==========================================================
   */

  async markExpired(
    secretId: string
  ): Promise<SovereignSecretRecord> {
    const secret =
      await this.requireSecret(
        secretId
      );

    if (
      secret.expiresAt &&
      this.isExpired(
        secret.expiresAt
      ) &&
      secret.status ===
        "ACTIVE"
    ) {
      secret.status =
        "EXPIRED";

      secret.updatedAt =
        this.now();

      await this.requireStore()
        .update(secret);

      await this.publish(
        "secrets.expired",
        secret.id,
        undefined,
        {}
      );
    }

    return this.publicRecord(
      secret
    );
  }

  /* ==========================================================
   * ACCESS CONTROL
   * ==========================================================
   */

  private requireAccess(
    operation: SovereignSecretOperation,
    context: SovereignSecretContext,
    secret?: SovereignSecretRecord
  ): void {
    if (!context.authenticated) {
      throw new Error(
        "Secrets access requires authentication."
      );
    }

    if (!context.policyChecked) {
      throw new Error(
        "Secrets blocked: policy check required."
      );
    }

    if (!context.securityChecked) {
      throw new Error(
        "Secrets blocked: security check required."
      );
    }

    if (
      !context.authorizationChecked
    ) {
      throw new Error(
        "Secrets blocked: authorization check required."
      );
    }

    if (this.accessValidator) {
      const result =
        this.accessValidator.validate(
          operation,
          context,
          secret
        );

      if (!result.allowed) {
        throw new Error(
          result.reason ??
            "Secrets operation denied."
        );
      }
    }
  }

  /* ==========================================================
   * SECRET STATE
   * ==========================================================
   */

  private requireUsable(
    secret: SovereignSecretRecord
  ): void {
    if (
      secret.expiresAt &&
      this.isExpired(
        secret.expiresAt
      )
    ) {
      throw new Error(
        "Secret has expired."
      );
    }

    if (
      secret.status !==
      "ACTIVE"
    ) {
      throw new Error(
        `Secret is not usable: ${secret.status}`
      );
    }

    if (
      secret.vaultReference ===
      "DESTROYED"
    ) {
      throw new Error(
        "Secret material has been destroyed."
      );
    }
  }

  /* ==========================================================
   * VALUE VALIDATION
   * ==========================================================
   */

  private validateSecretValue(
    value: string | Uint8Array
  ): void {
    if (
      typeof value === "string"
    ) {
      if (value.length === 0) {
        throw new Error(
          "Secret value cannot be empty."
        );
      }

      return;
    }

    if (value.byteLength === 0) {
      throw new Error(
        "Secret value cannot be empty."
      );
    }
  }

  /* ==========================================================
   * METADATA SANITIZATION
   * ==========================================================
   */

  private sanitizeMetadata(
    metadata:
      | Record
