// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-LOCK-105.ts
// Sequence: 105
// Purpose: Sovereign Operations Concurrency & Lock Control
// ============================================================================

export const SOVEREIGN_OPERATIONS_LOCK_ID =
  "SOVEREIGN-OPERATIONS-LOCK-105";

export const SOVEREIGN_OPERATIONS_LOCK_VERSION = "1.0.0";

export type SovereignLockMode =
  | "SHARED"
  | "EXCLUSIVE";

export type SovereignLockState =
  | "REQUESTED"
  | "ACQUIRED"
  | "RENEWED"
  | "RELEASED"
  | "EXPIRED"
  | "REJECTED";

export interface SovereignLockAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignLockRequest {
  lockId: string;
  operationId: string;

  target: string;
  mode: SovereignLockMode;

  requestedBy: string;

  authorityContext: SovereignLockAuthorityContext;

  requestedAt: number;

  ttlMs: number;
}

export interface SovereignLockRecord {
  lockId: string;
  operationId: string;

  target: string;
  mode: SovereignLockMode;

  state: SovereignLockState;

  holder: string;

  acquiredAt: number;
  expiresAt: number;

  renewedAt?: number;
  releasedAt?: number;

  authority: "NONE";
}

export interface SovereignLockResult {
  lockId: string;
  operationId: string;

  target: string;

  state: SovereignLockState;

  acquired: boolean;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsLock {
  public readonly id =
    SOVEREIGN_OPERATIONS_LOCK_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_LOCK_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly lockCanCreateAuthority = false;
  public readonly lockCanEscalateAuthority = false;
  public readonly lockCanOverrideOwner = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly locks =
    new Map<string, SovereignLockRecord>();

  private validateAuthority(
    request: SovereignLockRequest
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

  private cleanupExpiredLocks(
    now = Date.now()
  ): void {
    for (const [lockId, lock] of this.locks) {
      if (
        lock.state === "ACQUIRED" &&
        lock.expiresAt <= now
      ) {
        lock.state = "EXPIRED";
        this.locks.delete(lockId);
      }
    }
  }

  private getActiveLocksForTarget(
    target: string
  ): SovereignLockRecord[] {
    this.cleanupExpiredLocks();

    return [...this.locks.values()].filter(
      (lock) =>
        lock.target === target &&
        (
          lock.state === "ACQUIRED" ||
          lock.state === "RENEWED"
        )
    );
  }

  private hasConflict(
    request: SovereignLockRequest
  ): boolean {
    const activeLocks =
      this.getActiveLocksForTarget(request.target);

    if (activeLocks.length === 0) {
      return false;
    }

    if (request.mode === "EXCLUSIVE") {
      return true;
    }

    return activeLocks.some(
      (lock) => lock.mode === "EXCLUSIVE"
    );
  }

  public acquire(
    request: SovereignLockRequest
  ): SovereignLockResult {
    const now = Date.now();

    const reasons =
      this.validateAuthority(request);

    if (!request.lockId) {
      reasons.push("LOCK_ID_REQUIRED");
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
      reasons.push("INVALID_LOCK_TTL");
    }

    if (this.locks.has(request.lockId)) {
      reasons.push("LOCK_ID_ALREADY_EXISTS");
    }

    if (this.hasConflict(request)) {
      reasons.push("LOCK_CONFLICT");
    }

    if (reasons.length > 0) {
      return {
        lockId: request.lockId,
        operationId: request.operationId,

        target: request.target,

        state: "REJECTED",

        acquired: false,

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignLockRecord = {
      lockId: request.lockId,
      operationId: request.operationId,

      target: request.target,
      mode: request.mode,

      state: "ACQUIRED",

      holder: request.requestedBy,

      acquiredAt: now,
      expiresAt: now + request.ttlMs,

      authority: "NONE"
    };

    this.locks.set(
      request.lockId,
      record
    );

    return {
      lockId: record.lockId,
      operationId: record.operationId,

      target: record.target,

      state: "ACQUIRED",

      acquired: true,

      reasons: [],

      timestamp: now,

      authority: "NONE"
    };
  }

  public renew(
    lockId: string,
    holder: string,
    ttlMs: number
  ): SovereignLockResult {
    this.cleanupExpiredLocks();

    const lock = this.locks.get(lockId);
    const now = Date.now();

    if (!lock) {
      return this.failure(
        lockId,
        "",
        "",
        "LOCK_NOT_FOUND"
      );
    }

    if (lock.holder !== holder) {
      return this.failure(
        lock.lockId,
        lock.operationId,
        lock.target,
        "LOCK_HOLDER_MISMATCH"
      );
    }

    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      return this.failure(
        lock.lockId,
        lock.operationId,
        lock.target,
        "INVALID_LOCK_TTL"
      );
    }

    lock.state = "RENEWED";
    lock.renewedAt = now;
    lock.expiresAt = now + ttlMs;

    this.locks.set(lockId, lock);

    return {
      lockId: lock.lockId,
      operationId: lock.operationId,

      target: lock.target,

      state: "RENEWED",

      acquired: true,

      reasons: [],

      timestamp: now,

      authority: "NONE"
    };
  }

  public release(
    lockId: string,
    holder: string
  ): SovereignLockResult {
    this.cleanupExpiredLocks();

    const lock = this.locks.get(lockId);

    if (!lock) {
      return this.failure(
        lockId,
        "",
        "",
        "LOCK_NOT_FOUND"
      );
    }

    if (lock.holder !== holder) {
      return this.failure(
        lock.lockId,
        lock.operationId,
        lock.target,
        "LOCK_HOLDER_MISMATCH"
      );
    }

    const now = Date.now();

    lock.state = "RELEASED";
    lock.releasedAt = now;

    this.locks.delete(lockId);

    return {
      lockId: lock.lockId,
      operationId: lock.operationId,

      target: lock.target,

      state: "RELEASED",

      acquired: false,

      reasons: [],

      timestamp: now,

      authority: "NONE"
    };
  }

  public isLocked(
    target: string
  ): boolean {
    return (
      this.getActiveLocksForTarget(target)
        .length > 0
    );
  }

  public getLock(
    lockId: string
  ): SovereignLockRecord | undefined {
    this.cleanupExpiredLocks();

    const lock = this.locks.get(lockId);

    return lock
      ? { ...lock }
      : undefined;
  }

  public getLocksForTarget(
    target: string
  ): SovereignLockRecord[] {
    return this.getActiveLocksForTarget(target)
      .map((lock) => ({ ...lock }));
  }

  private failure(
    lockId: string,
    operationId: string,
    target: string,
    reason: string
  ): SovereignLockResult {
    return {
      lockId,
      operationId,
      target,

      state: "REJECTED",

      acquired: false,

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
      this.lockCanCreateAuthority === false &&
      this.lockCanEscalateAuthority === false &&
      this.lockCanOverrideOwner === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsLock =
  new SovereignOperationsLock();

export default sovereignOperationsLock;
