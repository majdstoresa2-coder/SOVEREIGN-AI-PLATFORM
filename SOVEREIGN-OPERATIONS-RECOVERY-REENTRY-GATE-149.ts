// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-RECOVERY-REENTRY-GATE-149.ts
// Sequence: 149
// Purpose: Sovereign Post-Recovery Re-entry Gate, Production Admission,
//          Safety Validation & Controlled Service Restoration
// ============================================================================

export const SOVEREIGN_OPERATIONS_RECOVERY_REENTRY_GATE_ID =
  "SOVEREIGN-OPERATIONS-RECOVERY-REENTRY-GATE-149";

export const SOVEREIGN_OPERATIONS_RECOVERY_REENTRY_GATE_VERSION =
  "1.0.0";

export type SovereignRecoveryReentryState =
  | "REGISTERED"
  | "EVALUATING"
  | "READY"
  | "RESTRICTED"
  | "DEFERRED"
  | "REJECTED"
  | "ADMITTED"
  | "BLOCKED";

export type SovereignRecoveryReentryDecision =
  | "ALLOW"
  | "ALLOW_RESTRICTED"
  | "DEFER"
  | "REJECT"
  | "BLOCK";

export interface SovereignRecoveryReentryAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignRecoveryReentrySignals {
  recoveryVerified: boolean;

  targetHealthy: boolean;
  runtimeHealthy: boolean;
  workersHealthy: boolean;

  dependenciesHealthy: boolean;
  databaseHealthy: boolean;
  storageHealthy: boolean;
  queueHealthy: boolean;
  networkHealthy: boolean;

  securityHealthy: boolean;
  dataIntegrityHealthy: boolean;

  stateConsistent: boolean;
  desiredStateReached: boolean;

  capacityAvailable: boolean;
  synchronizationComplete: boolean;

  testsPassed: boolean;
  regressionDetected: boolean;

  monitoringReady: boolean;
  rollbackReady: boolean;
}

export interface SovereignRecoveryReentryPolicy {
  allowRestrictedReentry: boolean;

  requireRecoveryVerification: boolean;
  requireSecurityHealth: boolean;
  requireDataIntegrity: boolean;

  requireStateConsistency: boolean;
  requireDesiredState: boolean;

  requireCapacity: boolean;
  requireSynchronization: boolean;

  requireTests: boolean;
  rejectRegression: boolean;

  requireMonitoring: boolean;
  requireRollbackReadiness: boolean;
}

export interface SovereignRecoveryReentryRequest {
  reentryId: string;

  recoveryId: string;
  verificationId: string;

  target: string;

  requestedBy: string;

  authorityContext: SovereignRecoveryReentryAuthorityContext;

  signals: SovereignRecoveryReentrySignals;

  policy: SovereignRecoveryReentryPolicy;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignRecoveryReentryRecord {
  reentryId: string;

  recoveryId: string;
  verificationId: string;

  target: string;

  state: SovereignRecoveryReentryState;
  decision: SovereignRecoveryReentryDecision;

  createdAt: number;
  evaluatedAt: number;
  admittedAt?: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignRecoveryReentryResult {
  reentryId: string;

  recoveryId: string;
  verificationId: string;

  target: string;

  accepted: boolean;

  state: SovereignRecoveryReentryState;
  decision: SovereignRecoveryReentryDecision;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsRecoveryReentryGate {
  public readonly id =
    SOVEREIGN_OPERATIONS_RECOVERY_REENTRY_GATE_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_RECOVERY_REENTRY_GATE_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly reentryGateCanCreateAuthority = false;
  public readonly reentryGateCanEscalateAuthority = false;
  public readonly reentryGateCanOverrideOwner = false;
  public readonly reentryGateCanBypassSecurity = false;
  public readonly reentryGateCanIgnoreIntegrityFailure = false;
  public readonly reentryGateCanIgnoreRegression = false;
  public readonly reentryGateCanAdmitUnverifiedRecovery = false;
  public readonly reentryGateCanDisableAudit = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignRecoveryReentryRecord>();

  private validate(
    request: SovereignRecoveryReentryRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.reentryId) {
      reasons.push("REENTRY_ID_REQUIRED");
    }

    if (!request.recoveryId) {
      reasons.push("RECOVERY_ID_REQUIRED");
    }

    if (!request.verificationId) {
      reasons.push("VERIFICATION_ID_REQUIRED");
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

    return reasons;
  }

  private evaluateSignals(
    request: SovereignRecoveryReentryRequest
  ): {
    state: SovereignRecoveryReentryState;
    decision: SovereignRecoveryReentryDecision;
    reasons: string[];
  } {
    const reasons: string[] = [];

    const {
      signals,
      policy
    } = request;

    if (
      policy.requireRecoveryVerification &&
      !signals.recoveryVerified
    ) {
      reasons.push(
        "RECOVERY_NOT_VERIFIED"
      );
    }

    if (!signals.targetHealthy) {
      reasons.push("TARGET_UNHEALTHY");
    }

    if (!signals.runtimeHealthy) {
      reasons.push("RUNTIME_UNHEALTHY");
    }

    if (!signals.workersHealthy) {
      reasons.push("WORKERS_UNHEALTHY");
    }

    if (!signals.dependenciesHealthy) {
      reasons.push("DEPENDENCIES_UNHEALTHY");
    }

    if (!signals.databaseHealthy) {
      reasons.push("DATABASE_UNHEALTHY");
    }

    if (!signals.storageHealthy) {
      reasons.push("STORAGE_UNHEALTHY");
    }

    if (!signals.queueHealthy) {
      reasons.push("QUEUE_UNHEALTHY");
    }

    if (!signals.networkHealthy) {
      reasons.push("NETWORK_UNHEALTHY");
    }

    if (
      policy.requireSecurityHealth &&
      !signals.securityHealthy
    ) {
      reasons.push(
        "SECURITY_HEALTH_FAILED"
      );
    }

    if (
      policy.requireDataIntegrity &&
      !signals.dataIntegrityHealthy
    ) {
      reasons.push(
        "DATA_INTEGRITY_FAILED"
      );
    }

    if (
      policy.requireStateConsistency &&
      !signals.stateConsistent
    ) {
      reasons.push(
        "STATE_NOT_CONSISTENT"
      );
    }

    if (
      policy.requireDesiredState &&
      !signals.desiredStateReached
    ) {
      reasons.push(
        "DESIRED_STATE_NOT_REACHED"
      );
    }

    if (
      policy.requireCapacity &&
      !signals.capacityAvailable
    ) {
      reasons.push(
        "CAPACITY_NOT_AVAILABLE"
      );
    }

    if (
      policy.requireSynchronization &&
      !signals.synchronizationComplete
    ) {
      reasons.push(
        "SYNCHRONIZATION_NOT_COMPLETE"
      );
    }

    if (
      policy.requireTests &&
      !signals.testsPassed
    ) {
      reasons.push(
        "POST_RECOVERY_TESTS_FAILED"
      );
    }

    if (
      policy.rejectRegression &&
      signals.regressionDetected
    ) {
      reasons.push(
        "REGRESSION_DETECTED"
      );
    }

    if (
      policy.requireMonitoring &&
      !signals.monitoringReady
    ) {
      reasons.push(
        "MONITORING_NOT_READY"
      );
    }

    if (
      policy.requireRollbackReadiness &&
      !signals.rollbackReady
    ) {
      reasons.push(
        "ROLLBACK_NOT_READY"
      );
    }

    if (reasons.length === 0) {
      return {
        state: "READY",
        decision: "ALLOW",
        reasons: []
      };
    }

    const hardBlockReasons = new Set([
      "RECOVERY_NOT_VERIFIED",
      "SECURITY_HEALTH_FAILED",
      "DATA_INTEGRITY_FAILED",
      "REGRESSION_DETECTED"
    ]);

    if (
      reasons.some(
        (reason) =>
          hardBlockReasons.has(reason)
      )
    ) {
      return {
        state: "BLOCKED",
        decision: "BLOCK",
        reasons
      };
    }

    const deferReasons = new Set([
      "CAPACITY_NOT_AVAILABLE",
      "SYNCHRONIZATION_NOT_COMPLETE",
      "MONITORING_NOT_READY",
      "ROLLBACK_NOT_READY"
    ]);

    if (
      reasons.some(
        (reason) =>
          deferReasons.has(reason)
      )
    ) {
      return {
        state: "DEFERRED",
        decision: "DEFER",
        reasons
      };
    }

    if (
      policy.allowRestrictedReentry
    ) {
      return {
        state: "RESTRICTED",
        decision: "ALLOW_RESTRICTED",
        reasons
      };
    }

    return {
      state: "REJECTED",
      decision: "REJECT",
      reasons
    };
  }

  public evaluate(
    request: SovereignRecoveryReentryRequest
  ): SovereignRecoveryReentryResult {
    const now = Date.now();

    if (
      this.records.has(request.reentryId)
    ) {
      return this.failure(
        request.reentryId,
        request.recoveryId,
        request.verificationId,
        request.target,
        "REENTRY_ALREADY_EXISTS"
      );
    }

    const validation =
      this.validate(request);

    if (validation.length > 0) {
      return {
        reentryId: request.reentryId,
        recoveryId: request.recoveryId,
        verificationId:
          request.verificationId,
        target: request.target,

        accepted: false,

        state: "BLOCKED",
        decision: "BLOCK",

        reasons: validation,

        timestamp: now,

        authority: "NONE"
      };
    }

    const evaluation =
      this.evaluateSignals(request);

    const record: SovereignRecoveryReentryRecord = {
      reentryId: request.reentryId,

      recoveryId: request.recoveryId,
      verificationId:
        request.verificationId,

      target: request.target,

      state: evaluation.state,
      decision: evaluation.decision,

      createdAt: request.createdAt,
      evaluatedAt: now,

      reasons: [
        ...evaluation.reasons
      ],

      authority: "NONE"
    };

    this.records.set(
      request.reentryId,
      record
    );

    return this.result(
      record,
      now
    );
  }

  public reevaluate(
    reentryId: string,
    request: SovereignRecoveryReentryRequest,
    now = Date.now()
  ): SovereignRecoveryReentryResult {
    const record =
      this.records.get(reentryId);

    if (!record) {
      return this.failure(
        reentryId,
        request.recoveryId,
        request.verificationId,
        request.target,
        "REENTRY_NOT_FOUND"
      );
    }

    if (record.state === "ADMITTED") {
      return this.failure(
        record.reentryId,
        record.recoveryId,
        record.verificationId,
        record.target,
        "TARGET_ALREADY_ADMITTED"
      );
    }

    const evaluation =
      this.evaluateSignals(request);

    record.state = evaluation.state;
    record.decision =
      evaluation.decision;

    record.evaluatedAt = now;

    record.reasons = [
      ...evaluation.reasons
    ];

    this.records.set(
      reentryId,
      record
    );

    return this.result(
      record,
      now
    );
  }

  public admit(
    reentryId: string,
    now = Date.now()
  ): SovereignRecoveryReentryResult {
    const record =
      this.records.get(reentryId);

    if (!record) {
      return this.failure(
        reentryId,
        "",
        "",
        "",
        "REENTRY_NOT_FOUND"
      );
    }

    if (
      record.decision !== "ALLOW" &&
      record.decision !==
        "ALLOW_RESTRICTED"
    ) {
      return this.failure(
        record.reentryId,
        record.recoveryId,
        record.verificationId,
        record.target,
        "TARGET_NOT_APPROVED_FOR_REENTRY"
      );
    }

    record.state = "ADMITTED";

    record.admittedAt = now;
    record.evaluatedAt = now;

    record.reasons = [
      record.decision ===
        "ALLOW_RESTRICTED"
        ? "TARGET_ADMITTED_WITH_RESTRICTIONS"
        : "TARGET_ADMITTED_TO_SERVICE"
    ];

    this.records.set(
      reentryId,
      record
    );

    return this.result(
      record,
      now
    );
  }

  public canReenter(
    reentryId: string
  ): boolean {
    const record =
      this.records.get(reentryId);

    if (!record) {
      return false;
    }

    return (
      record.decision === "ALLOW" ||
      record.decision ===
        "ALLOW_RESTRICTED"
    );
  }

  public requiresRestriction(
    reentryId: string
  ): boolean {
    return (
      this.records.get(reentryId)
        ?.decision ===
      "ALLOW_RESTRICTED"
    );
  }

  public shouldDefer(
    reentryId: string
  ): boolean {
    return (
      this.records.get(reentryId)
        ?.decision === "DEFER"
    );
  }

  public getRecord(
    reentryId: string
  ): SovereignRecoveryReentryRecord | undefined {
    const record =
      this.records.get(reentryId);

    return record
      ? {
          ...record,
          reasons: [
            ...record.reasons
          ]
        }
      : undefined;
  }

  public getBlocked():
    SovereignRecoveryReentryRecord[] {
    return [
      ...this.records.values()
    ]
      .filter(
        (record) =>
          record.state === "BLOCKED" ||
          record.state === "REJECTED"
      )
      .map(
        (record) => ({
          ...record,
          reasons: [
            ...record.reasons
          ]
        })
      );
  }

  public getDeferred():
    SovereignRecoveryReentryRecord[] {
    return [
      ...this.records.values()
    ]
      .filter(
        (record) =>
          record.state === "DEFERRED"
      )
      .map(
        (record) => ({
          ...record,
          reasons: [
            ...record.reasons
          ]
        })
      );
  }

  public getAdmitted():
    SovereignRecoveryReentryRecord[] {
    return [
      ...this.records.values()
    ]
      .filter(
        (record) =>
          record.state === "ADMITTED"
      )
      .map(
        (record) => ({
          ...record,
          reasons: [
            ...record.reasons
          ]
        })
      );
  }

  private result(
    record: SovereignRecoveryReentryRecord,
    now: number
  ): SovereignRecoveryReentryResult {
    return {
      reentryId:
        record.reentryId,

      recoveryId:
        record.recoveryId,

      verificationId:
        record.verificationId,

      target:
        record.target,

      accepted:
        record.decision === "ALLOW" ||
        record.decision ===
          "ALLOW_RESTRICTED",

      state:
        record.state,

      decision:
        record.decision,

      reasons: [
        ...record.reasons
      ],

      timestamp: now,

      authority: "NONE"
    };
  }

  private failure(
    reentryId: string,
    recoveryId: string,
    verificationId: string,
    target: string,
    reason: string
  ): SovereignRecoveryReentryResult {
    return {
      reentryId,
      recoveryId,
      verificationId,
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
      this.reentryGateCanCreateAuthority === false &&
      this.reentryGateCanEscalateAuthority === false &&
      this.reentryGateCanOverrideOwner === false &&
      this.reentryGateCanBypassSecurity === false &&
      this.reentryGateCanIgnoreIntegrityFailure === false &&
      this.reentryGateCanIgnoreRegression === false &&
      this.reentryGateCanAdmitUnverifiedRecovery === false &&
      this.reentryGateCanDisableAudit === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsRecoveryReentryGate =
  new SovereignOperationsRecoveryReentryGate();

export default sovereignOperationsRecoveryReentryGate;
