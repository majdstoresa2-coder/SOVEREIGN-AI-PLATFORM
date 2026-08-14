/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-MEMORY-11
 * ============================================================
 *
 * Purpose:
 * Central Sovereign Memory System.
 *
 * Memory Types:
 * RUNTIME / TASK / PROJECT / KNOWLEDGE / HISTORY
 * RESULT / LESSON / CONFIGURATION
 *
 * Memory never grants authority.
 * All access remains subject to policy and permissions.
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. MEMORY TYPES
 * ============================================================
 */

export type SovereignMemoryType =
  | "RUNTIME"
  | "TASK"
  | "PROJECT"
  | "KNOWLEDGE"
  | "HISTORY"
  | "RESULT"
  | "LESSON"
  | "CONFIGURATION";

export type MemoryStatus =
  | "ACTIVE"
  | "ARCHIVED"
  | "EXPIRED"
  | "DELETED";

export type MemorySensitivity =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "RESTRICTED";

/* ============================================================
 * 2. MEMORY RECORD
 * ============================================================
 */

export interface SovereignMemoryRecord {
  id: string;

  type: SovereignMemoryType;

  key: string;

  value: unknown;

  status: MemoryStatus;

  sensitivity: MemorySensitivity;

  ownerId?: string;

  projectId?: string;

  taskId?: string;

  jobId?: string;

  agentId?: string;

  tags: string[];

  accessPolicy?: string;

  createdAt: string;

  updatedAt: string;

  expiresAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 3. MEMORY ACCESS CONTEXT
 * ============================================================
 */

export interface MemoryAccessContext {
  actorId: string;

  actorType:
    | "OWNER"
    | "STEWARD"
    | "CORE"
    | "AGENT"
    | "CAPABILITY"
    | "SYSTEM";

  permissions: string[];

  policyChecked: boolean;

  permissionChecked: boolean;
}

/* ============================================================
 * 4. MEMORY WRITE REQUEST
 * ============================================================
 */

export interface MemoryWriteRequest {
  context: MemoryAccessContext;

  type: SovereignMemoryType;

  key: string;

  value: unknown;

  sensitivity?: MemorySensitivity;

  ownerId?: string;

  projectId?: string;

  taskId?: string;

  jobId?: string;

  agentId?: string;

  tags?: string[];

  accessPolicy?: string;

  expiresAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 5. MEMORY QUERY
 * ============================================================
 */

export interface MemoryQuery {
  context: MemoryAccessContext;

  id?: string;

  key?: string;

  type?: SovereignMemoryType;

  ownerId?: string;

  projectId?: string;

  taskId?: string;

  jobId?: string;

  agentId?: string;

  tags?: string[];

  status?: MemoryStatus;

  limit?: number;
}

/* ============================================================
 * 6. ACCESS VALIDATOR
 * ============================================================
 */

export interface MemoryAccessValidator {
  validate(
    operation:
      | "READ"
      | "WRITE"
      | "UPDATE"
      | "DELETE"
      | "ARCHIVE",
    context: MemoryAccessContext,
    record?: SovereignMemoryRecord
  ): {
    allowed: boolean;
    reason?: string;
  };
}

/* ============================================================
 * 7. MEMORY EVENT
 * ============================================================
 */

export interface MemoryEvent {
  id: string;

  type: string;

  source: string;

  memoryId?: string;

  actorId: string;

  timestamp: string;

  payload: Record<string, unknown>;
}

export interface MemoryEventBus {
  publish(event: MemoryEvent): Promise<void>;
}

/* ============================================================
 * 8. MEMORY AUDIT
 * ============================================================
 */

export interface MemoryAudit {
  record(
    operation: string,
    actorId: string,
    memoryId: string | undefined,
    result: "SUCCESS" | "FAILED" | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/* ============================================================
 * 9. MEMORY ENGINE
 * ============================================================
 */

export class SovereignMemoryEngine {
  public readonly id =
    "SOVEREIGN-MEMORY-11";

  public readonly version =
    "1.0.0";

  private records =
    new Map<string, SovereignMemoryRecord>();

  private accessValidator?:
    MemoryAccessValidator;

  private eventBus?:
    MemoryEventBus;

  private audit?:
    MemoryAudit;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setAccessValidator(
    validator: MemoryAccessValidator
  ): void {
    this.accessValidator = validator;
  }

  setEventBus(
    eventBus: MemoryEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: MemoryAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * WRITE
   * ==========================================================
   */

  async write(
    request: MemoryWriteRequest
  ): Promise<SovereignMemoryRecord> {
    this.requireAccess(
      "WRITE",
      request.context
    );

    if (!request.key.trim()) {
      throw new Error(
        "Memory key is required."
      );
    }

    const now = this.now();

    const record: SovereignMemoryRecord = {
      id: this.createId("MEM"),

      type: request.type,

      key: request.key,

      value: request.value,

      status: "ACTIVE",

      sensitivity:
        request.sensitivity ??
        "INTERNAL",

      ownerId:
        request.ownerId,

      projectId:
        request.projectId,

      taskId:
        request.taskId,

      jobId:
        request.jobId,

      agentId:
        request.agentId,

      tags:
        request.tags ?? [],

      accessPolicy:
        request.accessPolicy,

      createdAt: now,

      updatedAt: now,

      expiresAt:
        request.expiresAt,

      metadata:
        request.metadata,
    };

    this.records.set(
      record.id,
      record
    );

    await this.publish(
      "memory.created",
      request.context,
      record.id,
      {
        type: record.type,
        key: record.key,
      }
    );

    await this.recordAudit(
      "memory.write",
      request.context.actorId,
      record.id,
      "SUCCESS"
    );

    return record;
  }

  /* ==========================================================
   * READ
   * ==========================================================
   */

  async read(
    memoryId: string,
    context: MemoryAccessContext
  ): Promise<
    SovereignMemoryRecord | undefined
  > {
    const record =
      this.records.get(memoryId);

    if (!record) {
      return undefined;
    }

    this.refreshExpiration(record);

    if (
      record.status === "DELETED" ||
      record.status === "EXPIRED"
    ) {
      return undefined;
    }

    this.requireAccess(
      "READ",
      context,
      record
    );

    await this.recordAudit(
      "memory.read",
      context.actorId,
      record.id,
      "SUCCESS"
    );

    return record;
  }

  /* ==========================================================
   * QUERY
   * ==========================================================
   */

  async query(
    query: MemoryQuery
  ): Promise<SovereignMemoryRecord[]> {
    this.requireAccess(
      "READ",
      query.context
    );

    const result:
      SovereignMemoryRecord[] = [];

    for (
      const record of
      this.records.values()
    ) {
      this.refreshExpiration(record);

      if (
        record.status === "DELETED" ||
        record.status === "EXPIRED"
      ) {
        continue;
      }

      if (
        query.id &&
        record.id !== query.id
      ) {
        continue;
      }

      if (
        query.key &&
        record.key !== query.key
      ) {
        continue;
      }

      if (
        query.type &&
        record.type !== query.type
      ) {
        continue;
      }

      if (
        query.ownerId &&
        record.ownerId !== query.ownerId
      ) {
        continue;
      }

      if (
        query.projectId &&
        record.projectId !== query.projectId
      ) {
        continue;
      }

      if (
        query.taskId &&
        record.taskId !== query.taskId
      ) {
        continue;
      }

      if (
        query.jobId &&
        record.jobId !== query.jobId
      ) {
        continue;
      }

      if (
        query.agentId &&
        record.agentId !== query.agentId
      ) {
        continue;
      }

      if (
        query.status &&
        record.status !== query.status
      ) {
        continue;
      }

      if (
        query.tags &&
        !query.tags.every(
          (tag) =>
            record.tags.includes(tag)
        )
      ) {
        continue;
      }

      try {
        this.requireAccess(
          "READ",
          query.context,
          record
        );

        result.push(record);
      } catch {
        continue;
      }

      if (
        query.limit &&
        result.length >= query.limit
      ) {
        break;
      }
    }

    return result;
  }

  /* ==========================================================
   * UPDATE
   * ==========================================================
   */

  async update(
    memoryId: string,
    context: MemoryAccessContext,
    changes: {
      value?: unknown;
      tags?: string[];
      accessPolicy?: string;
      expiresAt?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<SovereignMemoryRecord> {
    const record =
      this.requireRecord(memoryId);

    this.requireAccess(
      "UPDATE",
      context,
      record
    );

    if (
      Object.prototype.hasOwnProperty.call(
        changes,
        "value"
      )
    ) {
      record.value =
        changes.value;
    }

    if (changes.tags) {
      record.tags =
        changes.tags;
    }

    if (
      changes.accessPolicy !== undefined
    ) {
      record.accessPolicy =
        changes.accessPolicy;
    }

    if (
      changes.expiresAt !== undefined
    ) {
      record.expiresAt =
        changes.expiresAt;
    }

    if (changes.metadata) {
      record.metadata = {
        ...(record.metadata ?? {}),
        ...changes.metadata,
      };
    }

    record.updatedAt =
      this.now();

    await this.publish(
      "memory.updated",
      context,
      record.id,
      {
        key: record.key,
      }
    );

    await this.recordAudit(
      "memory.update",
      context.actorId,
      record.id,
      "SUCCESS"
    );

    return record;
  }

  /* ==========================================================
   * ARCHIVE
   * ==========================================================
   */

  async archive(
    memoryId: string,
    context: MemoryAccessContext
  ): Promise<SovereignMemoryRecord> {
    const record =
      this.requireRecord(memoryId);

    this.requireAccess(
      "ARCHIVE",
      context,
      record
    );

    record.status =
      "ARCHIVED";

    record.updatedAt =
      this.now();

    await this.publish(
      "memory.archived",
      context,
      record.id,
      {}
    );

    await this.recordAudit(
      "memory.archive",
      context.actorId,
      record.id,
      "SUCCESS"
    );

    return record;
  }

  /* ==========================================================
   * DELETE
   * ==========================================================
   */

  async delete(
    memoryId: string,
    context: MemoryAccessContext
  ): Promise<void> {
    const record =
      this.requireRecord(memoryId);

    this.requireAccess(
      "DELETE",
      context,
      record
    );

    /*
     * Soft deletion preserves traceability.
     */
    record.status =
      "DELETED";

    record.updatedAt =
      this.now();

    await this.publish(
      "memory.deleted",
      context,
      record.id,
      {}
    );

    await this.recordAudit(
      "memory.delete",
      context.actorId,
      record.id,
      "SUCCESS"
    );
  }

  /* ==========================================================
   * CLEAN EXPIRED
   * ==========================================================
   */

  cleanExpired(): number {
    let count = 0;

    for (
      const record of
      this.records.values()
    ) {
      const previous =
        record.status;

      this.refreshExpiration(
        record
      );

      if (
        previous !== "EXPIRED" &&
        record.status === "EXPIRED"
      ) {
        count += 1;
      }
    }

    return count;
  }

  /* ==========================================================
   * STATISTICS
   * ==========================================================
   */

  statistics(): {
    total: number;
    active: number;
    archived: number;
    expired: number;
    deleted: number;
    byType: Record<
      SovereignMemoryType,
      number
    >;
  } {
    const byType =
      this.emptyTypeStats();

    let active = 0;
    let archived = 0;
    let expired = 0;
    let deleted = 0;

    for (
      const record of
      this.records.values()
    ) {
      this.refreshExpiration(
        record
      );

      byType[record.type] += 1;

      switch (record.status) {
        case "ACTIVE":
          active += 1;
          break;

        case "ARCHIVED":
          archived += 1;
          break;

        case "EXPIRED":
          expired += 1;
          break;

        case "DELETED":
          deleted += 1;
          break;
      }
    }

    return {
      total:
        this.records.size,

      active,

      archived,

      expired,

      deleted,

      byType,
    };
  }

  /* ==========================================================
   * ACCESS
   * ==========================================================
   */

  private requireAccess(
    operation:
      | "READ"
      | "WRITE"
      | "UPDATE"
      | "DELETE"
      | "ARCHIVE",
    context: MemoryAccessContext,
    record?: SovereignMemoryRecord
  ): void {
    if (!context.policyChecked) {
      throw new Error(
        "Memory access blocked: policy check required."
      );
    }

    if (!context.permissionChecked) {
      throw new Error(
        "Memory access blocked: permission check required."
      );
    }

    if (
      this.accessValidator
    ) {
      const result =
        this.accessValidator.validate(
          operation,
          context,
          record
        );

      if (!result.allowed) {
        throw new Error(
          result.reason ??
            "Memory access denied."
        );
      }
    }
  }

  /* ==========================================================
   * EXPIRATION
   * ==========================================================
   */

  private refreshExpiration(
    record: SovereignMemoryRecord
  ): void {
    if (
      !record.expiresAt ||
      record.status === "DELETED"
    ) {
      return;
    }

    const expiration =
      new Date(
        record.expiresAt
      ).getTime();

    if (
      Number.isFinite(expiration) &&
      expiration <= Date.now()
    ) {
      record.status =
        "EXPIRED";

      record.updatedAt =
        this.now();
    }
  }

  /* ==========================================================
   * RECORD
   * ==========================================================
   */

  private requireRecord(
    memoryId: string
  ): SovereignMemoryRecord {
    const record =
      this.records.get(memoryId);

    if (!record) {
      throw new Error(
        `Memory record not found: ${memoryId}`
      );
    }

    return record;
  }

  /* ==========================================================
   * EVENTS
   * ==========================================================
   */

  private async publish(
    type: string,
    context: MemoryAccessContext,
    memoryId: string | undefined,
    payload: Record<string, unknown>
  ): Promise<void> {
    if (!this.eventBus) {
      return;
    }

    await this.eventBus.publish({
      id:
        this.createId(
          "MEM-EVENT"
        ),

      type,

      source:
        this.id,

      memoryId,

      actorId:
        context.actorId,

      timestamp:
        this.now(),

      payload,
    });
  }

  /* ==========================================================
   * AUDIT
   * ==========================================================
   */

  private async recordAudit(
    operation: string,
    actorId: string,
    memoryId: string | undefined,
    result:
      | "SUCCESS"
      | "FAILED"
      | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.audit) {
      return;
    }

    await this.audit.record(
      operation,
      actorId,
      memoryId,
      result,
      metadata
    );
  }

  /* ==========================================================
   * TYPE STATS
   * ==========================================================
   */

  private emptyTypeStats():
    Record<
      SovereignMemoryType,
      number
    > {
    return {
      RUNTIME: 0,
      TASK: 0,
      PROJECT: 0,
      KNOWLEDGE: 0,
      HISTORY: 0,
      RESULT: 0,
      LESSON: 0,
      CONFIGURATION: 0,
    };
  }

  /* ==========================================================
   * HELPERS
   * ==========================================================
   */

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  private now(): string {
    return new Date()
      .toISOString();
  }
}

/* ============================================================
 * 10. FACTORY
 * ============================================================
 */

export function createSovereignMemoryEngine():
  SovereignMemoryEngine {
  return new SovereignMemoryEngine();
}

/* ============================================================
 * 11. ARCHITECTURAL CONTRACT
 * ============================================================
 */

export const SOVEREIGN_MEMORY_CONTRACT = {
  id:
    "SOVEREIGN-MEMORY-11",

  role:
    "CENTRAL_SOVEREIGN_MEMORY",

  authority:
    "NONE",

  policyRequired:
    true,

  permissionRequired:
    true,

  traceable:
    true,

  retentionManaged:
    true,

  supportsExpiration:
    true,

  supportsArchiving:
    true,

  supportsAudit:
    true,

  supportsEvents:
    true,

  memoryTypes: [
    "RUNTIME",
    "TASK",
    "PROJECT",
    "KNOWLEDGE",
    "HISTORY",
    "RESULT",
    "LESSON",
    "CONFIGURATION",
  ],
} as const;

/* ============================================================
 * END OF SOVEREIGN-MEMORY-11
 * ============================================================
 */
