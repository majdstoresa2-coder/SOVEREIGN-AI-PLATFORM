// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-INCIDENT-RECLOSURE-CONTROLLER-163.ts
// Sequence: 163
// Purpose: Sovereign Reopened-Incident Reclosure, Final Validation,
//          Recurrence Resolution & Controlled Operational Closure
// ============================================================================

export const SOVEREIGN_OPERATIONS_INCIDENT_RECLOSURE_CONTROLLER_ID =
  "SOVEREIGN-OPERATIONS-INCIDENT-RECLOSURE-CONTROLLER-163";

export const SOVEREIGN_OPERATIONS_INCIDENT_RECLOSURE_CONTROLLER_VERSION =
  "1.0.0";

export type SovereignIncidentReclosureState =
  | "REGISTERED"
  | "VALIDATING"
  | "READY"
  | "RECLOSED"
  | "DEFERRED"
  | "REJECTED"
  | "BLOCKED";

export type SovereignIncidentReclosureDecision =
  | "VALIDATE"
  | "RECLOSE"
  | "DEFER"
  | "REJECT"
  | "BLOCK";

export interface SovereignIncidentReclosureAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignIncidentReclosureEvidence {
  reopenedIncidentActive: boolean;
  reopenedLifecycleComplete: boolean;

  recurrenceResolved: boolean;

  containmentCompleted: boolean;
  recoveryCompleted: boolean;
  verificationPassed: boolean;

  serviceStable: boolean;

  securityHealthy: boolean;
  integrityHealthy: boolean;

  correctiveActionsUpdated: boolean;
  correctiveActionsVerified: boolean;

  preventiveControlsUpdated: boolean;
  preventiveControlsVerified: boolean;

  recurrenceMonitoringHealthy: boolean;

  auditComplete: boolean;
  reopenAuditComplete: boolean;

  finalReportStored: boolean;
  finalSnapshotStored: boolean;

  unresolvedCriticalRisk: boolean;
  unresolvedSecurityRisk: boolean;
  unresolvedIntegrityRisk: boolean;

  recurrenceStillDetected: boolean;
  regressionDetected: boolean;
  isolationStillRequired: boolean;
}

export interface SovereignIncidentReclosurePolicy {
  requireReopenedIncident: boolean;
  requireLifecycleCompletion: boolean;

  requireRecurrenceResolution: boolean;

  requireContainment: boolean;
  requireRecovery: boolean;
  requireVerification: boolean;

  requireServiceStability: boolean;

  requireSecurityHealth: boolean;
  requireIntegrityHealth: boolean;

  requireCorrectiveActionUpdate: boolean;
  requireCorrectiveVerification: boolean;

  requirePreventiveControlUpdate: boolean;
  requirePreventiveVerification: boolean;

  requireRecurrenceMonitoring: boolean;

  requireAudit: boolean;
  requireReopenAudit: boolean;

  requireFinalReport: boolean;
  requireFinalSnapshot: boolean;

  rejectCriticalRisk: boolean;
  rejectSecurityRisk: boolean;
  rejectIntegrityRisk: boolean;

  rejectRecurrence: boolean;
  rejectRegression: boolean;
  rejectPendingIsolation: boolean;
}

export interface SovereignIncidentReclosureRequest {
  reclosureId: string;

  incidentId: string;
  reopenId: string;
  reopenVerificationId: string;
  reopenAuditId: string;
  lifecycleId: string;

  target: string;
  requestedBy: string;

  authorityContext:
    SovereignIncidentReclosureAuthorityContext;

  evidence:
    SovereignIncidentReclosureEvidence;

  policy:
    SovereignIncidentReclosurePolicy;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignIncidentReclosureRecord {
  reclosureId: string;

  incidentId: string;
  reopenId: string;
  reopenVerificationId: string;
  reopenAuditId: string;
  lifecycleId: string;

  target: string;

  state: SovereignIncidentReclosureState;
  decision: SovereignIncidentReclosureDecision;

  createdAt: number;
  evaluatedAt: number;

  reclosedAt?: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignIncidentReclosureResult {
  reclosureId: string;
  incidentId: string;

  target: string;

  accepted: boolean;

  state: SovereignIncidentReclosureState;
  decision: SovereignIncidentReclosureDecision;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsIncidentReclosureController {
  public readonly id =
    SOVEREIGN_OPERATIONS_INCIDENT_RECLOSURE_CONTROLLER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_INCIDENT_RECLOSURE_CONTROLLER_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly controllerCanCreateAuthority = false;
  public readonly controllerCanEscalateAuthority = false;
  public readonly controllerCanOverrideOwner = false;

  public readonly controllerCanBypassSecurity = false;
  public readonly controllerCanIgnoreIntegrityRisk = false;

  public readonly controllerCanIgnoreCriticalRisk = false;
  public readonly controllerCanIgnoreRecurrence = false;
  public readonly controllerCanIgnoreRegression = false;

  public readonly controllerCanClosePendingIsolation = false;
  public readonly controllerCanFalsifyEvidence = false;
  public readonly controllerCanDisableAudit = false;

  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignIncidentReclosureRecord>();

  public evaluate(
    request: SovereignIncidentReclosureRequest,
    now = Date.now()
  ): SovereignIncidentReclosureResult {
    if (this.records.has(request.reclosureId)) {
      return this.failure(
        request.reclosureId,
        request.incidentId,
        request.target,
        "INCIDENT_RECLOSURE_ALREADY_EXISTS"
      );
    }

    const failures = [
      ...this.validateRequest(request),
      ...this.validateEvidence(
        request.evidence,
        request.policy
      )
    ];

    let state: SovereignIncidentReclosureState;
    let decision: SovereignIncidentReclosureDecision;

    if (failures.length === 0) {
      state = "READY";
      decision = "VALIDATE";
    } else if (this.hasHardBlock(failures)) {
      state = "BLOCKED";
      decision = "BLOCK";
    } else {
      state = "DEFERRED";
      decision = "DEFER";
    }

    const record: SovereignIncidentReclosureRecord = {
      reclosureId: request.reclosureId,

      incidentId: request.incidentId,
      reopenId: request.reopenId,
      reopenVerificationId:
        request.reopenVerificationId,
      reopenAuditId:
        request.reopenAuditId,
      lifecycleId:
        request.lifecycleId,

      target: request.target,

      state,
      decision,

      createdAt: request.createdAt,
      evaluatedAt: now,

      reasons:
        failures.length === 0
          ? [
              "INCIDENT_RECLOSURE_READY",
              "RECURRENCE_RESOLUTION_VALIDATED"
            ]
          : failures,

      authority: "NONE"
    };

    this.records.set(
      request.reclosureId,
      record
    );

    return this.result(record, now);
  }

  public reclose(
    reclosureId: string,
    now = Date.now()
  ): SovereignIncidentReclosureResult {
    const record =
      this.records.get(reclosureId);

    if (!record) {
      return this.failure(
        reclosureId,
        "",
        "",
        "INCIDENT_RECLOSURE_NOT_FOUND"
      );
    }

    if (
      record.state !== "READY" ||
      record.decision !== "VALIDATE"
    ) {
      return this.failure(
        record.reclosureId,
        record.incidentId,
        record.target,
        "INCIDENT_NOT_READY_FOR_RECLOSURE"
      );
    }

    record.state = "RECLOSED";
    record.decision = "RECLOSE";

    record.reclosedAt = now;
    record.evaluatedAt = now;

    record.reasons = [
      "REOPENED_INCIDENT_RECLOSED_SUCCESSFULLY",
      "RECURRENCE_CYCLE_CLOSED",
      "FINAL_STATE_CERTIFIED"
    ];

    this.records.set(
      reclosureId,
      record
    );

    return this.result(record, now);
  }

  public reject(
    reclosureId: string,
    reason: string,
    now = Date.now()
  ): SovereignIncidentReclosureResult {
    const record =
      this.records.get(reclosureId);

    if (!record) {
      return this.failure(
        reclosureId,
        "",
        "",
        "INCIDENT_RECLOSURE_NOT_FOUND"
      );
    }

    if (record.state === "RECLOSED") {
      return this.failure(
        record.reclosureId,
        record.incidentId,
        record.target,
        "INCIDENT_ALREADY_RECLOSED"
      );
    }

    record.state = "REJECTED";
    record.decision = "REJECT";
    record.evaluatedAt = now;

    record.reasons = [
      reason ||
        "INCIDENT_RECLOSURE_REJECTED"
    ];

    this.records.set(
      reclosureId,
      record
    );

    return this.result(record, now);
  }

  private validateRequest(
    request: SovereignIncidentReclosureRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.reclosureId) {
      reasons.push(
        "RECLOSURE_ID_REQUIRED"
      );
    }

    if (!request.incidentId) {
      reasons.push(
        "INCIDENT_ID_REQUIRED"
      );
    }

    if (!request.reopenId) {
      reasons.push(
        "REOPEN_ID_REQUIRED"
      );
    }

    if (!request.reopenVerificationId) {
      reasons.push(
        "REOPEN_VERIFICATION_ID_REQUIRED"
      );
    }

    if (!request.reopenAuditId) {
      reasons.push(
        "REOPEN_AUDIT_ID_REQUIRED"
      );
    }

    if (!request.lifecycleId) {
      reasons.push(
        "LIFECYCLE_ID_REQUIRED"
      );
    }

    if (!request.target) {
      reasons.push(
        "TARGET_REQUIRED"
      );
    }

    if (!request.requestedBy) {
      reasons.push(
        "REQUESTER_REQUIRED"
      );
    }

    if (!request.securityApproved) {
      reasons.push(
        "SECURITY_APPROVAL_REQUIRED"
      );
    }

    if (!request.policyApproved) {
      reasons.push(
        "POLICY_APPROVAL_REQUIRED"
      );
    }

    if (
      !request.authorityContext.ownerId
    ) {
      reasons.push(
        "OWNER_ID_REQUIRED"
      );
    }

    if (
      request.authorityContext.ownerAuthority !==
      "SUPREME"
    ) {
      reasons.push(
        "OWNER_MUST_REMAIN_SUPREME"
      );
    }

    if (
      request.authorityContext.stewardAuthority !==
      "DELEGATED"
    ) {
      reasons.push(
        "STEWARD_MUST_REMAIN_DELEGATED"
      );
    }

    return reasons;
  }

  private validateEvidence(
    evidence: SovereignIncidentReclosureEvidence,
    policy: SovereignIncidentReclosurePolicy
  ): string[] {
    const reasons: string[] = [];

    if (
      policy.requireReopenedIncident &&
      !evidence.reopenedIncidentActive
    ) {
      reasons.push(
        "REOPENED_INCIDENT_NOT_ACTIVE"
      );
    }

    if (
      policy.requireLifecycleCompletion &&
      !evidence.reopenedLifecycleComplete
    ) {
      reasons.push(
        "REOPEN_LIFECYCLE_INCOMPLETE"
      );
    }

    if (
      policy.requireRecurrenceResolution &&
      !evidence.recurrenceResolved
    ) {
      reasons.push(
        "RECURRENCE_NOT_RESOLVED"
      );
    }

    if (
      policy.requireContainment &&
      !evidence.containmentCompleted
    ) {
      reasons.push(
        "CONTAINMENT_INCOMPLETE"
      );
    }

    if (
      policy.requireRecovery &&
      !evidence.recoveryCompleted
    ) {
      reasons.push(
        "RECOVERY_INCOMPLETE"
      );
    }

    if (
      policy.requireVerification &&
      !evidence.verificationPassed
    ) {
      reasons.push(
        "VERIFICATION_NOT_PASSED"
      );
    }

    if (
      policy.requireServiceStability &&
      !evidence.serviceStable
    ) {
      reasons.push(
        "SERVICE_NOT_STABLE"
      );
    }

    if (
      policy.requireSecurityHealth &&
      !evidence.securityHealthy
    ) {
      reasons.push(
        "SECURITY_HEALTH_FAILED"
      );
    }

    if (
      policy.requireIntegrityHealth &&
      !evidence.integrityHealthy
    ) {
      reasons.push(
        "INTEGRITY_HEALTH_FAILED"
      );
    }

    if (
      policy.requireCorrectiveActionUpdate &&
      !evidence.correctiveActionsUpdated
    ) {
      reasons.push(
        "CORRECTIVE_ACTIONS_NOT_UPDATED"
      );
    }

    if (
      policy.requireCorrectiveVerification &&
      !evidence.correctiveActionsVerified
    ) {
      reasons.push(
        "CORRECTIVE_ACTIONS_NOT_VERIFIED"
      );
    }

    if (
      policy.requirePreventiveControlUpdate &&
      !evidence.preventiveControlsUpdated
    ) {
      reasons.push(
        "PREVENTIVE_CONTROLS_NOT_UPDATED"
      );
    }

    if (
      policy.requirePreventiveVerification &&
      !evidence.preventiveControlsVerified
    ) {
      reasons.push(
        "PREVENTIVE_CONTROLS_NOT_VERIFIED"
      );
    }

    if (
      policy.requireRecurrenceMonitoring &&
      !evidence.recurrenceMonitoringHealthy
    ) {
      reasons.push(
        "RECURRENCE_MONITORING_NOT_HEALTHY"
      );
    }

    if (
      policy.requireAudit &&
      !evidence.auditComplete
    ) {
      reasons.push(
        "INCIDENT_AUDIT_INCOMPLETE"
      );
    }

    if (
      policy.requireReopenAudit &&
      !evidence.reopenAuditComplete
    ) {
      reasons.push(
        "REOPEN_AUDIT_INCOMPLETE"
      );
    }

    if (
      policy.requireFinalReport &&
      !evidence.finalReportStored
    ) {
      reasons.push(
        "FINAL_REPORT_NOT_STORED"
      );
    }

    if (
      policy.requireFinalSnapshot &&
      !evidence.finalSnapshotStored
    ) {
      reasons.push(
        "FINAL_SNAPSHOT_NOT_STORED"
      );
    }

    if (
      policy.rejectCriticalRisk &&
      evidence.unresolvedCriticalRisk
    ) {
      reasons.push(
        "UNRESOLVED_CRITICAL_RISK"
      );
    }

    if (
      policy.rejectSecurityRisk &&
      evidence.unresolvedSecurityRisk
    ) {
      reasons.push(
        "UNRESOLVED_SECURITY_RISK"
      );
    }

    if (
      policy.rejectIntegrityRisk &&
      evidence.unresolvedIntegrityRisk
    ) {
      reasons.push(
        "UNRESOLVED_INTEGRITY_RISK"
      );
    }

    if (
      policy.rejectRecurrence &&
      evidence.recurrenceStillDetected
    ) {
      reasons.push(
        "RECURRENCE_STILL_DETECTED"
      );
    }

    if (
      policy.rejectRegression &&
      evidence.regressionDetected
    ) {
      reasons.push(
        "REGRESSION_DETECTED"
      );
    }

    if (
      policy.rejectPendingIsolation &&
      evidence.isolationStillRequired
    ) {
      reasons.push(
        "ISOLATION_STILL_REQUIRED"
      );
    }

    return reasons;
  }

  private hasHardBlock(
    reasons: string[]
  ): boolean {
    const hardBlocks =
      new Set<string>([
        "RECURRENCE_NOT_RESOLVED",
        "SECURITY_HEALTH_FAILED",
        "INTEGRITY_HEALTH_FAILED",
        "UNRESOLVED_CRITICAL_RISK",
        "UNRESOLVED_SECURITY_RISK",
        "UNRESOLVED_INTEGRITY_RISK",
        "RECURRENCE_STILL_DETECTED",
        "REGRESSION_DETECTED",
        "ISOLATION_STILL_REQUIRED"
      ]);

    return reasons.some(
      (reason) =>
        hardBlocks.has(reason)
    );
  }

  public getRecord(
    reclosureId: string
  ):
    | SovereignIncidentReclosureRecord
    | undefined {
    const record =
      this.records.get(reclosureId);

    return record
      ? {
          ...record,
          reasons
