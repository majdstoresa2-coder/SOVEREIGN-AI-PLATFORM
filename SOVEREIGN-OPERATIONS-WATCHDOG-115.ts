// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-WATCHDOG-115.ts
// Sequence: 115
// Purpose: Sovereign Operations Watchdog, Stall Detection & Recovery Signals
// ============================================================================

export const SOVEREIGN_OPERATIONS_WATCHDOG_ID =
  "SOVEREIGN-OPERATIONS-WATCHDOG-115";

export const SOVEREIGN_OPERATIONS_WATCHDOG_VERSION = "1.0.0";

export type SovereignWatchdogHealth =
  | "HEALTHY"
  | "DEGRADED"
  | "STALLED"
  | "CRITICAL"
  | "FAILED"
  | "UNKNOWN";

export type SovereignWatchdogAction =
  | "NONE"
  | "RETRY"
  | "RECOVER"
  | "ROLLBACK"
  | "ESCALATE";

export interface SovereignWatchdogAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignWatchdogTarget {
  operationId: string;

  lifecycleId?: string;
  workerId?: string;
  dispatchId?: string;

  requestedBy: string;
  target: string;

  authorityContext: SovereignWatchdogAuthorityContext;

  health: SovereignWatchdogHealth;

  retryCount: number;
  maxRetries: number;

  rollbackAvailable: boolean;
  recoveryAvailable: boolean;

  lastActivityAt: number;
  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignWatchdogPolicy {
  degradedAfterMs: number;
  stalledAfterMs: number;
  criticalAfterMs: number;
  escalateAfterMs: number;
}

export interface SovereignWatchdogDecision {
  operationId: string;

  health: SovereignWatchdogHealth;

  action: SovereignWatchdogAction;

  allowed: boolean;

  reasons: string[];

  evaluatedAt: number;

  authority: "NONE";
}

export interface SovereignWatchdogRecord {
  operationId: string;

  lastHealth: SovereignWatchdogHealth;
  lastAction: SovereignWatchdogAction;

  retryCount: number;

  lastEvaluatedAt: number;

  reasons: string[];

  authority: "NONE";
}

export class SovereignOperationsWatchdog {
  public readonly id =
    SOVEREIGN_OPERATIONS_WATCHDOG_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_WATCHDOG_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly watchdogCanCreateAuthority = false;
  public readonly watchdogCanEscalateAuthority = false;
  public readonly watchdogCanOverrideOwner = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignWatchdogRecord>();

  private readonly policy: SovereignWatchdogPolicy;

  constructor(
    policy: SovereignWatchdogPolicy = {
      degradedAfterMs: 60_000,
      stalledAfterMs: 180_000,
      criticalAfterMs: 300_000,
      escalateAfterMs: 600_000
    }
  ) {
    this.policy = this.validatePolicy(policy);
  }

  private validatePolicy(
    policy: SovereignWatchdogPolicy
  ): SovereignWatchdogPolicy {
    if (
      policy.degradedAfterMs <= 0 ||
      policy.stalledAfterMs <= policy.degradedAfterMs ||
      policy.criticalAfterMs <= policy.stalledAfterMs ||
      policy.escalateAfterMs <= policy.criticalAfterMs
    ) {
      throw new Error(
        "INVALID_WATCHDOG_POLICY"
      );
    }

    return { ...policy };
  }

  private validateAuthority(
    target: SovereignWatchdogTarget
  ): string[] {
    const reasons: string[] = [];

    if (!target.authorityContext.ownerId) {
      reasons.push("OWNER_ID_REQUIRED");
    }

    if (
      target.authorityContext.ownerAuthority !==
      "SUPREME"
    ) {
      reasons.push("OWNER_MUST_REMAIN_SUPREME");
    }

    if (
      target.authorityContext.stewardAuthority !==
      "DELEGATED"
    ) {
      reasons.push("STEWARD_MUST_REMAIN_DELEGATED");
    }

    if (!target.requestedBy) {
      reasons.push("REQUESTER_REQUIRED");
    }

    return reasons;
  }

  private calculateHealth(
    target: SovereignWatchdogTarget,
    now = Date.now()
  ): SovereignWatchdogHealth {
    const inactivity =
      Math.max(
        0,
        now - target.lastActivityAt
      );

    if (target.health === "FAILED") {
      return "FAILED";
    }

    if (
      inactivity >=
      this.policy.escalateAfterMs
    ) {
      return "CRITICAL";
    }

    if (
      inactivity >=
      this.policy.criticalAfterMs
    ) {
      return "CRITICAL";
    }

    if (
      inactivity >=
      this.policy.stalledAfterMs
    ) {
      return "STALLED";
    }

    if (
      inactivity >=
      this.policy.degradedAfterMs
    ) {
      return "DEGRADED";
    }

    return target.health === "UNKNOWN"
      ? "UNKNOWN"
      : "HEALTHY";
  }

  private chooseAction(
    target: SovereignWatchdogTarget,
    health: SovereignWatchdogHealth,
    now = Date.now()
  ): SovereignWatchdogAction {
    const inactivity =
      Math.max(
        0,
        now - target.lastActivityAt
      );

    if (
      inactivity >=
      this.policy.escalateAfterMs
    ) {
      return "ESCALATE";
    }

    if (
      health === "HEALTHY" ||
      health === "UNKNOWN"
    ) {
      return "NONE";
    }

    if (
      health === "DEGRADED"
    ) {
      return "NONE";
    }

    if (
      health === "STALLED" &&
      target.retryCount < target.maxRetries
    ) {
      return "RETRY";
    }

    if (
      (
        health === "CRITICAL" ||
        health === "FAILED"
      ) &&
      target.recoveryAvailable
    ) {
      return "RECOVER";
    }

    if (
      (
        health === "CRITICAL" ||
        health === "FAILED"
      ) &&
      target.rollbackAvailable
    ) {
      return "ROLLBACK";
    }

    return "ESCALATE";
  }

  public evaluate(
    target: SovereignWatchdogTarget
  ): SovereignWatchdogDecision {
    const now = Date.now();

    const reasons =
      this.validateAuthority(target);

    if (!target.operationId) {
      reasons.push("OPERATION_ID_REQUIRED");
    }

    if (!target.target) {
      reasons.push("TARGET_REQUIRED");
    }

    if (
      !Number.isInteger(target.retryCount) ||
      target.retryCount < 0
    ) {
      reasons.push("INVALID_RETRY_COUNT");
    }

    if (
      !Number.isInteger(target.maxRetries) ||
      target.maxRetries < 0
    ) {
      reasons.push("INVALID_MAX_RETRIES");
    }

    if (reasons.length > 0) {
      return {
        operationId: target.operationId,

        health: "UNKNOWN",

        action: "NONE",

        allowed: false,

        reasons,

        evaluatedAt: now,

        authority: "NONE"
      };
    }

    const health =
      this.calculateHealth(target, now);

    const action =
      this.chooseAction(
        target,
        health,
        now
      );

    const decisionReasons: string[] = [];

    if (health === "DEGRADED") {
      decisionReasons.push(
        "OPERATION_DEGRADED"
      );
    }

    if (health === "STALLED") {
      decisionReasons.push(
        "OPERATION_STALLED"
      );
    }

    if (health === "CRITICAL") {
      decisionReasons.push(
        "OPERATION_CRITICAL"
      );
    }

    if (health === "FAILED") {
      decisionReasons.push(
        "OPERATION_FAILED"
      );
    }

    if (action === "RETRY") {
      decisionReasons.push(
        "RETRY_RECOMMENDED"
      );
    }

    if (action === "RECOVER") {
      decisionReasons.push(
        "RECOVERY_RECOMMENDED"
      );
    }

    if (action === "ROLLBACK") {
      decisionReasons.push(
        "ROLLBACK_RECOMMENDED"
      );
    }

    if (action === "ESCALATE") {
      decisionReasons.push(
        "OWNER_OR_STEWARD_REVIEW_REQUIRED"
      );
    }

    const record: SovereignWatchdogRecord = {
      operationId: target.operationId,

      lastHealth: health,
      lastAction: action,

      retryCount: target.retryCount,

      lastEvaluatedAt: now,

      reasons: [...decisionReasons],

      authority: "NONE"
    };

    this.records.set(
      target.operationId,
      record
    );

    return {
      operationId: target.operationId,

      health,

      action,

      allowed: true,

      reasons: decisionReasons,

      evaluatedAt: now,

      authority: "NONE"
    };
  }

  public recordRetry(
    operationId: string
  ): SovereignWatchdogRecord | undefined {
    const record =
      this.records.get(operationId);

    if (!record) {
      return undefined;
    }

    record.retryCount += 1;
    record.lastAction = "RETRY";
    record.lastEvaluatedAt = Date.now();

    this.records.set(
      operationId,
      record
    );

    return {
      ...record,
      reasons: [...record.reasons]
    };
  }

  public clear(
    operationId: string
  ): boolean {
    return this.records.delete(
      operationId
    );
  }

  public getRecord(
    operationId: string
  ): SovereignWatchdogRecord | undefined {
    const record =
      this.records.get(operationId);

    return record
      ? {
          ...record,
          reasons: [...record.reasons]
        }
      : undefined;
  }

  public getCritical():
    SovereignWatchdogRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.lastHealth === "CRITICAL" ||
          record.lastHealth === "FAILED" ||
          record.lastAction === "ESCALATE"
      )
      .map((record) => ({
        ...record,
        reasons: [...record.reasons]
      }));
  }

  public assertSovereignty(): boolean {
    return (
      this.authority === "NONE" &&
      this.ownerAuthority === "SUPREME" &&
      this.stewardAuthority === "DELEGATED" &&
      this.watchdogCanCreateAuthority === false &&
      this.watchdogCanEscalateAuthority === false &&
      this.watchdogCanOverrideOwner === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsWatchdog =
  new SovereignOperationsWatchdog();

export default sovereignOperationsWatchdog;
