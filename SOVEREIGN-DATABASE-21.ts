/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-DATABASE-21
 * ============================================================
 *
 * Central Sovereign Database Engine.
 *
 * Responsibilities:
 * - Manage sovereign databases.
 * - Manage schemas and collections.
 * - Execute controlled queries.
 * - Support transactions.
 * - Support migrations.
 * - Enforce Policy, Permission and Security.
 * - Preserve database integrity.
 * - Integrate with sovereign Storage.
 * - Maintain database audit events.
 *
 * DATABASE has NO sovereign authority.
 * DATABASE cannot bypass Policy, Security or Storage.
 *
 * OWNER > STEWARD > CORE > POLICY > SECURITY > STORAGE > DATABASE
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. DATABASE TYPES
 * ============================================================
 */

export type SovereignDatabaseType =
  | "RELATIONAL"
  | "DOCUMENT"
  | "KEY_VALUE"
  | "GRAPH"
  | "TIME_SERIES"
  | "CUSTOM";

export type SovereignDatabaseStatus =
  | "REGISTERED"
  | "ACTIVE"
  | "MIGRATING"
  | "DEGRADED"
  | "READ_ONLY"
  | "OFFLINE"
  | "DISABLED";

export type SovereignDatabaseOperation =
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "QUERY"
  | "TRANSACTION"
  | "MIGRATE"
  | "BACKUP"
  | "RESTORE";

/* ============================================================
 * 2. DATABASE DEFINITION
 * ============================================================
 */

export interface SovereignDatabaseDefinition {
  id: string;

  name: string;

  type: SovereignDatabaseType;

  storageProviderId: string;

  status: SovereignDatabaseStatus;

  encrypted: boolean;

  version: number;

  createdAt: string;

  updatedAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 3. FIELD DEFINITION
 * ============================================================
 */

export interface SovereignDatabaseField {
  name: string;

  type:
    | "STRING"
    | "NUMBER"
    | "BOOLEAN"
    | "DATE"
    | "OBJECT"
    | "ARRAY"
    | "BINARY"
    | "JSON"
    | "CUSTOM";

  required: boolean;

  unique?: boolean;

  indexed?: boolean;

  defaultValue?: unknown;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 4. SCHEMA
 * ============================================================
 */

export interface SovereignDatabaseSchema {
  id: string;

  databaseId: string;

  name: string;

  version: number;

  fields: SovereignDatabaseField[];

  createdAt: string;

  updatedAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 5. DATABASE RECORD
 * ============================================================
 */

export interface SovereignDatabaseRecord<T = unknown> {
  id: string;

  databaseId: string;

  schemaId: string;

  data: T;

  version: number;

  createdAt: string;

  updatedAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. QUERY
 * ============================================================
 */

export interface SovereignDatabaseQuery {
  schemaId: string;

  filters?: Record<string, unknown>;

  select?: string[];

  orderBy?: Array<{
    field: string;
    direction: "ASC" | "DESC";
  }>;

  limit?: number;

  offset?: number;
}

/* ============================================================
 * 7. QUERY RESULT
 * ============================================================
 */

export interface SovereignDatabaseQueryResult<T = unknown> {
  records: SovereignDatabaseRecord<T>[];

  total: number;

  limit?: number;

  offset?: number;

  executedAt: string;
}

/* ============================================================
 * 8. DATABASE CONTEXT
 * ============================================================
 */

export interface SovereignDatabaseContext {
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

  storageChecked: boolean;

  permissions: string[];
}

/* ============================================================
 * 9. ACCESS VALIDATOR
 * ============================================================
 */

export interface SovereignDatabaseAccessValidator {
  validate(
    operation: SovereignDatabaseOperation,
    context: SovereignDatabaseContext,
    database: SovereignDatabaseDefinition,
    schema?: SovereignDatabaseSchema
  ): {
    allowed: boolean;
    reason?: string;
  };
}

/* ============================================================
 * 10. DATABASE ADAPTER
 * ============================================================
 */

export interface SovereignDatabaseAdapter {
  insert<T>(
    database: SovereignDatabaseDefinition,
    schema: SovereignDatabaseSchema,
    record: SovereignDatabaseRecord<T>
  ): Promise<void>;

  findById<T>(
    database: SovereignDatabaseDefinition,
    schema: SovereignDatabaseSchema,
    recordId: string
  ): Promise<SovereignDatabaseRecord<T> | undefined>;

  update<T>(
    database: SovereignDatabaseDefinition,
    schema: SovereignDatabaseSchema,
    record: SovereignDatabaseRecord<T>
  ): Promise<void>;

  delete(
    database: SovereignDatabaseDefinition,
    schema: SovereignDatabaseSchema,
    recordId: string
  ): Promise<void>;

  query<T>(
    database: SovereignDatabaseDefinition,
    query: SovereignDatabaseQuery
  ): Promise<SovereignDatabaseQueryResult<T>>;

  beginTransaction?(
    database: SovereignDatabaseDefinition
  ): Promise<string>;

  commitTransaction?(
    transactionId: string
  ): Promise<void>;

  rollbackTransaction?(
    transactionId: string
  ): Promise<void>;
}

/* ============================================================
 * 11. MIGRATION
 * ============================================================
 */

export interface SovereignDatabaseMigration {
  id: string;

  databaseId: string;

  fromVersion: number;

  toVersion: number;

  description: string;

  operations: Array<{
    type:
      | "CREATE_SCHEMA"
      | "ALTER_SCHEMA"
      | "DROP_SCHEMA"
      | "CREATE_INDEX"
      | "DROP_INDEX"
      | "CUSTOM";

    payload: Record<string, unknown>;
  }>;

  createdAt: string;

  appliedAt?: string;

  status:
    | "PENDING"
    | "APPLYING"
    | "APPLIED"
    | "FAILED";

  error?: string;
}

/* ============================================================
 * 12. MIGRATION EXECUTOR
 * ============================================================
 */

export interface SovereignMigrationExecutor {
  execute(
    database: SovereignDatabaseDefinition,
    migration: SovereignDatabaseMigration
  ): Promise<{
    success: boolean;
    error?: string;
    metadata?: Record<string, unknown>;
  }>;
}

/* ============================================================
 * 13. EVENT BUS
 * ============================================================
 */

export interface SovereignDatabaseEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    databaseId?: string;

    schemaId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 14. AUDIT
 * ============================================================
 */

export interface SovereignDatabaseAudit {
  record(
    operation: string,
    subjectId: string | undefined,
    result: "SUCCESS" | "FAILED" | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/* ============================================================
 * 15. DATABASE ENGINE
 * ============================================================
 */

export class SovereignDatabaseEngine {
  public readonly id =
    "SOVEREIGN-DATABASE-21";

  public readonly version =
    "1.0.0";

  private databases =
    new Map<string, SovereignDatabaseDefinition>();

  private schemas =
    new Map<string, SovereignDatabaseSchema>();

  private adapters =
    new Map<string, SovereignDatabaseAdapter>();

  private migrations =
    new Map<string, SovereignDatabaseMigration>();

  private accessValidator?:
    SovereignDatabaseAccessValidator;

  private migrationExecutor?:
    SovereignMigrationExecutor;

  private eventBus?:
    SovereignDatabaseEventBus;

  private audit?:
    SovereignDatabaseAudit;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setAccessValidator(
    validator: SovereignDatabaseAccessValidator
  ): void {
    this.accessValidator = validator;
  }

  setMigrationExecutor(
    executor: SovereignMigrationExecutor
  ): void {
    this.migrationExecutor = executor;
  }

  setEventBus(
    eventBus: SovereignDatabaseEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: SovereignDatabaseAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * REGISTER DATABASE
   * ==========================================================
   */

  async registerDatabase(
    input: {
      id: string;
      name: string;
      type: SovereignDatabaseType;
      storageProviderId: string;
      encrypted?: boolean;
      metadata?: Record<string, unknown>;
    },
    adapter: SovereignDatabaseAdapter
  ): Promise<SovereignDatabaseDefinition> {
    if (!input.id.trim()) {
      throw new Error(
        "Database ID is required."
      );
    }

    if (!input.name.trim()) {
      throw new Error(
        "Database name is required."
      );
    }

    if (
      this.databases.has(input.id)
    ) {
      throw new Error(
        `Database already registered: ${input.id}`
      );
    }

    const now = this.now();

    const database:
      SovereignDatabaseDefinition = {
      id: input.id,

      name: input.name,

      type: input.type,

      storageProviderId:
        input.storageProviderId,

      status: "REGISTERED",

      encrypted:
        input.encrypted ?? true,

      version: 1,

      createdAt: now,

      updatedAt: now,

      metadata:
        input.metadata,
    };

    this.databases.set(
      database.id,
      database
    );

    this.adapters.set(
      database.id,
      adapter
    );

    await this.publish(
      "database.registered",
      {
        databaseId:
          database.id,

        type:
          database.type,
      },
      database.id
    );

    await this.recordAudit(
      "database.register",
      database.id,
      "SUCCESS"
    );

    return database;
  }

  /* ==========================================================
   * ACTIVATE DATABASE
   * ==========================================================
   */

  async activateDatabase(
    databaseId: string
  ): Promise<SovereignDatabaseDefinition> {
    const database =
      this.requireDatabase(
        databaseId
      );

    database.status =
      "ACTIVE";

    database.updatedAt =
      this.now();

    await this.publish(
      "database.activated",
      {},
      database.id
    );

    return database;
  }

  /* ==========================================================
   * CREATE SCHEMA
   * ==========================================================
   */

  async createSchema(
    databaseId: string,
    input: {
      id: string;
      name: string;
      fields: SovereignDatabaseField[];
      metadata?: Record<string, unknown>;
    },
    context: SovereignDatabaseContext
  ): Promise<SovereignDatabaseSchema> {
    const database =
      this.requireActiveDatabase(
        databaseId
      );

    this.requireAccess(
      "CREATE",
      context,
      database
    );

    if (this.schemas.has(input.id)) {
      throw new Error(
        `Database schema already exists: ${input.id}`
      );
    }

    this.validateFields(
      input.fields
    );

    const now = this.now();

    const schema:
      SovereignDatabaseSchema = {
      id: input.id,

      databaseId,

      name: input.name,

      version: 1,

      fields: [
        ...input.fields,
      ],

      createdAt: now,

      updatedAt: now,

      metadata:
        input.metadata,
    };

    this.schemas.set(
      schema.id,
      schema
    );

    await this.publish(
      "database.schema.created",
      {
        name:
          schema.name,

        version:
          schema.version,
      },
      database.id,
      schema.id
    );

    await this.recordAudit(
      "database.schema.create",
      schema.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,
      }
    );

    return schema;
  }

  /* ==========================================================
   * INSERT
   * ==========================================================
   */

  async insert<T>(
    databaseId: string,
    schemaId: string,
    data: T,
    context: SovereignDatabaseContext,
    metadata?: Record<string, unknown>
  ): Promise<SovereignDatabaseRecord<T>> {
    const database =
      this.requireActiveDatabase(
        databaseId
      );

    const schema =
      this.requireSchema(
        schemaId,
        databaseId
      );

    this.requireAccess(
      "CREATE",
      context,
      database,
      schema
    );

    const adapter =
      this.requireAdapter(
        databaseId
      );

    const now =
      this.now();

    const record:
      SovereignDatabaseRecord<T> = {
      id:
        this.createId(
          "DB-RECORD"
        ),

      databaseId,

      schemaId,

      data,

      version: 1,

      createdAt: now,

      updatedAt: now,

      metadata,
    };

    await adapter.insert(
      database,
      schema,
      record
    );

    await this.publish(
      "database.record.created",
      {
        recordId:
          record.id,
      },
      databaseId,
      schemaId
    );

    await this.recordAudit(
      "database.insert",
      record.id,
      "SUCCESS",
      {
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

  async findById<T>(
    databaseId: string,
    schemaId: string,
    recordId: string,
    context: SovereignDatabaseContext
  ): Promise<
    SovereignDatabaseRecord<T> | undefined
  > {
    const database =
      this.requireActiveDatabase(
        databaseId
      );

    const schema =
      this.requireSchema(
        schemaId,
        databaseId
      );

    this.requireAccess(
      "READ",
      context,
      database,
      schema
    );

    return this.requireAdapter(
      databaseId
    ).findById<T>(
      database,
      schema,
      recordId
    );
  }

  /* ==========================================================
   * UPDATE
   * ==========================================================
   */

  async update<T>(
    databaseId: string,
    schemaId: string,
    recordId: string,
    data: T,
    context: SovereignDatabaseContext
  ): Promise<SovereignDatabaseRecord<T>> {
    const database =
      this.requireActiveDatabase(
        databaseId
      );

    const schema =
      this.requireSchema(
        schemaId,
        databaseId
      );

    this.requireAccess(
      "UPDATE",
      context,
      database,
      schema
    );

    const adapter =
      this.requireAdapter(
        databaseId
      );

    const existing =
      await adapter.findById<T>(
        database,
        schema,
        recordId
      );

    if (!existing) {
      throw new Error(
        `Database record not found: ${recordId}`
      );
    }

    const updated:
      SovereignDatabaseRecord<T> = {
      ...existing,

      data,

      version:
        existing.version + 1,

      updatedAt:
        this.now(),
    };

    await adapter.update(
      database,
      schema,
      updated
    );

    await this.publish(
      "database.record.updated",
      {
        recordId,
        version:
          updated.version,
      },
      databaseId,
      schemaId
    );

    return updated;
  }

  /* ==========================================================
   * DELETE
   * ==========================================================
   */

  async delete(
    databaseId: string,
    schemaId: string,
    recordId: string,
    context: SovereignDatabaseContext
  ): Promise<void> {
    const database =
      this.requireActiveDatabase(
        databaseId
      );

    const schema =
      this.requireSchema(
        schemaId,
        databaseId
      );

    this.requireAccess(
      "DELETE",
      context,
      database,
      schema
    );

    await this.requireAdapter(
      databaseId
    ).delete(
      database,
      schema,
      recordId
    );

    await this.publish(
      "database.record.deleted",
      {
        recordId,
        actorId:
          context.actorId,
      },
      databaseId,
      schemaId
    );

    await this.recordAudit(
      "database.delete",
      recordId,
      "SUCCESS"
    );
  }

  /* ==========================================================
   * QUERY
   * ==========================================================
   */

  async query<T>(
    databaseId: string,
    query: SovereignDatabaseQuery,
    context: SovereignDatabaseContext
  ): Promise<
    SovereignDatabaseQueryResult<T>
  > {
    const database =
      this.requireActiveDatabase(
        databaseId
      );

    const schema =
      this.requireSchema(
        query.schemaId,
        databaseId
      );

    this.requireAccess(
      "QUERY",
      context,
