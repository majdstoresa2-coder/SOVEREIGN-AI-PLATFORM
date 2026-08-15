// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-FAULT-ISOLATION-CONTROLLER-139.ts
// Sequence: 139
// Purpose: Sovereign Fault Isolation, Containment & Safe Reintegration
// ============================================================================

export const SOVEREIGN_OPERATIONS_FAULT_ISOLATION_CONTROLLER_ID =
  "SOVEREIGN-OPERATIONS-FAULT-ISOLATION-CONTROLLER-139";

export const SOVEREIGN_OPERATIONS_FAULT_ISOLATION_CONTROLLER_VERSION =
  "1.0.0";

export type SovereignFaultIsolationState =
  | "REGISTERED"
  | "MONITORING"
  | "FAULT_DETECTED"
  | "ISOLATING"
  | "ISOLATED"
  | "VERIFYING"
  | "READY_FOR_REINTEGRATION"
  | "REINTEGRATING"
  | "RESTORED"
  | "RECOVERY_REQUIRED"
  | "BLOCKED";

export type SovereignFaultIsolationDecision =
  | "MONITOR"
  | "ISOLATE"
  | "VERIFY"
  | "HOLD"
  | "REINTEGRATE"
  | "RESTORE"
  | "RECOVER"
  | "BLOCK";

export type SovereignFaultSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SovereignFaultAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignFaultSignals {
  processHealthy: boolean;
  runtimeHealthy: boolean;

  dependencyHealthy: boolean;
  securityHealthy: boolean;

  dataIntegrityHealthy: boolean;
  queueHealthy: boolean;

  abnormalBehaviorDetected: boolean;
  cascadingRiskDetected: boolean;
}

export interface SovereignFaultIsolationPolicy {
  automaticIsolationEnabled: boolean;

  isolateOnCriticalFault: boolean;
  isolateOnSecurityFault: boolean;
  isolateOnIntegrityFault: boolean;
  isolateOnCascadingRisk: boolean;

  preserveQueue: boolean;
  preserveState: boolean;

  requireHealthBeforeReintegration: boolean;
  requireSecurityBeforeReintegration: boolean;
  requireIntegrityBeforeReintegration: boolean;

  isolationTimeoutMs: number;
}

export interface SovereignFaultIsolationRequest {
  isolationId: string;
  target: string;

  requestedBy: string;

  authorityContext: SovereignFaultAuthorityContext;

  policy: SovereignFaultIsolationPolicy;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignFaultIsolationRecord {
  isolationId: string;
  target: string;

  state: SovereignFaultIsolationState;

  severity?: SovereignFaultSeverity;

  queuePreserved: boolean;
  statePreserved: boolean;

  isolatedAt?: number;
  deadlineAt?: number;
  restoredAt?: number;

  createdAt: number;
  updatedAt: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignFaultIsolationResult {
  isolationId: string;
  target: string;

  accepted: boolean;

  state: SovereignFaultIsolationState;
  decision: SovereignFaultIsolationDecision;

  severity?: SovereignFaultSeverity;

  remainingMs?: number;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsFaultIsolationController {
  public readonly id =
    SOVEREIGN_OPERATIONS_FAULT_ISOLATION_CONTROLLER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_FAULT_ISOLATION_CONTROLLER_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly isolationCanCreateAuthority = false;
  public readonly isolationCanEscalateAuthority = false;
  public readonly isolationCanOverrideOwner = false;
  public readonly isolationCanBypassSecurity = false;
  public readonly isolationCanDiscardProtectedState = false;
  public readonly isolationCanReintegrateUnsafeTarget = false;
  public readonly isolationCanDisableAudit = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignFaultIsolationRecord>();

  private readonly requests =
    new Map<string, SovereignFaultIsolationRequest>();

  private validate(
    request: SovereignFaultIsolationRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.isolationId) {
      reasons.push("ISOLATION_ID_REQUIRED");
    }

    if (!request.target) {
      reasons.push("TARGET_REQUIRED");
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
        request.policy.isolationTimeoutMs
      ) ||
      request.policy.isolationTimeoutMs < 1
    ) {
      reasons.push("INVALID_ISOLATION_TIMEOUT");
    }

    return reasons;
  }

  public register(
    request: SovereignFaultIsolationRequest
  ): SovereignFaultIsolationResult {
    const now = Date.now();

    if (this.records.has(request.isolationId)) {
      return this.failure(
        request.isolationId,
        request.target,
        "ISOLATION_ALREADY_EXISTS"
      );
    }

    const reasons = this.validate(request);

    if (reasons.length > 0) {
      return {
        isolationId: request.isolationId,
        target: request.target,

        accepted: false,

        state: "BLOCKED",
        decision: "BLOCK",

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignFaultIsolationRecord = {
      isolationId: request.isolationId,
      target: request.target,

      state: "MONITORING",

      queuePreserved: false,
      statePreserved: false,

      createdAt: request.createdAt,
      updatedAt: now,

      reasons: [],

      authority: "NONE"
    };

    this.records.set(
      request.isolationId,
      record
    );

    this.requests.set(
      request.isolationId,
      this.cloneRequest(request)
    );

    return this.result(
      record,
      "MONITOR",
      now
    );
  }

  public evaluate(
    isolationId: string,
    signals: SovereignFaultSignals,
    severity: SovereignFaultSeverity,
    now = Date.now()
  ): SovereignFaultIsolationResult {
    const record =
      this.records.get(isolationId);

    const request =
      this.requests.get(isolationId);

    if (!record || !request) {
      return this.failure(
        isolationId,
        "",
        "ISOLATION_NOT_FOUND"
      );
    }

    const reasons =
      this.detectFaults(signals);

    if (reasons.length === 0) {
      record.state = "MONITORING";
      record.severity = undefined;
      record.reasons = [];
      record.updatedAt = now;

      this.records.set(
        isolationId,
        record
      );

      return this.result(
        record,
        "MONITOR",
        now
      );
    }

    record.state = "FAULT_DETECTED";
    record.severity = severity;
    record.reasons = reasons;
    record.updatedAt = now;

    this.records.set(
      isolationId,
      record
    );

    if (
      !request.policy.automaticIsolationEnabled
    ) {
      return this.result(
        record,
        "HOLD",
        now
      );
    }

    if (
      !this.shouldIsolate(
        signals,
        severity,
        request.policy
      )
    ) {
      return this.result(
        record,
        "HOLD",
        now
      );
    }

    return this.beginIsolation(
      isolationId,
      now
    );
  }

  public beginIsolation(
    isolationId: string,
    now = Date.now()
  ): SovereignFaultIsolationResult {
    const record =
      this.records.get(isolationId);

    const request =
      this.requests.get(isolationId);

    if (!record || !request) {
      return this.failure(
        isolationId,
        "",
        "ISOLATION_NOT_FOUND"
      );
    }

    if (record.state !== "FAULT_DETECTED") {
      return this.failure(
        record.isolationId,
        record.target,
        "FAULT_NOT_READY_FOR_ISOLATION"
      );
    }

    record.state = "ISOLATING";

    record.deadlineAt =
      now +
      request.policy.isolationTimeoutMs;

    record.updatedAt = now;

    record.reasons = [
      "FAULT_ISOLATION_STARTED"
    ];

    this.records.set(
      isolationId,
      record
    );

    return this.result(
      record,
      "ISOLATE",
      now
    );
  }

  public confirmIsolation(
    isolationId: string,
    queuePreserved: boolean,
    statePreserved: boolean,
    now = Date.now()
  ): SovereignFaultIsolationResult {
    const record =
      this.records.get(isolationId);

    const request =
      this.requests.get(isolationId);

    if (!record || !request) {
      return this.failure(
        isolationId,
        "",
        "ISOLATION_NOT_FOUND"
      );
    }

    if (record.state !== "ISOLATING") {
      return this.failure(
        record.isolationId,
        record.target,
        "ISOLATION_NOT_ACTIVE"
      );
    }

    if (
      record.deadlineAt !== undefined &&
      now >= record.deadlineAt
    ) {
      return this.requireRecovery(
        isolationId,
        "ISOLATION_TIMEOUT_EXCEEDED"
      );
    }

    record.queuePreserved = queuePreserved;
    record.statePreserved = statePreserved;

    const reasons: string[] = [];

    if (
      request.policy.preserveQueue &&
      !queuePreserved
    ) {
      reasons.push(
        "QUEUE_PRESERVATION_REQUIRED"
      );
    }

    if (
      request.policy.preserveState &&
      !statePreserved
    ) {
      reasons.push(
        "STATE_PRESERVATION_REQUIRED"
      );
    }

    if (reasons.length > 0) {
      record.reasons = reasons;
      record.updatedAt = now;

      this.records.set(
        isolationId,
        record
      );

      return this.result(
        record,
        "ISOLATE",
        now
      );
    }

    record.state = "ISOLATED";
    record.isolatedAt = now;
    record.updatedAt = now;

    record.reasons = [
      "FAULT_CONTAINED"
    ];

    this.records.set(
      isolationId,
      record
    );

    return this.result(
      record,
      "VERIFY",
      now
    );
  }

  public verifyForReintegration(
    isolationId: string,
    signals: SovereignFaultSignals,
    now = Date.now()
  ): SovereignFaultIsolationResult {
    const record =
      this.records.get(isolationId);

    const request =
      this.requests.get(isolationId);

    if (!record || !request) {
      return this.failure(
        isolationId,
        "",
        "ISOLATION_NOT_FOUND"
      );
    }

    if (
      record.state !== "ISOLATED" &&
      record.state !== "VERIFYING"
    ) {
      return this.failure(
        record.isolationId,
        record.target,
        "TARGET_NOT_ISOLATED"
      );
    }

    record.state = "VERIFYING";

    const reasons: string[] = [];

    if (
      request.policy
        .requireHealthBeforeReintegration &&
      (
        !signals.processHealthy ||
        !signals.runtimeHealthy ||
        !signals.dependencyHealthy ||
        !signals.queueHealthy
      )
    ) {
      reasons.push(
        "TARGET_HEALTH_NOT_READY"
      );
    }

    if (
      request.policy
        .requireSecurityBeforeReintegration &&
      !signals.securityHealthy
    ) {
      reasons.push(
        "SECURITY_NOT_READY"
      );
    }

    if (
      request.policy
        .requireIntegrityBeforeReintegration &&
      !signals.dataIntegrityHealthy
    ) {
      reasons.push(
        "DATA_INTEGRITY_NOT_READY"
      );
    }

    if (signals.abnormalBehaviorDetected) {
      reasons.push(
        "ABNORMAL_BEHAVIOR_STILL_PRESENT"
      );
    }

    if (signals.cascadingRiskDetected) {
      reasons.push(
        "CASCADING_RISK_STILL_PRESENT"
      );
    }

    record.updatedAt = now;

    if (reasons.length > 0) {
      record.reasons = reasons;

      this.records.set(
        isolationId,
        record
      );

      return this.result(
        record,
        "HOLD",
        now
