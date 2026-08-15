// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-RECOVERY-CLOSURE-CONTROLLER-151.ts
// Sequence: 151
// Purpose: Sovereign Recovery Closure, Evidence Validation,
//          Final State Certification & Controlled Incident Closure
// ============================================================================

export const SOVEREIGN_OPERATIONS_RECOVERY_CLOSURE_CONTROLLER_ID =
  "SOVEREIGN-OPERATIONS-RECOVERY-CLOSURE-CONTROLLER-151";

export const SOVEREIGN_OPERATIONS_RECOVERY_CLOSURE_CONTROLLER_VERSION =
  "1.0.0";

export type SovereignRecoveryClosureState =
  | "REGISTERED"
  | "VALIDATING"
  | "READY"
  | "CLOSED"
  | "DEFERRED"
  | "REJECTED"
  | "BLOCKED";

export type SovereignRecoveryClosureDecision =
  | "VALIDATE"
  | "CLOSE"
  | "DEFER"
  | "REJECT"
  | "BLOCK";

export interface SovereignRecoveryClosureAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignRecoveryClosureEvidence {
  recoveryCompleted: boolean;
  verificationPassed: boolean;
  reentryCompleted: boolean;
  stabilityConfirmed: boolean;

  securityHealthy: boolean;
  dataIntegrityHealthy: boolean;
  stateConsistent: boolean;

  monitoringHealthy: boolean;
  auditComplete: boolean;

  unresolvedCriticalFailures: boolean;
  recoveryStillRequired: boolean;
  isolationStillRequired: boolean;
  regressionDetected: boolean;

  finalSnapshotStored: boolean;
  recoveryReportStored: boolean;
}

export interface SovereignRecoveryClosurePolicy {
  requireRecoveryCompletion: boolean;
  requireVerification: boolean;
  requireReentry: boolean;
  requireStability: boolean;

  requireSecurityHealth: boolean;
  requireDataIntegrity: boolean;
  requireStateConsistency: boolean;

  requireMonitoring: boolean;
  requireAudit: boolean;

  rejectCriticalFailures: boolean;
  rejectPendingRecovery: boolean;
  rejectPendingIsolation: boolean;
  rejectRegression: boolean;

  requireFinalSnapshot: boolean;
  requireRecoveryReport: boolean;
}

export interface SovereignRecoveryClosureRequest {
  closureId: string;

  recoveryId: string;
  verificationId: string;
  reentryId: string;
  stabilityMonitorId: string;

  incidentId?: string;

  target: string;
  requestedBy: string;

  authorityContext: SovereignRecoveryClosureAuthorityContext;

  evidence: SovereignRecoveryClosureEvidence;
  policy: SovereignRecoveryClosurePolicy;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignRecoveryClosureRecord {
  closureId: string;

  recoveryId: string;
  verificationId: string;
  reentryId: string;
  stabilityMonitorId: string;

  incidentId?: string;

  target: string;

  state: SovereignRecoveryClosureState;
  decision: SovereignRecoveryClosureDecision;

  createdAt: number;
  evaluatedAt: number;
  closedAt?: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignRecoveryClosureResult {
  closureId: string;
  recoveryId: string;

  target: string;

  accepted: boolean;

  state: SovereignRecoveryClosureState;
  decision: SovereignRecoveryClosureDecision;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsRecoveryClosureController {
  public readonly id =
    SOVEREIGN_OPERATIONS_RECOVERY_CLOSURE_CONTROLLER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_RECOVERY_CLOSURE_CONTROLLER_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" = "SUPREME";

  public readonly stewardAuthority: "DELEGATED" = "DELEGATED";

  public readonly controllerCanCreateAuthority = false;
  public readonly controllerCanEscalateAuthority = false;
  public readonly controllerCanOverrideOwner = false;

  public readonly controllerCanBypassSecurity = false;
  public readonly controllerCanIgnoreIntegrityFailure = false;
  public readonly controllerCanIgnoreRegression = false;

  public readonly controllerCanCloseUnstableRecovery = false;
  public readonly controllerCanClosePendingIsolation = false;
  public readonly controllerCanFalsifyEvidence = false;
  public readonly controllerCanDisableAudit = false;

  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignRecoveryClosureRecord>();

  private validateRequest(
    request: SovereignRecoveryClosureRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.closureId) {
      reasons.push("CLOSURE_ID_REQUIRED");
    }

    if (!request.recoveryId) {
      reasons.push("RECOVERY_ID_REQUIRED");
    }

    if (!request.verificationId) {
      reasons.push("VERIFICATION_ID_REQUIRED");
    }

    if (!request.reentryId) {
      reasons.push("REENTRY_ID_REQUIRED");
    }

    if (!request.stabilityMonitorId) {
      reasons.push("STABILITY_MONITOR_ID_REQUIRED");
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

  private validateEvidence(
    evidence: SovereignRecoveryClosureEvidence,
    policy: SovereignRecoveryClosurePolicy
  ): string[] {
    const reasons: string[] = [];

    if (
      policy.requireRecoveryCompletion &&
      !evidence.recoveryCompleted
    ) {
      reasons.push("RECOVERY_NOT_COMPLETED");
    }

    if (
      policy.requireVerification &&
      !evidence.verificationPassed
    ) {
      reasons.push("RECOVERY_VERIFICATION_NOT_PASSED");
    }

    if (
      policy.requireReentry &&
      !evidence.reentryCompleted
    ) {
      reasons.push("SERVICE_REENTRY_NOT_COMPLETED");
    }

    if (
      policy.requireStability &&
      !evidence.stabilityConfirmed
    ) {
      reasons.push("POST_RECOVERY_STABILITY_NOT_CONFIRMED");
    }

    if (
      policy.requireSecurityHealth &&
      !evidence.securityHealthy
    ) {
      reasons.push("SECURITY_HEALTH_FAILED");
    }

    if (
      policy.requireDataIntegrity &&
      !evidence.dataIntegrityHealthy
    ) {
      reasons.push("DATA_INTEGRITY_FAILED");
    }

    if (
      policy.requireStateConsistency &&
      !evidence.stateConsistent
    ) {
      reasons.push("STATE_CONSISTENCY_FAILED");
    }

    if (
      policy.requireMonitoring &&
      !evidence.monitoringHealthy
    ) {
      reasons.push("MONITORING_NOT_HEALTHY");
    }

    if (
      policy.requireAudit &&
      !evidence.auditComplete
    ) {
      reasons.push("RECOVERY_AUDIT_INCOMPLETE");
    }

    if (
      policy.rejectCriticalFailures &&
      evidence.unresolvedCriticalFailures
    ) {
      reasons.push("UNRESOLVED_CRITICAL_FAILURES");
    }

    if (
      policy.rejectPendingRecovery &&
      evidence.recoveryStillRequired
    ) {
      reasons.push("ADDITIONAL_RECOVERY_REQUIRED");
    }

    if (
      policy.rejectPendingIsolation &&
      evidence.isolationStillRequired
    ) {
      reasons.push("ISOLATION_STILL_REQUIRED");
    }

    if (
      policy.rejectRegression &&
      evidence.regressionDetected
    ) {
      reasons.push("REGRESSION_DETECTED");
    }

    if (
      policy.requireFinalSnapshot &&
      !evidence.finalSnapshotStored
    ) {
      reasons.push("FINAL_SNAPSHOT_NOT_STORED");
    }

    if (
      policy.requireRecoveryReport &&
      !evidence.recoveryReportStored
    ) {
      reasons.push("RECOVERY_REPORT_NOT_STORED");
    }

    return reasons;
  }

  private hasHardBlock(
    reasons: string[]
  ): boolean {
    const hardBlocks = new Set([
      "SECURITY_HEALTH_FAILED",
      "DATA_INTEGRITY_FAILED",
      "UNRESOLVED_CRITICAL_FAILURES",
      "ISOLATION_STILL_REQUIRED",
      "REGRESSION_DETECTED"
    ]);

    return reasons.some(
      (reason) => hardBlocks.has(reason)
    );
  }

  public evaluate(
    request: SovereignRecoveryClosureRequest,
    now = Date.now()
  ): SovereignRecoveryClosureResult {
    if (this.records.has(request.closureId)) {
      return this.failure(
        request.closureId,
        request.recoveryId,
        request.target,
        "CLOSURE_ALREADY_EXISTS"
      );
    }

    const requestFailures =
      this.validateRequest(request);

    if (requestFailures.length > 0) {
      return {
        closureId: request.closureId,
        recoveryId: request.recoveryId,
        target: request.target,

        accepted: false,

        state: "BLOCKED",
        decision: "BLOCK",

        reasons: requestFailures,

        timestamp: now,

        authority: "NONE"
      };
    }

    const evidenceFailures =
      this.validateEvidence(
        request.evidence,
        request.policy
      );

    let state: SovereignRecoveryClosureState;
    let decision: SovereignRecoveryClosureDecision;

    if (evidenceFailures.length === 0) {
      state = "READY";
      decision = "VALIDATE";
    } else if (
      this.hasHardBlock(evidenceFailures)
    ) {
      state = "BLOCKED";
      decision = "BLOCK";
    } else {
      state = "DEFERRED";
      decision = "DEFER";
    }

    const record: SovereignRecoveryClosureRecord = {
      closureId: request.closureId,

      recoveryId: request.recoveryId,
      verificationId: request.verificationId,
      reentryId: request.reentryId,
      stabilityMonitorId:
        request.stabilityMonitorId,

      incidentId: request.incidentId,

      target: request.target,

      state,
      decision,

      createdAt: request.createdAt,
      evaluatedAt: now,

      reasons:
        evidenceFailures.length === 0
          ? ["RECOVERY_CLOSURE_READY"]
          : [...evidenceFailures],

      authority: "NONE"
    };

    this.records.set(
      request.closureId,
      record
    );

    return this.result(
      record,
      now
    );
  }

  public close(
    closureId: string,
    now = Date.now()
  ): SovereignRecoveryClosureResult {
    const record =
      this.records.get(closureId);

    if (!record) {
      return this.failure(
        closureId,
        "",
        "",
        "CLOSURE_NOT_FOUND"
      );
    }

    if (
      record.state !== "READY" ||
      record.decision !== "VALIDATE"
    ) {
      return this.failure(
        record.closureId,
        record.recoveryId,
        record.target,
        "RECOVERY_NOT_READY_FOR_CLOSURE"
      );
    }

    record.state = "CLOSED";
    record.decision = "CLOSE";

    record.closedAt = now;
    record.evaluatedAt = now;

    record.reasons = [
      "RECOVERY_CLOSED_SUCCESSFULLY",
      "FINAL_RECOVERY_STATE_CERTIFIED"
    ];

    this.records.set(
      closureId,
      record
    );

    return this.result(
      record,
      now
    );
  }

  public reject(
    closureId: string,
    reason: string,
    now = Date.now()
  ): SovereignRecoveryClosureResult {
    const record =
      this.records.get(closureId);

    if (!record) {
      return this.failure(
        closureId,
        "",
        "",
        "CLOSURE_NOT_FOUND"
      );
    }

    if (record.state === "CLOSED") {
      return this.failure(
        record.closureId,
        record.recoveryId,
        record.target,
        "RECOVERY_ALREADY_CLOSED"
      );
    }

    record.state = "REJECTED";
    record.decision = "REJECT";

    record.evaluatedAt = now;

    record.reasons = [
      reason || "RECOVERY_CLOSURE_REJECTED"
    ];

    this.records.set(
      closureId,
      record
    );

    return this.result(
      record,
      now
    );
  }

  public getRecord(
    closureId: string
  ): SovereignRecoveryClosureRecord | undefined {
    const record =
      this.records.get(closureId);

    return record
      ? this.cloneRecord(record)
      : undefined;
  }

  public getClosedRecoveries():
    SovereignRecoveryClosureRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state === "CLOSED"
      )
      .map(
        (record) =>
          this.cloneRecord(record)
      );
  }

  public getDeferredClosures():
    SovereignRecoveryClosureRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state === "DEFERRED"
      )
      .map(
        (record) =>
          this.cloneRecord(record)
      );
  }

  public getBlockedClosures():
    SovereignRecoveryClosureRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state === "BLOCKED"
      )
      .map(
        (record) =>
          this.cloneRecord(record)
      );
  }

  private cloneRecord(
    record: SovereignRecoveryClosureRecord
  ): SovereignRecoveryClosureRecord {
    return {
      ...record,
      reasons: [...record.reasons]
    };
  }

  private result(
    record: SovereignRecoveryClosureRecord,
    now: number
  ): SovereignRecoveryClosureResult {
    return {
      closureId: record.closureId,
      recoveryId: record.recoveryId,
      target: record.target,

      accepted:
        record.decision === "VALIDATE" ||
        record.decision === "CLOSE",

      state: record.state,
      decision: record.decision,

      reasons: [...record.reasons],

      timestamp: now,

      authority: "NONE"
    };
  }

  private failure(
    closureId: string,
    recoveryId: string,
    target: string,
    reason: string
  ): SovereignRecoveryClosureResult {
    return {
      closureId,
      recoveryId,
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
      this.controllerCanCreateAuthority === false &&
      this.controllerCanEscalateAuthority === false &&
      this.controllerCanOverrideOwner === false &&
      this.controllerCanBypassSecurity === false &&
      this.controllerCanIgnoreIntegrityFailure === false &&
      this.controllerCanIgnoreRegression === false &&
      this.controllerCanCloseUnstableRecovery === false &&
      this.controllerCanClosePendingIsolation === false &&
      this.controllerCanFalsifyEvidence === false &&
      this.controllerCanDisableAudit === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsRecoveryClosureController =
  new SovereignOperationsRecoveryClosureController();

export default sovereignOperationsRecoveryClosureController;
