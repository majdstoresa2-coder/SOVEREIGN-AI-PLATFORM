/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-STORAGE-20
 * ============================================================
 *
 * Central Sovereign Storage Engine.
 *
 * Responsibilities:
 * - Provide sovereign persistent storage abstraction.
 * - Register internal storage providers.
 * - Manage namespaces and records.
 * - Enforce Policy, Permission and Security boundaries.
 * - Support transactions.
 * - Support integrity verification.
 * - Support encrypted storage metadata.
 * - Support backup and restore contracts.
 * - Preserve storage audit events.
 *
 * STORAGE has NO sovereign authority.
 * STORAGE cannot bypass Policy or Security.
 *
 * OWNER > STEWARD > CORE > POLICY > SECURITY > STORAGE
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. STORAGE TYPES
 * ============================================================
 */

export type SovereignStorageType =
  | "DATABASE"
  | "OBJECT"
  | "FILE"
  | "KEY_VALUE"
  | "CACHE"
  | "ARCHIVE"
  | "BACKUP"
  | "CUSTOM";

export type SovereignStorageStatus =
  | "REGISTERED"
  | "ACTIVE"
  | "DEGRADED"
  | "READ_ONLY"
  | "OFFLINE"
  | "DISABLED";

export type SovereignStorageOperation =
  | "READ"
  | "WRITE"
  | "UPDATE"
  | "DELETE"
  | "LIST"
  | "BACKUP"
  | "RESTORE";

/* ============================================================
 * 2. STORAGE PROVIDER
 * ============================================================
 */

export interface SovereignStorageProvider {
  id: string;

  name: string;

  type: SovereignStorageType;

  status: SovereignStorageStatus;

  persistent: boolean;

  encrypted: boolean;

  local: boolean;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 3. STORAGE RECORD
 * ============================================================
 */

export interface SovereignStorageRecord<T = unknown> {
  id: string;

  namespace: string;

  key: string;

  value: T;

  version: number;

  checksum?: string;

  checksumAlgorithm?: "SHA256" | "SHA512";

  createdAt: string;

  updatedAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 4. STORAGE NAMESPACE
 * ============================================================
 */

export interface SovereignStorageNamespace {
  id: string;

  providerId: string;

  name: string;

  description?: string;

  encrypted: boolean;

  immutable: boolean;

  createdAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 5. ACCESS CONTEXT
 * ============================================================
 */

export interface SovereignStorageContext {
  actorId: string;

  authority:
    | "OWNER"
    | "STEWARD"
    | "CORE"
    | "SYSTEM"
    | "AGENT"
    | "CAPABILITY";

  policyChecked: boolean;

  permissionChecked: boolean;

  securityChecked: boolean;

  permissions: string[];
}

/* ============================================================
 * 6. ACCESS VALIDATOR
 * ============================================================
 */

export interface SovereignStorageAccessValidator {
  validate(
    operation: SovereignStorageOperation,
    context: SovereignStorageContext,
    namespace: SovereignStorageNamespace,
    key?: string
  ): {
    allowed: boolean;
    reason?: string;
  };
}

/* ============================================================
 * 7. STORAGE ADAPTER
 * ============================================================
 */

export interface SovereignStorageAdapter {
  write<T>(
    namespace: string,
    record: SovereignStorageRecord<T>
  ): Promise<void>;

  read<T>(
    namespace: string,
    key: string
  ): Promise<SovereignStorageRecord<T> | undefined>;

  delete(
    namespace: string,
    key: string
  ): Promise<void>;

  list<T>(
    namespace: string
  ): Promise<SovereignStorageRecord<T>[]>;

  exists(
    namespace: string,
    key: string
  ): Promise<boolean>;

  beginTransaction?(): Promise<string>;

  commitTransaction?(
    transactionId: string
  ): Promise<void>;

  rollbackTransaction?(
    transactionId: string
  ): Promise<void>;
}

/* ============================================================
 * 8. INTEGRITY ENGINE
 * ============================================================
 */

export interface SovereignStorageIntegrity {
  checksum(
    value: unknown,
    algorithm: "SHA256" | "SHA512"
  ): Promise<string>;

  verify(
    value: unknown,
    checksum: string,
    algorithm: "SHA256" | "SHA512"
  ): Promise<boolean>;
}

/* ============================================================
 * 9. BACKUP ENGINE
 * ============================================================
 */

export interface SovereignStorageBackupEngine {
  backup(
    providerId: string,
    namespaces: SovereignStorageNamespace[]
  ): Promise<{
    backupId: string;
    location: string;
    checksum?: string;
    createdAt: string;
  }>;

  restore(
    backupId: string
  ): Promise<{
    restored: boolean;
    restoredAt: string;
    metadata?: Record<string, unknown>;
  }>;
}

/* ============================================================
 * 10. EVENT BUS
 * ============================================================
 */

export interface SovereignStorageEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    providerId?: string;

    namespaceId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 11. AUDIT
 * ============================================================
 */

export interface SovereignStorageAudit {
  record(
    operation: string,
    subjectId: string | undefined,
    result: "SUCCESS" | "FAILED" | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/* ============================================================
 * 12. STORAGE ENGINE
 * ============================================================
 */

export class SovereignStorageEngine {
  public readonly id =
    "SOVEREIGN-STORAGE-20";

  public readonly version =
    "1.0.0";

  private providers =
    new Map<string, SovereignStorageProvider>();

  private namespaces =
    new Map<string, SovereignStorageNamespace>();

  private adapters =
    new Map<string, SovereignStorageAdapter>();

  private accessValidator?:
    SovereignStorageAccessValidator;

  private integrity?:
    SovereignStorageIntegrity;

  private backupEngine?:
    SovereignStorageBackupEngine;

  private eventBus?:
    SovereignStorageEventBus;

  private audit?:
    SovereignStorageAudit;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setAccessValidator(
    validator: SovereignStorageAccessValidator
  ): void {
    this.accessValidator = validator;
  }

  setIntegrityEngine(
    integrity: SovereignStorageIntegrity
  ): void {
    this.integrity = integrity;
  }

  setBackupEngine(
    backupEngine: SovereignStorageBackupEngine
  ): void {
    this.backupEngine = backupEngine;
  }

  setEventBus(
    eventBus: SovereignStorageEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: SovereignStorageAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * PROVIDERS
   * ==========================================================
   */

  async registerProvider(
    provider: SovereignStorageProvider,
    adapter: SovereignStorageAdapter
  ): Promise<void> {
    if (!provider.id.trim()) {
      throw new Error(
        "Storage provider ID is required."
      );
    }

    if (this.providers.has(provider.id)) {
      throw new Error(
        `Storage provider already registered: ${provider.id}`
      );
    }

    this.providers.set(
      provider.id,
      {
        ...provider,
        status:
          provider.status ?? "REGISTERED",
      }
    );

    this.adapters.set(
      provider.id,
      adapter
    );

    await this.publish(
      "storage.provider.registered",
      {
        providerId: provider.id,
        type: provider.type,
        local: provider.local,
        encrypted: provider.encrypted,
      },
      provider.id
    );

    await this.recordAudit(
      "storage.provider.register",
      provider.id,
      "SUCCESS"
    );
  }

  async activateProvider(
    providerId: string
  ): Promise<SovereignStorageProvider> {
    const provider =
      this.requireProvider(providerId);

    provider.status = "ACTIVE";

    await this.publish(
      "storage.provider.activated",
      {
        providerId,
      },
      providerId
    );

    return provider;
  }

  async disableProvider(
    providerId: string
  ): Promise<SovereignStorageProvider> {
    const provider =
      this.requireProvider(providerId);

    provider.status = "DISABLED";

    await this.publish(
      "storage.provider.disabled",
      {
        providerId,
      },
      providerId
    );

    return provider;
  }

  /* ==========================================================
   * NAMESPACES
   * ==========================================================
   */

  async createNamespace(
    input: {
      id: string;
      providerId: string;
      name: string;
      description?: string;
      encrypted?: boolean;
      immutable?: boolean;
      metadata?: Record<string, unknown>;
    }
  ): Promise<SovereignStorageNamespace> {
    if (this.namespaces.has(input.id)) {
      throw new Error(
        `Storage namespace already exists: ${input.id}`
      );
    }

    const provider =
      this.requireProvider(
        input.providerId
      );

    if (
      provider.status !== "ACTIVE" &&
      provider.status !== "REGISTERED"
    ) {
      throw new Error(
        `Storage provider unavailable: ${provider.id}`
      );
    }

    const namespace:
      SovereignStorageNamespace = {
      id: input.id,

      providerId:
        input.providerId,

      name:
        input.name,

      description:
        input.description,

      encrypted:
        input.encrypted ??
        provider.encrypted,

      immutable:
        input.immutable ?? false,

      createdAt:
        this.now(),

      metadata:
        input.metadata,
    };

    this.namespaces.set(
      namespace.id,
      namespace
    );

    await this.publish(
      "storage.namespace.created",
      {
        namespaceId:
          namespace.id,

        name:
          namespace.name,
      },
      namespace.providerId,
      namespace.id
    );

    return namespace;
  }

  /* ==========================================================
   * WRITE
   * ==========================================================
   */

  async write<T>(
    namespaceId: string,
    key: string,
    value: T,
    context: SovereignStorageContext,
    metadata?: Record<string, unknown>
  ): Promise<SovereignStorageRecord<T>> {
    const namespace =
      this.requireNamespace(
        namespaceId
      );

    this.requireAccess(
      "WRITE",
      context,
      namespace,
      key
    );

    const provider =
      this.requireActiveProvider(
        namespace.providerId
      );

    const adapter =
      this.requireAdapter(
        provider.id
      );

    if (namespace.immutable) {
      const exists =
        await adapter.exists(
          namespace.name,
          key
        );

      if (exists) {
        throw new Error(
          `Immutable record already exists: ${key}`
        );
      }
    }

    const existing =
      await adapter.read<T>(
        namespace.name,
        key
      );

    const record:
      SovereignStorageRecord<T> = {
      id:
        existing?.id ??
        this.createId(
          "STORAGE-RECORD"
        ),

      namespace:
        namespace.id,

      key,

      value,

      version:
        (existing?.version ?? 0) + 1,

      createdAt:
        existing?.createdAt ??
        this.now(),

      updatedAt:
        this.now(),

      metadata,
    };

    if (this.integrity) {
      record.checksumAlgorithm =
        "SHA256";

      record.checksum =
        await this.integrity.checksum(
          value,
          "SHA256"
        );
    }

    await adapter.write(
      namespace.name,
      record
    );

    await this.publish(
      "storage.record.written",
      {
        key,
        version:
          record.version,
      },
      provider.id,
      namespace.id
    );

    await this.recordAudit(
      "storage.write",
      record.id,
      "SUCCESS",
      {
        namespaceId,
        key,
        actorId:
          context.actorId,
      }
    );

    return record;
  }

  /* ==========================================================
   * READ
   * ==========================================================
   */

  async read<T>(
    namespaceId: string,
    key: string,
    context: SovereignStorageContext
  ): Promise<
    SovereignStorageRecord<T> | undefined
  > {
    const namespace =
      this.requireNamespace(
        namespaceId
      );

    this.requireAccess(
      "READ",
      context,
      namespace,
      key
    );

    const adapter =
      this.requireAdapter(
        namespace.providerId
      );

    const record =
      await adapter.read<T>(
        namespace.name,
        key
      );

    if (
      record &&
      record.checksum &&
      record.checksumAlgorithm &&
      this.integrity
    ) {
      const valid =
        await this.integrity.verify(
          record.value,
          record.checksum,
          record.checksumAlgorithm
        );

      if (!valid) {
        await this.publish(
          "storage.integrity.failed",
          {
            recordId:
              record.id,
            key,
          },
          namespace.providerId,
          namespace.id
        );

        throw new Error(
          `Storage integrity verification failed: ${key}`
        );
      }
    }

    return record;
  }

  /* ==========================================================
   * DELETE
   * ==========================================================
   */

  async delete(
    namespaceId: string,
    key: string,
    context: SovereignStorageContext
  ): Promise<void> {
    const namespace =
      this.requireNamespace(
        namespaceId
      );

    this.requireAccess(
      "DELETE",
      context,
      namespace,
      key
    );

    if (namespace.immutable) {
      throw new Error(
        "Immutable namespace records cannot be deleted."
      );
    }

    const adapter =
      this.requireAdapter(
        namespace.providerId
      );

    await adapter.delete(
      namespace.name,
      key
    );

    await this.publish(
      "storage.record.deleted",
      {
        key,
        actorId:
          context.actorId,
      },
      namespace.providerId,
      namespace.id
    );

    await this.recordAudit(
      "storage.delete",
      key,
      "SUCCESS",
      {
        namespaceId,
        actorId:
          context.actorId,
      }
    );
  }

  /* ==========================================================
   * LIST
   * ==========================================================
   */

  async list<T>(
    namespaceId: string,
    context: SovereignStorageContext
  ): Promise<SovereignStorageRecord<T>[]> {
    const namespace =
      this.requireNamespace(
        namespaceId
      );

    this.requireAccess(
      "LIST",
      context,
      namespace
    );

    const adapter =
      this.requireAdapter(
        namespace.providerId
      );

    return adapter.list<T>(
      namespace.name
    );
  }

  /* ==========================================================
   * TRANSACTIONS
   * ==========================================================
   */

  async transaction<T>(
    providerId: string,
    operation: (
      transactionId?: string
    ) => Promise<T>
  ): Promise<T> {
    const adapter =
      this.requireAdapter(
        providerId
      );

    const transactionId =
      adapter.beginTransaction
        ? await adapter.beginTransaction()
        : undefined;

    try {
      const result =
        await operation(
          transactionId
        );

      if (
        transactionId &&
        adapter.commitTransaction
      ) {
        await adapter.commitTransaction(
          transactionId
        );
      }

      return result;
    } catch (error) {
      if (
        transactionId &&
        adapter.rollbackTransaction
      ) {
        await adapter.rollbackTransaction(
          transactionId
        );
      }

      throw error;
    }
  }

  /* ==========================================================
   * BACKUP
   * ==========================================================
   */

  async backup(
    providerId: string,
    context: SovereignStorageContext
  ): Promise<{
    backupId: string;
    location: string;
    checksum?: string;
    createdAt: string;
  }> {
    const provider =
      this.requireActiveProvider(
        providerId
      );

    const namespaces =
      this.listNamespaces(
        provider.id
      );

    if (
      namespaces.length === 0
    ) {
      throw new Error(
        "No namespaces available for backup."
      );
    }

    for (
      const namespace of
      namespaces
    ) {
      this.requireAccess(
        "BACKUP",
        context,
        namespace
      );
    }

    if (!this.backupEngine) {
      throw new Error(
        "Sovereign backup engine is not configured."
      );
    }

    const result =
      await this.backupEngine.backup(
        provider.id,
        namespaces
      );

    await this.publish(
      "storage.backup.completed",
      {
        backupId:
          result.backupId,

        location:
          result.location,
      },
      provider.id
    );

    await this.recordAudit(
      "storage.backup",
      result.backupId,
      "SUCCESS",
      {
        providerId,
        actorId:
          context.actorId,
      }
    );

    return result;
  }

  /* ==========================================================
   * RESTORE
   * ==========================================================
   */

  async restore(
    providerId: string,
    backupId: string,
    context: SovereignStorageContext
  ): Promise<{
    restored: boolean;
    restoredAt: string;
    metadata?: Record<string, unknown>;
  }> {
    const provider =
      this.requireProvider(
        providerId
      );

    const namespaces =
      this.listNamespaces(
        provider.id
      );

    for (
      const namespace of
      namespaces
    ) {
      this.requireAccess(
        "RESTORE",
        context,
        namespace
      );
    }

    if (!this.backupEngine) {
      throw new Error(
        "Sovereign backup engine is not configured."
      );
    }

    const result =
      await this.backupEngine.restore(
        backupId
      );

    await this.publish(
      "storage.restore.completed",
      {
        backupId,
        restored:
          result.restored,
      },
      provider.id
    );

    await this.recordAudit(
      "storage.restore",
      backupId,
      result.restored
        ? "SUCCESS"
        : "FAILED",
      {
        providerId,
        actorId:
          context.actorId,
      }
    );

    return result;
  }

  /* ==========================================================
   * GET / LIST
   * ==========================================================
   */

  getProvider(
    providerId: string
  ): SovereignStorageProvider | undefined {
    return this.providers.get(
      providerId
    );
  }

  listProviders():
    SovereignStorageProvider[] {
    return Array.from(
      this.providers.values()
    );
  }

  getNamespace(
    namespaceId: string
  ):
    | SovereignStorageNamespace
    | unde
