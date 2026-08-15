// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-RECURRENCE-PREVENTION-CONTROLLER-156.ts
// Sequence: 156
// Purpose: Recurrence Prevention Control, Preventive Safeguards,
//          Verification Enforcement & Sovereign Operational Assurance
// ============================================================================

export const SOVEREIGN_OPERATIONS_RECURRENCE_PREVENTION_CONTROLLER_ID =
  "SOVEREIGN-OPERATIONS-RECURRENCE-PREVENTION-CONTROLLER-156";

export const SOVEREIGN_OPERATIONS_RECURRENCE_PREVENTION_CONTROLLER_VERSION =
  "1.0.0";

export type SovereignRecurrencePreventionState =
  | "REGISTERED"
  | "EVALUATING"
  | "READY"
  | "ACTIVE"
  | "DEGRADED"
  | "FAILED"
  | "BLOCKED";

export type SovereignRecurrencePreventionDecision =
  | "EVALUATE"
  | "ACTIVATE"
  | "REMEDIATE"
  | "FAIL"
  | "BLOCK";

export interface SovereignRecurrencePreventionAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignPreventiveControl {
  controlId: string;

  category:
    | "SECURITY"
    | "INTEGRITY"
    | "RUNTIME"
    | "MONITORING"
    | "RECOVERY"
    | "DEPENDENCY"
    | "CAPACITY"
    | "PROCESS"
    | "GOVERNANCE"
    | "OTHER";

  description: string;

  enabled: boolean;
  tested: boolean;
  effective: boolean;

  mandatory: boolean;

  lastTestedAt?: number;
}

export interface SovereignRecurrencePreventionEvidence {
  incidentClosed: boolean;
  postIncidentReviewApproved: boolean;

  correctiveActionsCompleted: boolean;
  correctiveActionsVerified: boolean;

  rootCauseResolved: boolean;

  preventiveControlsInstalled: boolean;
  preventiveControlsTested: boolean;

  monitoringUpdated: boolean;
  alertingUpdated: boolean;

  recoveryProceduresUpdated: boolean;
  operationalProceduresUpdated: boolean;

  securityValidated: boolean;
  integrityValidated: boolean;

  documentationStored: boolean;
  auditEvidenceStored: boolean;

  recurrenceDetected: boolean;
  regressionDetected: boolean;

  unresolvedCriticalRisk: boolean;
  unresolvedSecurityRisk: boolean;
  unresolvedIntegrityRisk: boolean;
}

export interface SovereignRecurrencePreventionPolicy {
  requireIncidentClosure: boolean;
  requirePostIncidentReview: boolean;

  requireCorrectiveActions: boolean;
  requireCorrectiveVerification: boolean;

  requireRootCauseResolution: boolean;

  requirePreventiveControls: boolean;
  requirePreventiveControlTesting: boolean;

  requireMonitoringUpdate: boolean;
  requireAlertingUpdate: boolean;

  requireRecoveryProcedureUpdate: boolean;
  requireOperationalProcedureUpdate: boolean;

  requireSecurityValidation: boolean;
  requireIntegrityValidation: boolean;

  requireDocumentation: boolean;
  requireAuditEvidence: boolean;

  rejectRecurrence: boolean;
  rejectRegression: boolean;

  rejectCriticalRisk: boolean;
  rejectSecurityRisk: boolean;
  rejectIntegrityRisk: boolean;
}

export interface SovereignRecurrencePreventionRequest {
  preventionId: string;

  incidentId: string;
  reviewId: string;

  correctiveActionIds: string[];
  verificationIds: string[];

  target: string;
  requestedBy: string;

  authorityContext:
    SovereignRecurrencePreventionAuthorityContext;

  controls: SovereignPreventiveControl[];

  evidence:
    SovereignRecurrencePreventionEvidence;

  policy:
    SovereignRecurrencePreventionPolicy;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignRecurrencePreventionRecord {
  preventionId: string;

  incidentId: string;
  reviewId: string;

  correctiveActionIds: string[];
  verificationIds: string[];

  target: string;

  controls: SovereignPreventiveControl[];

  state: SovereignRecurrencePreventionState;
  decision: SovereignRecurrencePreventionDecision;

  createdAt: number;
  evaluatedAt: number;
  activatedAt?: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignRecurrencePreventionResult {
  preventionId: string;
  incidentId: string;

  target: string;

  accepted: boolean;

  state: SovereignRecurrencePreventionState;
  decision: SovereignRecurrencePreventionDecision;

  totalControls: number;
  effectiveControls: number;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsRecurrencePreventionController {
  public readonly id =
    SOVEREIGN_OPERATIONS_RECURRENCE_PREVENTION_CONTROLLER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_RECURRENCE_PREVENTION_CONTROLLER_VERSION;

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

  public readonly controllerCanIgnoreRecurrence = false;
  public readonly controllerCanIgnoreRegression = false;

  public readonly controllerCanIgnoreCriticalRisk = false;

  public readonly controllerCanFalsifyEvidence = false;
  public readonly controllerCanDisableMandatoryControl = false;
  public readonly controllerCanDisableAudit = false;

  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<
      string,
      SovereignRecurrencePreventionRecord
    >();

  public evaluate(
    request: SovereignRecurrencePreventionRequest,
    now = Date.now()
  ): SovereignRecurrencePreventionResult {
    if (
      this.records.has(request.preventionId)
    ) {
      return this.failure(
        request.preventionId,
        request.incidentId,
        request.target,
        "RECURRENCE_PREVENTION_ALREADY_EXISTS"
      );
    }

    const failures = [
      ...this.validateRequest(request),
      ...this.validateEvidence(
        request.evidence,
        request.policy
      ),
      ...this.validateControls(
        request.controls,
        request.policy
      )
    ];

    let state: SovereignRecurrencePreventionState;
    let decision: SovereignRecurrencePreventionDecision;

    if (failures.length === 0) {
      state = "READY";
      decision = "ACTIVATE";
    } else if (this.hasHardBlock(failures)) {
      state = "BLOCKED";
      decision = "BLOCK";
    } else {
      state = "DEGRADED";
      decision = "REMEDIATE";
    }

    const record: SovereignRecurrencePreventionRecord = {
      preventionId: request.preventionId,

      incidentId: request.incidentId,
      reviewId: request.reviewId,

      correctiveActionIds: [
        ...request.correctiveActionIds
      ],

      verificationIds: [
        ...request.verificationIds
      ],

      target: request.target,

      controls: request.controls.map(
        (control) => ({ ...control })
      ),

      state,
      decision,

      createdAt: request.createdAt,
      evaluatedAt: now,

      reasons:
        failures.length === 0
          ? [
              "RECURRENCE_PREVENTION_READY",
              "PREVENTIVE_CONTROLS_VALIDATED"
            ]
          : failures,

      authority: "NONE"
    };

    this.records.set(
      request.preventionId,
      record
    );

    return this.result(record, now);
  }

  public activate(
    preventionId: string,
    now = Date.now()
  ): SovereignRecurrencePreventionResult {
    const record =
      this.records.get(preventionId);

    if (!record) {
      return this.failure(
        preventionId,
        "",
        "",
        "RECURRENCE_PREVENTION_NOT_FOUND"
      );
    }

    if (
      record.state !== "READY" ||
      record.decision !== "ACTIVATE"
    ) {
      return this.failure(
        record.preventionId,
        record.incidentId,
        record.target,
        "RECURRENCE_PREVENTION_NOT_READY"
      );
    }

    const invalidMandatoryControl =
      record.controls.some(
        (control) =>
          control.mandatory &&
          (
            !control.enabled ||
            !control.tested ||
            !control.effective
          )
      );

    if (invalidMandatoryControl) {
      record.state = "BLOCKED";
      record.decision = "BLOCK";
      record.evaluatedAt = now;

      record.reasons = [
        "MANDATORY_PREVENTIVE_CONTROL_INVALID"
      ];

      return this.result(record, now);
    }

    record.state = "ACTIVE";
    record.decision = "ACTIVATE";

    record.activatedAt = now;
    record.evaluatedAt = now;

    record.reasons = [
      "RECURRENCE_PREVENTION_ACTIVE",
      "MANDATORY_CONTROLS_ENFORCED"
    ];

    return this.result(record, now);
  }

  private validateRequest(
    request: SovereignRecurrencePreventionRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.preventionId) {
      reasons.push("PREVENTION_ID_REQUIRED");
    }

    if (!request.incidentId) {
      reasons.push("INCIDENT_ID_REQUIRED");
    }

    if (!request.reviewId) {
      reasons.push("REVIEW_ID_REQUIRED");
    }

    if (!request.target) {
      reasons.push("TARGET_REQUIRED");
    }

    if (!request.requestedBy) {
      reasons.push("REQUESTER_REQUIRED");
    }

    if (
      request.correctiveActionIds.length === 0
    ) {
      reasons.push(
        "CORRECTIVE_ACTION_REFERENCE_REQUIRED"
      );
    }

    if (
      request.verificationIds.length === 0
    ) {
      reasons.push(
        "CORRECTIVE_VERIFICATION_REFERENCE_REQUIRED"
      );
    }

    if (!request.authorityContext.ownerId) {
      reasons.push("OWNER_ID_REQUIRED");
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
    evidence: SovereignRecurrencePreventionEvidence,
    policy: SovereignRecurrencePreventionPolicy
  ): string[] {
    const reasons: string[] = [];

    if (
      policy.requireIncidentClosure &&
      !evidence.incidentClosed
    ) {
      reasons.push("INCIDENT_NOT_CLOSED");
    }

    if (
      policy.requirePostIncidentReview &&
      !evidence.postIncidentReviewApproved
    ) {
      reasons.push(
        "POST_INCIDENT_REVIEW_NOT_APPROVED"
      );
    }

    if (
      policy.requireCorrectiveActions &&
      !evidence.correctiveActionsCompleted
    ) {
      reasons.push(
        "CORRECTIVE_ACTIONS_INCOMPLETE"
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
      policy.requireRootCauseResolution &&
      !evidence.rootCauseResolved
    ) {
      reasons.push(
        "ROOT_CAUSE_NOT_RESOLVED"
      );
    }

    if (
      policy.requirePreventiveControls &&
      !evidence.preventiveControlsInstalled
    ) {
      reasons.push(
        "PREVENTIVE_CONTROLS_NOT_INSTALLED"
      );
    }

    if (
      policy.requirePreventiveControlTesting &&
      !evidence.preventiveControlsTested
    ) {
      reasons.push(
        "PREVENTIVE_CONTROLS_NOT_TESTED"
      );
    }

    if (
      policy.requireMonitoringUpdate &&
      !evidence.monitoringUpdated
    ) {
      reasons.push("MONITORING_NOT_UPDATED");
    }

    if (
      policy.requireAlertingUpdate &&
      !evidence.alertingUpdated
    ) {
      reasons.push("ALERTING_NOT_UPDATED");
    }

    if (
      policy.requireRecoveryProcedureUpdate &&
      !evidence.recoveryProceduresUpdated
    ) {
      reasons.push(
        "RECOVERY_PROCEDURES_NOT_UPDATED"
      );
    }

    if (
      policy.requireOperationalProcedureUpdate &&
      !evidence.operationalProceduresUpdated
    ) {
      reasons.push(
        "OPERATIONAL_PROCEDURES_NOT_UPDATED"
      );
    }

    if (
      policy.requireSecurityValidation &&
      !evidence.securityValidated
    ) {
      reasons.push(
        "SECURITY_VALIDATION_FAILED"
      );
    }

    if (
      policy.requireIntegrityValidation &&
      !evidence.integrityValidated
    ) {
      reasons.push(
        "INTEGRITY_VALIDATION_FAILED"
      );
    }

    if (
      policy.requireDocumentation &&
      !evidence.documentationStored
    ) {
      reasons.push(
        "DOCUMENTATION_NOT_STORED"
      );
    }

    if (
      policy.requireAuditEvidence &&
      !evidence.auditEvidenceStored
    ) {
      reasons.push(
        "AUDIT_EVIDENCE_NOT_STORED"
      );
    }

    if (
      policy.rejectRecurrence &&
      evidence.recurrenceDetected
    ) {
      reasons.push(
        "INCIDENT_RECURRENCE_DETECTED"
      );
    }

    if (
      policy.rejectRegression &&
      evidence.regressionDetected
    ) {
      reasons.push("REGRESSION_DETECTED");
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

    return reasons;
  }

  private validateControls(
    controls: SovereignPreventiveControl[],
    policy: SovereignRecurrencePreventionPolicy
  ): string[] {
    const reasons: string[] = [];

    if (
      policy.requirePreventiveControls &&
      controls.length === 0
    ) {
      reasons.push(
        "PREVENTIVE_CONTROL_SET_EMPTY"
      );

      return reasons;
    }

    for (const control of controls) {
      if (!control.controlId) {
        reasons.push(
          "PREVENTIVE_CONTROL_ID_REQUIRED"
        );
      }

      if (!control.description) {
        reasons.push(
          `PREVENTIVE_CONTROL_DESCRIPTION_REQUIRED:${control.controlId}`
        );
      }

      if (
        control.mandatory &&
        !control.enabled
      ) {
        reasons.push(
          `MANDATORY_CONTROL_DISABLED:${control.controlId}`
        );
      }

      if (
        policy.requirePreventiveControlTesting &&
        control.mandatory &&
        !control.tested
      ) {
        reasons.push(
          `MANDATORY_CONTROL_NOT_TESTED:${control.controlId}`
        );
      }

      if (
        control.mandatory &&
        !control.effective
      ) {
        reasons.push(
          `MANDATORY_CONTROL_INEFFECTIVE:${control.controlId}`
        );
      }
    }

    return reasons;
  }

  private hasHardBlock(
    reasons: string[]
  ): boolean {
    return reasons.some(
      (reason) =>
        reason ===
          "SECURITY_VALIDATION_FAILED" ||
        reason ===
          "INTEGRITY_VALIDATION_FAILED" ||
        reason ===
          "INCIDENT_RECURRENCE_DETECTED" ||
        reason ===
          "REGRESSION_DETECTED" ||
        reason ===
          "UNRESOLVED_CRITICAL_RISK" ||
        reason ===
          "UNRESOLVED_SECURITY_RISK" ||
        reason ===
          "UNRESOLVED_INTEGRITY_RISK" ||
        reason.startsWith(
          "MANDATORY_CONTROL_DISABLED:"
        ) ||
        reason.startsWith(
          "MANDATORY_CONTROL_INEFFECTIVE:"
        )
    );
  }

  public getRecord(
    preventionId: string
  ):
    | SovereignRecurrencePreventionRecord
    | undefined {
    const record =
      this.records.get(preventionId);

    return record
      ? this.cloneRecord(record)
      : undefined;
  }

  public getActiveProtections():
    SovereignRecurrencePreventionRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state === "ACTIVE"
      )
      .map(
        (record) =>
          this.cloneRecord(record)
      );
  }

  public getDegradedProtections():
    SovereignRecurrencePreventionRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state === "DEGRADED" ||
          record.state === "BLOCKED"
      )
      .map(
        (record) =>
          this.cloneRecord(record)
      );
  }

  private cloneRecord(
    record: SovereignRecurrencePreventionRecord
  ): SovereignRecurrencePreventionRecord {
    return {
      ...record,

      correctiveActionIds: [
        ...record.correctiveActionIds
      ],

      verificationIds: [
        ...record.verificationIds
      ],

      controls: record.controls.map(
        (control) => ({ ...control })
      ),

      reasons: [...record.reasons]
    };
  }

  private result(
    record: SovereignRecurrencePreventionRecord,
    now: number
  ): SovereignRecurrencePreventionResult {
    const effectiveControls =
      record.controls.filter(
        (control) =>
          control.enabled &&
          control.tested &&
          control.effective
      ).length;

    return {
      preventionId: record.preventionId,
      incidentId: record.incidentId,

      target: record.target,

      accepted:
        record.state === "READY" ||
        record.state === "ACTIVE",

      state: record.state,
      decision: record.decision,

      totalControls: record.controls.length,
      effectiveControls,

      reasons: [...record.reasons],

      timestamp: now,

      authority: "NONE"
    };
  }

  private failure(
    preventionId: string,
    incidentId: string,
    target: string,
    reason: string
  ): SovereignRecurrencePreventionResult {
    return {
      preventionId,
      incidentId,
      target,

      accepted: false,

      state: "BLOCKED",
      decision: "BLOCK",

      totalControls: 0,
      effectiveControls: 0,

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
      this.controllerCanIgnoreRecurrence === false &&
      this.controllerCanIgnoreRegression ===
