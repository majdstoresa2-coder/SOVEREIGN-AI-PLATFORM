// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-IDEMPOTENCY-106.ts
// Sequence: 106
// Purpose: Sovereign Operations Idempotency & Duplicate Execution Protection
// ============================================================================

export const SOVEREIGN_OPERATIONS_IDEMPOTENCY_ID =
  "SOVEREIGN-OPERATIONS-IDEMPOTENCY-106";

export const SOVEREIGN_OPERATIONS_IDEMPOTENCY_VERSION = "1.0.0";

export type SovereignIdempotencyState =
  | "REGISTERED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED";

export interface SovereignIdempotencyAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignIdempotencyRequest {
  idempotencyKey: string;
  operationId: string;

  requestedBy: string;
  target: string;

  authorityContext: SovereignIdempotencyAuthorityContext;

  createdAt: number;

  ttlMs: number;

  payloadHash?: string;
}

export interface SovereignIdempotencyRecord {
  idempotencyKey: string;
  operationId: string;

  requestedBy: string;
  target: string;

  payloadHash?: string;

  state: SovereignIdempotencyState;

  createdAt: number;
  updatedAt: number;
  expiresAt: number;

  resultHash?: string;

  authority: "NONE";
}

export interface SovereignIdempotencyResult {
  idempotencyKey: string;
  operationId: string;

  allowed: boolean;
  duplicate: boolean;

  state: SovereignIdempotencyState;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsIdempotency {
  public readonly id =
    SOVEREIGN_OPERATIONS_IDEMPOTENCY_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_IDEMPOTENCY_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly idempotencyCanCreateAuthority = false;
  public readonly idempotencyCanEscalateAuthority = false;
  public readonly idempotencyCanOverrideOwner = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignIdempotencyRecord>();

  private validateAuthority(
    request: SovereignIdempotencyRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.authorityContext.ownerId) {
      reasons.push("OWNER_ID_REQUIRED");
    }

    if (
      request.authorityContext.ownerAuthority !==
      "SUPREME"
    ) {
      reasons.push("OWNER_MUST_REMAIN_SUPREME");
    }

    if (
      request.authorityContext.stewardAuthority !==
      "DELEGATED"
    ) {
      reasons.push("STEWARD_MUST_REMAIN_DELEGATED");
    }

    if (!request.requestedBy) {
      reasons.push("REQUESTER_REQUIRED");
    }

    return reasons;
  }

  private cleanupExpired(
    now = Date.now()
  ): void {
    for (const [key, record] of this.records) {
      if (record.expiresAt <= now) {
        record.state = "EXPIRED";
        this.records.delete(key);
      }
    }
  }

  public register(
    request: SovereignIdempotencyRequest
  ): SovereignIdempotencyResult {
    const now = Date.now();

    this.cleanupExpired(now);

    const reasons =
      this.validateAuthority(request);

    if (!request.idempotencyKey) {
      reasons.push("IDEMPOTENCY_KEY_REQUIRED");
    }

    if (!request.operationId) {
      reasons.push("OPERATION_ID_REQUIRED");
    }

    if (!request.target) {
      reasons.push("TARGET_REQUIRED");
    }

    if (
      !Number.isFinite(request.ttlMs) ||
      request.ttlMs <= 0
    ) {
      reasons.push("INVALID_TTL");
    }

    const existing =
      this.records.get(request.idempotencyKey);

    if (existing) {
      if (
        request.payloadHash &&
        existing.payloadHash &&
        request.payloadHash !== existing.payloadHash
      ) {
        return {
          idempotencyKey: request.idempotencyKey,
          operationId: request.operationId,

          allowed: false,
          duplicate: true,

          state: existing.state,

          reasons: ["IDEMPOTENCY_PAYLOAD_MISMATCH"],

          timestamp: now,

          authority: "NONE"
        };
      }

      return {
        idempotencyKey: request.idempotencyKey,
        operationId: existing.operationId,

        allowed: false,
        duplicate: true,

        state: existing.state,

        reasons: ["DUPLICATE_OPERATION"],

        timestamp: now,

        authority: "NONE"
      };
    }

    if (reasons.length > 0) {
      return {
        idempotencyKey: request.idempotencyKey,
        operationId: request.operationId,

        allowed: false,
        duplicate: false,

        state: "FAILED",

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignIdempotencyRecord = {
      idempotencyKey: request.idempotencyKey,
      operationId: request.operationId,

      requestedBy: request.requestedBy,
      target: request.target,

      payloadHash: request.payloadHash,

      state: "REGISTERED",

      createdAt: request.createdAt,
      updatedAt: now,
      expiresAt: now + request.ttlMs,

      authority: "NONE"
    };

    this.records.set(
      request.idempotencyKey,
      record
    );

    return {
      idempotencyKey: request.idempotencyKey,
      operationId: request.operationId,

      allowed: true,
      duplicate: false,

      state: "REGISTERED",

      reasons: [],

      timestamp: now,

      authority: "NONE"
    };
  }

  public markInProgress(
    idempotencyKey: string
  ): SovereignIdempotencyResult {
    this.cleanupExpired();

    const record =
      this.records.get(idempotencyKey);

    if (!record) {
      return this.failure(
        idempotencyKey,
        "",
        "IDEMPOTENCY_RECORD_NOT_FOUND"
      );
    }

    if (
      record.state !== "REGISTERED" &&
      record.state !== "FAILED"
    ) {
      return this.failure(
        record.idempotencyKey,
        record.operationId,
        "INVALID_STATE_FOR_IN_PROGRESS"
      );
    }

    record.state = "IN_PROGRESS";
    record.updatedAt = Date.now();

    this.records.set(idempotencyKey, record);

    return this.success(record);
  }

  public complete(
    idempotencyKey: string,
    resultHash?: string
  ): SovereignIdempotencyResult {
    this.cleanupExpired();

    const record =
      this.records.get(idempotencyKey);

    if (!record) {
      return this.failure(
        idempotencyKey,
        "",
        "IDEMPOTENCY_RECORD_NOT_FOUND"
      );
    }

    if (record.state !== "IN_PROGRESS") {
      return this.failure(
        record.idempotencyKey,
        record.operationId,
        "OPERATION_NOT_IN_PROGRESS"
      );
    }

    record.state = "COMPLETED";
    record.resultHash = resultHash;
    record.updatedAt = Date.now();

    this.records.set(idempotencyKey, record);

    return this.success(record);
  }

  public fail(
    idempotencyKey: string
  ): SovereignIdempotencyResult {
    this.cleanupExpired();

    const record =
      this.records.get(idempotencyKey);

    if (!record) {
      return this.failure(
        idempotencyKey,
        "",
        "IDEMPOTENCY_RECORD_NOT_FOUND"
      );
    }

    record.state = "FAILED";
    record.updatedAt = Date.now();

    this.records.set(idempotencyKey, record);

    return this.success(record);
  }

  public getRecord(
    idempotencyKey: string
  ): SovereignIdempotencyRecord | undefined {
    this.cleanupExpired();

    const record =
      this.records.get(idempotencyKey);

    return record
      ? { ...record }
      : undefined;
  }

  public hasProcessed(
    idempotencyKey: string
  ): boolean {
    this.cleanupExpired();

    const record =
      this.records.get(idempotencyKey);

    return (
      record?.state === "COMPLETED" ||
      record?.state === "IN_PROGRESS"
    );
  }

  private success(
    record: SovereignIdempotencyRecord
  ): SovereignIdempotencyResult {
    return {
      idempotencyKey: record.idempotencyKey,
      operationId: record.operationId,

      allowed: true,
      duplicate: false,

      state: record.state,

      reasons: [],

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  private failure(
    idempotencyKey: string,
    operationId: string,
    reason: string
  ): SovereignIdempotencyResult {
    return {
      idempotencyKey,
      operationId,

      allowed: false,
      duplicate: false,

      state: "FAILED",

      reasons: [reason],

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  public assertSovereignty(): boolean {
    return (
      this.authority === "NONE" &&
      this.ownerAuthority === "SUPREME" &&
      this.stewardAuthority === "DELEGATED" &&
      this.idempotencyCanCreateAuthority === false &&
      this.idempotencyCanEscalateAuthority === false &&
      this.idempotencyCanOverrideOwner === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsIdempotency =
  new SovereignOperationsIdempotency();

export default sovereignOperationsIdempotency;
