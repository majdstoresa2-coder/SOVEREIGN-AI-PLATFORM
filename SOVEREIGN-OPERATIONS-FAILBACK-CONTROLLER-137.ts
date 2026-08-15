// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-FAILBACK-CONTROLLER-137.ts
// Sequence: 137
// Purpose: Sovereign Safe Failback, Primary Restoration & Split-Brain Prevention
// ============================================================================

export const SOVEREIGN_OPERATIONS_FAILBACK_CONTROLLER_ID =
  "SOVEREIGN-OPERATIONS-FAILBACK-CONTROLLER-137";

export const SOVEREIGN_OPERATIONS_FAILBACK_CONTROLLER_VERSION =
  "1.0.0";

export type SovereignFailbackState =
  | "REGISTERED"
  | "WAITING_PRIMARY"
  | "PRIMARY_READY"
  | "DRAINING_STANDBY"
  | "SYNCHRONIZING"
  | "SWITCHING"
  | "VERIFYING"
  | "FAILED_BACK"
  | "RECOVERY_REQUIRED"
  | "BLOCKED";

export type SovereignFailbackDecision =
  | "WAIT"
  | "DRAIN"
  | "SYNC"
  | "SWITCH"
  | "VERIFY"
  | "COMPLETE"
  | "RECOVER"
  | "BLOCK";

export interface SovereignFailbackAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignFailbackPolicy {
  requirePrimaryHealthy: boolean;
  requireSynchronization: boolean;
  requireCapacity: boolean;

  requireStandbyDrain: boolean;

  preventSplitBrain: boolean;

  failbackTimeoutMs: number;
  heartbeatMaxAgeMs: number;
}

export interface SovereignFailbackRequest {
  failbackId: string;

  primaryId: string;
  activeStandbyId: string;

  requestedBy: string;

  authorityContext: SovereignFailbackAuthorityContext;

  policy: SovereignFailbackPolicy;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignFailbackStatus {
  primaryHealthy: boolean;
  primarySynchronized: boolean;
  primaryCapacityAvailable: boolean;

  primaryHeartbeatAt: number;

  standbyHealthy: boolean;
  standbyDrained: boolean;

  primaryFenced: boolean;
  standbyFenced: boolean;
}

export interface SovereignFailbackRecord {
  failbackId: string;

  primaryId: string;
  activeStandbyId: string;

  state: SovereignFailbackState;

  startedAt?: number;
  deadlineAt?: number;
  completedAt?: number;

  createdAt: number;
  updatedAt: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignFailbackResult {
  failbackId: string;

  primaryId: string;
  activeStandbyId: string;

  accepted: boolean;

  state: SovereignFailbackState;
  decision: SovereignFailbackDecision;

  remainingMs?: number;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsFailbackController {
  public readonly id =
    SOVEREIGN_OPERATIONS_FAILBACK_CONTROLLER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_FAILBACK_CONTROLLER_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly failbackCanCreateAuthority = false;
  public readonly failbackCanEscalateAuthority = false;
  public readonly failbackCanOverrideOwner = false;
  public readonly failbackCanBypassSecurity = false;
  public readonly failbackCanAllowSplitBrain = false;
  public readonly failbackCanRestoreUnhealthyPrimary = false;
  public readonly failbackCanDisableAudit = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignFailbackRecord>();

  private readonly requests =
    new Map<string, SovereignFailbackRequest>();

  private validate(
    request: SovereignFailbackRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.failbackId) {
      reasons.push("FAILBACK_ID_REQUIRED");
    }

    if (!request.primaryId) {
      reasons.push("PRIMARY_ID_REQUIRED");
    }

    if (!request.activeStandbyId) {
      reasons.push("ACTIVE_STANDBY_ID_REQUIRED");
    }

    if (
      request.primaryId ===
      request.activeStandbyId
    ) {
      reasons.push(
        "PRIMARY_AND_STANDBY_MUST_DIFFER"
      );
    }

    if (!request.requestedBy) {
      reasons.push("REQUESTER_REQUIRED");
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
        request.policy.failbackTimeoutMs
      ) ||
      request.policy.failbackTimeoutMs < 1
    ) {
      reasons.push("INVALID_FAILBACK_TIMEOUT");
    }

    if (
      !Number.isFinite(
        request.policy.heartbeatMaxAgeMs
      ) ||
      request.policy.heartbeatMaxAgeMs < 1
    ) {
      reasons.push("INVALID_HEARTBEAT_MAX_AGE");
    }

    return reasons;
  }

  public register(
    request: SovereignFailbackRequest
  ): SovereignFailbackResult {
    const now = Date.now();

    if (this.records.has(request.failbackId)) {
      return this.failure(
        request.failbackId,
        request.primaryId,
        request.activeStandbyId,
        "FAILBACK_ALREADY_EXISTS"
      );
    }

    const reasons = this.validate(request);

    if (reasons.length > 0) {
      return {
        failbackId: request.failbackId,

        primaryId: request.primaryId,
        activeStandbyId:
          request.activeStandbyId,

        accepted: false,

        state: "BLOCKED",
        decision: "BLOCK",

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignFailbackRecord = {
      failbackId: request.failbackId,

      primaryId: request.primaryId,
      activeStandbyId:
        request.activeStandbyId,

      state: "WAITING_PRIMARY",

      createdAt: request.createdAt,
      updatedAt: now,

      reasons: [],

      authority: "NONE"
    };

    this.records.set(
      record.failbackId,
      record
    );

    this.requests.set(
      record.failbackId,
      this.cloneRequest(request)
    );

    return this.result(
      record,
      "WAIT",
      now
    );
  }

  public evaluatePrimary(
    failbackId: string,
    status: SovereignFailbackStatus,
    now = Date.now()
  ): SovereignFailbackResult {
    const record =
      this.records.get(failbackId);

    const request =
      this.requests.get(failbackId);

    if (!record || !request) {
      return this.failure(
        failbackId,
        "",
        "",
        "FAILBACK_NOT_FOUND"
      );
    }

    const reasons =
      this.primaryReadinessReasons(
        request,
        status,
        now
      );

    if (reasons.length > 0) {
      record.state =
        "WAITING_PRIMARY";

      record.updatedAt = now;
      record.reasons = reasons;

      this.records.set(
        failbackId,
        record
      );

      return this.result(
        record,
        "WAIT",
        now
      );
    }

    record.state =
      "PRIMARY_READY";

    record.updatedAt = now;

    record.reasons = [
      "PRIMARY_READY_FOR_FAILBACK"
    ];

    this.records.set(
      failbackId,
      record
    );

    return this.result(
      record,
      request.policy.requireStandbyDrain
        ? "DRAIN"
        : request.policy.requireSynchronization
          ? "SYNC"
          : "SWITCH",
      now
    );
  }

  public beginStandbyDrain(
    failbackId: string,
    status: SovereignFailbackStatus,
    now = Date.now()
  ): SovereignFailbackResult {
    const record =
      this.records.get(failbackId);

    const request =
      this.requests.get(failbackId);

    if (!record || !request) {
      return this.failure(
        failbackId,
        "",
        "",
        "FAILBACK_NOT_FOUND"
      );
    }

    if (
      record.state !== "PRIMARY_READY" &&
      record.state !== "DRAINING_STANDBY"
    ) {
      return this.failure(
        record.failbackId,
        record.primaryId,
        record.activeStandbyId,
        "STANDBY_DRAIN_NOT_ALLOWED"
      );
    }

    if (!request.policy.requireStandbyDrain) {
      return this.beginSynchronization(
        failbackId,
        status,
        now
      );
    }

    record.state =
      "DRAINING_STANDBY";

    record.startedAt ??= now;

    record.deadlineAt ??=
      now +
      request.policy.failbackTimeoutMs;

    record.updatedAt = now;

    if (!status.standbyDrained) {
      record.reasons = [
        "WAITING_FOR_STANDBY_DRAIN"
      ];

      this.records.set(
        failbackId,
        record
      );

      return this.result(
        record,
        "DRAIN",
        now
      );
    }

    record.reasons = [
      "STANDBY_DRAIN_COMPLETED"
    ];

    this.records.set(
      failbackId,
      record
    );

    return this.beginSynchronization(
      failbackId,
      status,
      now
    );
  }

  public beginSynchronization(
    failbackId: string,
    status: SovereignFailbackStatus,
    now = Date.now()
  ): SovereignFailbackResult {
    const record =
      this.records.get(failbackId);

    const request =
      this.requests.get(failbackId);

    if (!record || !request) {
      return this.failure(
        failbackId,
        "",
        "",
        "FAILBACK_NOT_FOUND"
      );
    }

    record.startedAt ??= now;

    record.deadlineAt ??=
      now +
      request.policy.failbackTimeoutMs;

    if (
      record.deadlineAt !== undefined &&
      now >= record.deadlineAt
    ) {
      return this.requireRecovery(
        failbackId,
        "FAILBACK_TIMEOUT_EXCEEDED"
      );
    }

    if (
      request.policy.requireSynchronization &&
      !status.primarySynchronized
    ) {
      record.state =
        "SYNCHRONIZING";

      record.updatedAt = now;

      record.reasons = [
        "PRIMARY_SYNCHRONIZATION_REQUIRED"
      ];

      this.records.set(
        failbackId,
        record
      );

      return this.result(
        record,
        "SYNC",
        now
      );
    }

    record.state = "SWITCHING";
    record.updatedAt = now;

    record.reasons = [
      "FAILBACK_READY_TO_SWITCH"
    ];

    this.records.set(
      failbackId,
      record
    );

    return this.result(
      record,
      "SWITCH",
      now
    );
  }

  public beginSwitch(
    failbackId: string,
    status: SovereignFailbackStatus,
    now = Date.now()
  ): SovereignFailbackResult {
    const record =
      this.records.get(failbackId);

    const request =
      this.requests.get(failbackId);

    if (!record || !request) {
      return this.failure(
        failbackId,
        "",
        "",
        "FAILBACK_NOT_FOUND"
      );
    }

    if (record.state !== "SWITCHING") {
      return this.failure(
        record.failbackId,
        record.primaryId,
        record.activeStandbyId,
        "FAILBACK_SWITCH_NOT_READY"
      );
    }

    if (
      request.policy.preventSplitBrain &&
      !status.primaryFenced
    ) {
      return this.failure(
        record.failbackId,
        record.primaryId,
        record.activeStandbyId,
        "PRIMARY_MUST_REMAIN_FENCED_BEFORE_SWITCH"
      );
    }

    if (
      request.policy.requireStandbyDrain &&
      !status.standbyDrained
    ) {
      return this.failure(
        record.failbackId,
        record.primaryId,
        record.activeStandbyId,
        "STANDBY_MUST_BE_DRAINED"
      );
    }

    record.state = "VERIFYING";
    record.updatedAt = now;

    record.reasons = [
      "FAILBACK_SWITCH_STARTED"
    ];

    this.records.set(
      failbackId,
      record
    );

    return this.result(
      record,
      "VERIFY",
      now
    );
  }

  public verify(
    failbackId: string,
    primaryHealthy: boolean,
    standbyFenced: boolean,
    now = Date.now()
  ): SovereignFailbackResult {
    const record =
      this.records.get(failbackId);

    const request =
      this.requests.get(failbackId);

    if (!record || !request) {
      return this.failure(
        failbackId,
        "",
        "",
        "FAILBACK_NOT_FOUND"
      );
    }

    if (record.state !== "VERIFYING") {
      return this.failure(
        record.failbackId,
        record.primaryId,
        record.activeStandbyId,
        "FAILBACK_NOT_VERIFYING"
      );
    }

    if (
      record.deadlineAt !== undefined &&
      now >= record.deadlineAt
    ) {
      return this.requireRecovery(
        failbackId,
        "FAILBACK_VERIFICATION_TIMEOUT"
      );
    }

    if (!primaryHealthy) {
      return this.requireRecovery(
        failbackId,
        "PRIMARY_NOT_HEALTHY_AFTER_FAILBACK"
      );
    }

    if (
      request.policy.preventSplitBrain &&
      !standbyFenced
    ) {
      return this.requireRecovery(
        failbackId,
        "STANDBY_NOT_FENCED_SPLIT_BRAIN_RISK"
      );
    }

    record.state = "FAILED_BACK";

    record.completedAt = now;
    record.updatedAt = now;

    record.reasons = [
      "PRIMARY_RESTORED_SUCCESSFULLY"
    ];

    this.records.set(
      failbackId,
      record
    );

    return this.result(
      record,
      "COMPLETE",
      now
    );
  }

  private primaryReadinessReasons(
    request: SovereignFailbackRequest,
    status: SovereignFailbackStatus,
    now: number
  ): string[] {
    const reasons: string[] = [];

    if (
      request.policy.requirePrimaryHealthy &&
      !status.primaryHealthy
    ) {
      reasons.push("PRIMARY_NOT_HEALTHY");
    }

    if (
      request.policy.requireSynchronization &&
      !status.primarySynchronized
    ) {
      reasons.push("PRIMARY_NOT_SYNCHRONIZED");
    }

    if (
      request.policy.requireCapacity &&
      !status.primaryCapacityAvailable
    ) {
      reasons.push("PRIMARY_CAPACITY_NOT_AVAILABLE");
    }

    const heartbeatAge =
      now - status.primaryHeartbeatAt;

    if (
      heartbeatAge < 0 ||
      heartbeatAge >
        request.policy.heartbeatMaxAgeMs
    ) {
      reasons.push("PRIMARY_HEARTBEAT_STALE");
    }

    return reasons;
  }

  public requireRecovery(
    failbackId: string,
    reason = "FAILBACK_RECOVERY_REQUIRED"
  ): SovereignFailbackResult {
    const record =
      this.records.get(failbackId);

    if (!record) {
      return this.failure(
        failbackId,
        "",
        "",
        "FAILBACK_NOT_FOUND"
      );
    }

    record.state =
      "RECOVERY_REQUIRED";

    record.updatedAt =
      Date.now();

    record
