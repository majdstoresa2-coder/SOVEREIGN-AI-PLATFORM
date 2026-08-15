// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-GRACEFUL-SHUTDOWN-129.ts
// Sequence: 129
// Purpose: Sovereign Graceful Shutdown, Drain Control & State Preservation
// ============================================================================

export const SOVEREIGN_OPERATIONS_GRACEFUL_SHUTDOWN_ID =
  "SOVEREIGN-OPERATIONS-GRACEFUL-SHUTDOWN-129";

export const SOVEREIGN_OPERATIONS_GRACEFUL_SHUTDOWN_VERSION =
  "1.0.0";

export type SovereignShutdownState =
  | "ACTIVE"
  | "DRAINING"
  | "PRESERVING_STATE"
  | "READY_TO_STOP"
  | "STOPPED"
  | "RECOVERY_REQUIRED"
  | "BLOCKED";

export type SovereignShutdownDecision =
  | "CONTINUE"
  | "DRAIN"
  | "PRESERVE"
  | "STOP"
  | "RECOVER"
  | "BLOCK";

export interface SovereignShutdownAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignShutdownPolicy {
  drainTimeoutMs: number;

  requireStatePreservation: boolean;
  requireQueuePreservation: boolean;
  requireRecoveryCheckpoint: boolean;

  allowForceAfterTimeout: boolean;
}

export interface SovereignShutdownRequest {
  shutdownId: string;
  target: string;

  requestedBy: string;

  reason: string;

  authorityContext: SovereignShutdownAuthorityContext;

  policy: SovereignShutdownPolicy;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;
}

export interface SovereignShutdownRuntimeStatus {
  activeOperations: number;
  queuedOperations: number;

  statePreserved: boolean;
  queuePreserved: boolean;
  recoveryCheckpointCreated: boolean;
}

export interface SovereignShutdownRecord {
  shutdownId: string;
  target: string;

  requestedBy: string;
  reason: string;

  state: SovereignShutdownState;

  startedAt?: number;
  drainDeadlineAt?: number;
  stoppedAt?: number;

  activeOperations: number;
  queuedOperations: number;

  statePreserved: boolean;
  queuePreserved: boolean;
  recoveryCheckpointCreated: boolean;

  createdAt: number;
  updatedAt: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignShutdownResult {
  shutdownId: string;
  target: string;

  accepted: boolean;

  state: SovereignShutdownState;
  decision: SovereignShutdownDecision;

  remainingDrainMs?: number;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsGracefulShutdown {
  public readonly id =
    SOVEREIGN_OPERATIONS_GRACEFUL_SHUTDOWN_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_GRACEFUL_SHUTDOWN_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly shutdownCanCreateAuthority = false;
  public readonly shutdownCanEscalateAuthority = false;
  public readonly shutdownCanOverrideOwner = false;
  public readonly shutdownCanBypassSecurity = false;
  public readonly shutdownCanDiscardActiveWork = false;
  public readonly shutdownCanDisableAudit = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignShutdownRecord>();

  private readonly policies =
    new Map<string, SovereignShutdownPolicy>();

  private validate(
    request: SovereignShutdownRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.shutdownId) {
      reasons.push("SHUTDOWN_ID_REQUIRED");
    }

    if (!request.target) {
      reasons.push("TARGET_REQUIRED");
    }

    if (!request.requestedBy) {
      reasons.push("REQUESTER_REQUIRED");
    }

    if (!request.reason) {
      reasons.push("SHUTDOWN_REASON_REQUIRED");
    }

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

    if (!request.securityApproved) {
      reasons.push("SECURITY_APPROVAL_REQUIRED");
    }

    if (!request.policyApproved) {
      reasons.push("POLICY_APPROVAL_REQUIRED");
    }

    if (
      !Number.isFinite(
        request.policy.drainTimeoutMs
      ) ||
      request.policy.drainTimeoutMs < 1
    ) {
      reasons.push("INVALID_DRAIN_TIMEOUT");
    }

    return reasons;
  }

  public register(
    request: SovereignShutdownRequest
  ): SovereignShutdownResult {
    const now = Date.now();

    if (
      this.records.has(request.shutdownId)
    ) {
      return this.failure(
        request.shutdownId,
        request.target,
        "SHUTDOWN_ALREADY_EXISTS"
      );
    }

    const reasons = this.validate(request);

    if (reasons.length > 0) {
      return {
        shutdownId: request.shutdownId,
        target: request.target,

        accepted: false,

        state: "BLOCKED",
        decision: "BLOCK",

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignShutdownRecord = {
      shutdownId: request.shutdownId,
      target: request.target,

      requestedBy: request.requestedBy,
      reason: request.reason,

      state: "ACTIVE",

      activeOperations: 0,
      queuedOperations: 0,

      statePreserved: false,
      queuePreserved: false,
      recoveryCheckpointCreated: false,

      createdAt: request.createdAt,
      updatedAt: now,

      reasons: [],

      authority: "NONE"
    };

    this.records.set(
      record.shutdownId,
      record
    );

    this.policies.set(
      record.shutdownId,
      { ...request.policy }
    );

    return this.result(
      record,
      "CONTINUE",
      now
    );
  }

  public beginDrain(
    shutdownId: string,
    status: SovereignShutdownRuntimeStatus,
    now = Date.now()
  ): SovereignShutdownResult {
    const record =
      this.records.get(shutdownId);

    const policy =
      this.policies.get(shutdownId);

    if (!record || !policy) {
      return this.failure(
        shutdownId,
        "",
        "SHUTDOWN_NOT_FOUND"
      );
    }

    if (record.state !== "ACTIVE") {
      return this.failure(
        record.shutdownId,
        record.target,
        "SHUTDOWN_NOT_ACTIVE"
      );
    }

    record.state = "DRAINING";

    record.startedAt = now;

    record.drainDeadlineAt =
      now + policy.drainTimeoutMs;

    this.applyStatus(
      record,
      status
    );

    record.updatedAt = now;

    record.reasons = [
      "NEW_OPERATIONS_MUST_STOP"
    ];

    this.records.set(
      shutdownId,
      record
    );

    return this.result(
      record,
      "DRAIN",
      now
    );
  }

  public evaluate(
    shutdownId: string,
    status: SovereignShutdownRuntimeStatus,
    now = Date.now()
  ): SovereignShutdownResult {
    const record =
      this.records.get(shutdownId);

    const policy =
      this.policies.get(shutdownId);

    if (!record || !policy) {
      return this.failure(
        shutdownId,
        "",
        "SHUTDOWN_NOT_FOUND"
      );
    }

    this.applyStatus(
      record,
      status
    );

    record.updatedAt = now;

    if (
      record.state === "STOPPED"
    ) {
      return this.result(
        record,
        "STOP",
        now
      );
    }

    if (
      record.activeOperations > 0
    ) {
      if (
        record.drainDeadlineAt !== undefined &&
        now >= record.drainDeadlineAt
      ) {
        if (
          policy.allowForceAfterTimeout &&
          this.preservationSatisfied(
            record,
            policy
          )
        ) {
          record.state =
            "READY_TO_STOP";

          record.reasons = [
            "DRAIN_TIMEOUT_REACHED",
            "PRESERVATION_COMPLETE"
          ];

          this.records.set(
            shutdownId,
            record
          );

          return this.result(
            record,
            "STOP",
            now
          );
        }

        record.state =
          "RECOVERY_REQUIRED";

        record.reasons = [
          "DRAIN_TIMEOUT_REACHED",
          "ACTIVE_WORK_REQUIRES_RECOVERY"
        ];

        this.records.set(
          shutdownId,
          record
        );

        return this.result(
          record,
          "RECOVER",
          now
        );
      }

      record.state = "DRAINING";

      record.reasons = [
        "WAITING_FOR_ACTIVE_OPERATIONS"
      ];

      this.records.set(
        shutdownId,
        record
      );

      return this.result(
        record,
        "DRAIN",
        now
      );
    }

    if (
      !this.preservationSatisfied(
        record,
        policy
      )
    ) {
      record.state =
        "PRESERVING_STATE";

      record.reasons = [
        "STATE_PRESERVATION_REQUIRED"
      ];

      this.records.set(
        shutdownId,
        record
      );

      return this.result(
        record,
        "PRESERVE",
        now
      );
    }

    record.state =
      "READY_TO_STOP";

    record.reasons = [
      "SAFE_SHUTDOWN_READY"
    ];

    this.records.set(
      shutdownId,
      record
    );

    return this.result(
      record,
      "STOP",
      now
    );
  }

  public confirmStopped(
    shutdownId: string,
    now = Date.now()
  ): SovereignShutdownResult {
    const record =
      this.records.get(shutdownId);

    if (!record) {
      return this.failure(
        shutdownId,
        "",
        "SHUTDOWN_NOT_FOUND"
      );
    }

    if (
      record.state !==
      "READY_TO_STOP"
    ) {
      return this.failure(
        record.shutdownId,
        record.target,
        "SHUTDOWN_NOT_READY_TO_STOP"
      );
    }

    record.state = "STOPPED";
    record.stoppedAt = now;
    record.updatedAt = now;

    record.reasons = [
      "TARGET_STOPPED_SAFELY"
    ];

    this.records.set(
      shutdownId,
      record
    );

    return this.result(
      record,
      "STOP",
      now
    );
  }

  private applyStatus(
    record: SovereignShutdownRecord,
    status: SovereignShutdownRuntimeStatus
  ): void {
    record.activeOperations =
      Math.max(
        0,
        status.activeOperations
      );

    record.queuedOperations =
      Math.max(
        0,
        status.queuedOperations
      );

    record.statePreserved =
      status.statePreserved;

    record.queuePreserved =
      status.queuePreserved;

    record.recoveryCheckpointCreated =
      status.recoveryCheckpointCreated;
  }

  private preservationSatisfied(
    record: SovereignShutdownRecord,
    policy: SovereignShutdownPolicy
  ): boolean {
    if (
      policy.requireStatePreservation &&
      !record.statePreserved
    ) {
      return false;
    }

    if (
      policy.requireQueuePreservation &&
      !record.queuePreserved
    ) {
      return false;
    }

    if (
      policy.requireRecoveryCheckpoint &&
      !record.recoveryCheckpointCreated
    ) {
      return false;
    }

    return true;
  }

  public getRecord(
    shutdownId: string
  ): SovereignShutdownRecord | undefined {
    const record =
      this.records.get(shutdownId);

    return record
      ? {
          ...record,
          reasons: [...record.reasons]
        }
      : undefined;
  }

  public getDraining():
    SovereignShutdownRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state === "DRAINING" ||
          record.state ===
            "PRESERVING_STATE"
      )
      .map((record) => ({
        ...record,
        reasons: [...record.reasons]
      }));
  }

  public getRecoveryRequired():
    SovereignShutdownRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state ===
          "RECOVERY_REQUIRED"
      )
      .map((record) => ({
        ...record,
        reasons: [...record.reasons]
      }));
  }

  private result(
    record: SovereignShutdownRecord,
    decision: SovereignShutdownDecision,
    now: number
  ): SovereignShutdownResult {
    return {
      shutdownId: record.shutdownId,
      target: record.target,

      accepted:
        decision !== "BLOCK",

      state: record.state,
      decision,

      remainingDrainMs:
        record.drainDeadlineAt !== undefined
          ? Math.max(
              0,
              record.drainDeadlineAt - now
            )
          : undefined,

      reasons: [...record.reasons],

      timestamp: now,

      authority: "NONE"
    };
  }

  private failure(
    shutdownId: string,
    target: string,
    reason: string
  ): SovereignShutdownResult {
    return {
      shutdownId,
      target,

      accepted: false,

      state: "BLOCKED",
      decision: "BLOCK",

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
      this.shutdownCanCreateAuthority === false &&
      this.shutdownCanEscalateAuthority === false &&
      this.shutdownCanOverrideOwner === false &&
      this.shutdownCanBypassSecurity === false &&
      this.shutdownCanDiscardActiveWork === false &&
      this.shutdownCanDisableAudit === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsGracefulShutdown =
  new SovereignOperationsGracefulShutdown();

export default sovereignOperationsGracefulShutdown;
