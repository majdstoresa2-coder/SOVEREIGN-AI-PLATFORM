// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-INCIDENT-CLOSURE-CONTROLLER-152.ts
// Sequence: 152
// Purpose: Sovereign Incident Closure, Resolution Validation,
//          Evidence Enforcement & Controlled Operational Closure
// ============================================================================

export const SOVEREIGN_OPERATIONS_INCIDENT_CLOSURE_CONTROLLER_ID =
  "SOVEREIGN-OPERATIONS-INCIDENT-CLOSURE-CONTROLLER-152";

export const SOVEREIGN_OPERATIONS_INCIDENT_CLOSURE_CONTROLLER_VERSION =
  "1.0.0";

export type SovereignIncidentClosureState =
  | "REGISTERED"
  | "VALIDATING"
  | "READY"
  | "DEFERRED"
  | "REJECTED"
  | "CLOSED"
  | "BLOCKED";

export type SovereignIncidentClosureDecision =
  | "VALIDATE"
  | "CLOSE"
  | "DEFER"
  | "REJECT"
  | "BLOCK";

export type SovereignIncidentSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SovereignIncidentClosureAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignIncidentClosureEvidence {
  incidentContained: boolean;
  incidentResolved: boolean;

  recoveryRequired: boolean;
  recoveryClosed: boolean;

  servicesStable: boolean;
  securityHealthy: boolean;
  dataIntegrityHealthy: boolean;
  stateConsistent: boolean;

  monitoringHealthy: boolean;

  rootCauseRecorded: boolean;
  timelineRecorded: boolean;
  impactRecorded: boolean;

  correctiveActionsRecorded: boolean;
  criticalCorrectiveActionsCompleted: boolean;

  auditComplete: boolean;
  finalReportStored: boolean;

  unresolvedCriticalRisk: boolean;
  regressionDetected: boolean;
  isolationStillRequired: boolean;
}

export interface SovereignIncidentClosurePolicy {
  requireContainment: boolean;
  requireResolution: boolean;

  requireRecoveryClosureWhenNeeded: boolean;

  requireServiceStability: boolean;
  requireSecurityHealth: boolean;
  requireDataIntegrity: boolean;
  requireStateConsistency: boolean;

  requireMonitoring: boolean;

  requireRootCause: boolean;
  requireTimeline: boolean;
  requireImpactRecord: boolean;

  requireCorrectiveActions: boolean;
  requireCriticalCorrectiveActionCompletion: boolean;

  requireAudit: boolean;
  requireFinalReport: boolean;

  rejectCriticalRisk: boolean;
  rejectRegression: boolean;
  rejectPendingIsolation: boolean;
}

export interface SovereignIncidentClosureRequest {
  closureId: string;
  incidentId: string;

  recoveryClosureId?: string;

  target: string;
  requestedBy: string;

  severity: SovereignIncidentSeverity;

  authorityContext: SovereignIncidentClosureAuthorityContext;

  evidence: SovereignIncidentClosureEvidence;
  policy: SovereignIncidentClosurePolicy;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignIncidentClosureRecord {
  closureId: string;
  incidentId: string;

  recoveryClosureId?: string;

  target: string;
  severity: SovereignIncidentSeverity;

  state: SovereignIncidentClosureState;
  decision: SovereignIncidentClosureDecision;

  createdAt: number;
  evaluatedAt: number;
  closedAt?: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignIncidentClosureResult {
  closureId: string;
  incidentId: string;

  target: string;

  accepted: boolean;

  state: SovereignIncidentClosureState;
  decision: SovereignIncidentClosureDecision;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsIncidentClosureController {
  public readonly id =
    SOVEREIGN_OPERATIONS_INCIDENT_CLOSURE_CONTROLLER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_INCIDENT_CLOSURE_CONTROLLER_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly controllerCanCreateAuthority = false;
  public readonly controllerCanEscalateAuthority = false;
  public readonly controllerCanOverrideOwner = false;

  public readonly controllerCanBypassSecurity = false;
  public readonly controllerCanIgnoreIntegrityFailure = false;
  public readonly controllerCanIgnoreCriticalRisk = false;
  public readonly controllerCanIgnoreRegression = false;

  public readonly controllerCanCloseUnresolvedIncident = false;
  public readonly controllerCanClosePendingRecovery = false;
  public readonly controllerCanClosePendingIsolation = false;

  public readonly controllerCanFalsifyEvidence = false;
  public readonly controllerCanDisableAudit = false;

  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignIncidentClosureRecord>();

  private validateRequest(
    request: SovereignIncidentClosureRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.closureId) {
      reasons.push("CLOSURE_ID_REQUIRED");
    }

    if (!request.incidentId) {
      reasons.push("INCIDENT_ID_REQUIRED");
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
    evidence: SovereignIncidentClosureEvidence,
    policy: SovereignIncidentClosurePolicy
  ): string[] {
    const reasons: string[] = [];

    if (
      policy.requireContainment &&
      !evidence.incidentContained
    ) {
      reasons.push("INCIDENT_NOT_CONTAINED");
    }

    if (
      policy.requireResolution &&
      !evidence.incidentResolved
    ) {
      reasons.push("INCIDENT_NOT_RESOLVED");
    }

    if (
      policy.requireRecoveryClosureWhenNeeded &&
      evidence.recoveryRequired &&
      !evidence.recoveryClosed
    ) {
      reasons.push("RECOVERY_NOT_CLOSED");
    }

    if (
      policy.requireServiceStability &&
      !evidence.servicesStable
    ) {
      reasons.push("SERVICES_NOT_STABLE");
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
      policy.requireRootCause &&
      !evidence.rootCauseRecorded
    ) {
      reasons.push("ROOT_CAUSE_NOT_RECORDED");
    }

    if (
      policy.requireTimeline &&
      !evidence.timelineRecorded
    ) {
      reasons.push("INCIDENT_TIMELINE_NOT_RECORDED");
    }

    if (
      policy.requireImpactRecord &&
      !evidence.impactRecorded
    ) {
      reasons.push("INCIDENT_IMPACT_NOT_RECORDED");
    }

    if (
      policy.requireCorrectiveActions &&
      !evidence.correctiveActionsRecorded
    ) {
      reasons.push("CORRECTIVE_ACTIONS_NOT_RECORDED");
    }

    if (
      policy.requireCriticalCorrectiveActionCompletion &&
      !evidence.criticalCorrectiveActionsCompleted
    ) {
      reasons.push(
        "CRITICAL_CORRECTIVE_ACTIONS_INCOMPLETE"
      );
    }

    if (
      policy.requireAudit &&
      !evidence.auditComplete
    ) {
      reasons.push("INCIDENT_AUDIT_INCOMPLETE");
    }

    if (
      policy.requireFinalReport &&
      !evidence.finalReportStored
    ) {
      reasons.push("FINAL_INCIDENT_REPORT_NOT_STORED");
    }

    if (
      policy.rejectCriticalRisk &&
      evidence.unresolvedCriticalRisk
    ) {
      reasons.push("UNRESOLVED_CRITICAL_RISK");
    }

    if (
      policy.rejectRegression &&
      evidence.regressionDetected
    ) {
      reasons.push("REGRESSION_DETECTED");
    }

    if (
      policy.rejectPendingIsolation &&
      evidence.isolationStillRequired
    ) {
      reasons.push("ISOLATION_STILL_REQUIRED");
    }

    return reasons;
  }

  private containsHardBlock(
    reasons: string[]
  ): boolean {
    const hardBlocks = new Set([
      "INCIDENT_NOT_RESOLVED",
      "RECOVERY_NOT_CLOSED",
      "SECURITY_HEALTH_FAILED",
      "DATA_INTEGRITY_FAILED",
      "UNRESOLVED_CRITICAL_RISK",
      "REGRESSION_DETECTED",
      "ISOLATION_STILL_REQUIRED"
    ]);

    return reasons.some(
      (reason) => hardBlocks.has(reason)
    );
  }

  public evaluate(
    request: SovereignIncidentClosureRequest,
    now = Date.now()
  ): SovereignIncidentClosureResult {
    if (
      this.records.has(request.closureId)
    ) {
      return this.failure(
        request.closureId,
        request.incidentId,
        request.target,
        "INCIDENT_CLOSURE_ALREADY_EXISTS"
      );
    }

    const validation =
      this.validateRequest(request);

    if (validation.length > 0) {
      return {
        closureId: request.closureId,
        incidentId: request.incidentId,
        target: request.target,

        accepted: false,

        state: "BLOCKED",
        decision: "BLOCK",

        reasons: validation,

        timestamp: now,

        authority: "NONE"
      };
    }

    const evidenceFailures =
      this.validateEvidence(
        request.evidence,
        request.policy
      );

    let state: SovereignIncidentClosureState;
    let decision: SovereignIncidentClosureDecision;

    if (evidenceFailures.length === 0) {
      state = "READY";
      decision = "VALIDATE";
    } else if (
      this.containsHardBlock(
        evidenceFailures
      )
    ) {
      state = "BLOCKED";
      decision = "BLOCK";
    } else {
      state = "DEFERRED";
      decision = "DEFER";
    }

    const record: SovereignIncidentClosureRecord = {
      closureId: request.closureId,
      incidentId: request.incidentId,

      recoveryClosureId:
        request.recoveryClosureId,

      target: request.target,
      severity: request.severity,

      state,
      decision,

      createdAt: request.createdAt,
      evaluatedAt: now,

      reasons:
        evidenceFailures.length === 0
          ? ["INCIDENT_CLOSURE_READY"]
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
  ): SovereignIncidentClosureResult {
    const record =
      this.records.get(closureId);

    if (!record) {
      return this.failure(
        closureId,
        "",
        "",
        "INCIDENT_CLOSURE_NOT_FOUND"
      );
    }

    if (
      record.state !== "READY" ||
      record.decision !== "VALIDATE"
    ) {
      return this.failure(
        record.closureId,
        record.incidentId,
        record.target,
        "INCIDENT_NOT_READY_FOR_CLOSURE"
      );
    }

    record.state = "CLOSED";
    record.decision = "CLOSE";

    record.closedAt = now;
    record.evaluatedAt = now;

    record.reasons = [
      "INCIDENT_CLOSED_SUCCESSFULLY",
      "INCIDENT_FINAL_STATE_CERTIFIED"
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
  ): SovereignIncidentClosureResult {
    const record =
      this.records.get(closureId);

    if (!record) {
      return this.failure(
        closureId,
        "",
        "",
        "INCIDENT_CLOSURE_NOT_FOUND"
      );
    }

    if (record.state === "CLOSED") {
      return this.failure(
        record.closureId,
        record.incidentId,
        record.target,
        "INCIDENT_ALREADY_CLOSED"
      );
    }

    record.state = "REJECTED";
    record.decision = "REJECT";
    record.evaluatedAt = now;

    record.reasons = [
      reason ||
        "INCIDENT_CLOSURE_REJECTED"
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
  ): SovereignIncidentClosureRecord | undefined {
    const record =
      this.records.get(closureId);

    return record
      ? this.cloneRecord(record)
      : undefined;
  }

  public getClosedIncidents():
    SovereignIncidentClosureRecord[] {
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
    SovereignIncidentClosureRecord[] {
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
    SovereignIncidentClosureRecord[] {
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
    record: SovereignIncidentClosureRecord
  ): SovereignIncidentClosureRecord {
    return {
      ...record,
      reasons: [...record.reasons]
    };
  }

  private result(
    record: SovereignIncidentClosureRecord,
    now: number
  ): SovereignIncidentClosureResult {
    return {
      closureId: record.closureId,
      incidentId: record.incidentId,
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
    incidentId: string,
    target: string,
    reason: string
  ): SovereignIncidentClosureResult {
    return {
      closureId,
      incidentId,
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
      this.controllerCanIgnoreCriticalRisk === false &&
      this.controllerCanIgnoreRegression === false &&
      this.controllerCanCloseUnresolvedIncident === false &&
      this.controllerCanClosePendingRecovery === false &&
      this.controllerCanClosePendingIsolation === false &&
      this.controllerCanFalsifyEvidence === false &&
      this.controllerCanDisableAudit === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsIncidentClosureController =
  new SovereignOperationsIncidentClosureController();

export default sovereignOperationsIncidentClosureController;
