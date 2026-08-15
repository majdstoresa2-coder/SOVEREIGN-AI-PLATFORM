// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-INCIDENT-REOPEN-CONTROLLER-159.ts
// Sequence: 159
// Purpose: Sovereign Incident Reopening, Recurrence Linking,
//          Evidence Preservation & Controlled Response Reactivation
// ============================================================================

export const SOVEREIGN_OPERATIONS_INCIDENT_REOPEN_CONTROLLER_ID =
  "SOVEREIGN-OPERATIONS-INCIDENT-REOPEN-CONTROLLER-159";

export const SOVEREIGN_OPERATIONS_INCIDENT_REOPEN_CONTROLLER_VERSION =
  "1.0.0";

export type SovereignIncidentReopenState =
  | "REGISTERED"
  | "VALIDATING"
  | "READY"
  | "REOPENED"
  | "REJECTED"
  | "BLOCKED";

export type SovereignIncidentReopenDecision =
  | "VALIDATE"
  | "REOPEN"
  | "REJECT"
  | "BLOCK";

export interface SovereignIncidentReopenAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignIncidentReopenEvidence {
  originalIncidentClosed: boolean;
  recurrenceConfirmed: boolean;

  recurrenceMonitorLinked: boolean;
  recurrenceResponseLinked: boolean;

  sameRootCauseDetected: boolean;
  sameFailurePatternDetected: boolean;

  previousCorrectiveActionsPresent: boolean;
  previousPreventionControlsPresent: boolean;

  auditTrailAvailable: boolean;
  originalEvidenceAvailable: boolean;

  securityRiskDetected: boolean;
  integrityRiskDetected: boolean;
  criticalImpactDetected: boolean;
}

export interface SovereignIncidentReopenPolicy {
  requireOriginalClosure: boolean;
  requireConfirmedRecurrence: boolean;

  requireMonitorLink: boolean;
  requireResponseLink: boolean;

  requirePreviousCorrectiveActions: boolean;
  requirePreviousPreventionControls: boolean;

  requireAuditTrail: boolean;
  requireOriginalEvidence: boolean;

  reopenOnSecurityRisk: boolean;
  reopenOnIntegrityRisk: boolean;
  reopenOnCriticalImpact: boolean;
}

export interface SovereignIncidentReopenRequest {
  reopenId: string;

  incidentId: string;

  previousClosureId: string;
  recurrenceMonitorId: string;
  recurrenceResponseId: string;

  target: string;

  requestedBy: string;

  authorityContext:
    SovereignIncidentReopenAuthorityContext;

  evidence:
    SovereignIncidentReopenEvidence;

  policy:
    SovereignIncidentReopenPolicy;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignIncidentReopenRecord {
  reopenId: string;

  incidentId: string;

  previousClosureId: string;
  recurrenceMonitorId: string;
  recurrenceResponseId: string;

  target: string;

  state: SovereignIncidentReopenState;
  decision: SovereignIncidentReopenDecision;

  reopenedAt?: number;

  createdAt: number;
  updatedAt: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignIncidentReopenResult {
  reopenId: string;
  incidentId: string;

  target: string;

  accepted: boolean;

  state: SovereignIncidentReopenState;
  decision: SovereignIncidentReopenDecision;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsIncidentReopenController {
  public readonly id =
    SOVEREIGN_OPERATIONS_INCIDENT_REOPEN_CONTROLLER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_INCIDENT_REOPEN_CONTROLLER_VERSION;

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

  public readonly controllerCanErasePriorIncidentHistory = false;
  public readonly controllerCanErasePriorEvidence = false;
  public readonly controllerCanSuppressConfirmedRecurrence = false;

  public readonly controllerCanDisableAudit = false;

  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignIncidentReopenRecord>();

  public evaluate(
    request: SovereignIncidentReopenRequest,
    now = Date.now()
  ): SovereignIncidentReopenResult {
    if (
      this.records.has(request.reopenId)
    ) {
      return this.failure(
        request.reopenId,
        request.incidentId,
        request.target,
        "INCIDENT_REOPEN_ALREADY_EXISTS"
      );
    }

    const failures = [
      ...this.validateRequest(request),
      ...this.validateEvidence(
        request.evidence,
        request.policy
      )
    ];

    let state: SovereignIncidentReopenState;
    let decision: SovereignIncidentReopenDecision;

    if (failures.length === 0) {
      state = "READY";
      decision = "VALIDATE";
    } else if (this.hasHardBlock(failures)) {
      state = "BLOCKED";
      decision = "BLOCK";
    } else {
      state = "REJECTED";
      decision = "REJECT";
    }

    const record: SovereignIncidentReopenRecord = {
      reopenId: request.reopenId,

      incidentId: request.incidentId,

      previousClosureId:
        request.previousClosureId,

      recurrenceMonitorId:
        request.recurrenceMonitorId,

      recurrenceResponseId:
        request.recurrenceResponseId,

      target: request.target,

      state,
      decision,

      createdAt: request.createdAt,
      updatedAt: now,

      reasons:
        failures.length === 0
          ? ["INCIDENT_REOPEN_READY"]
          : failures,

      authority: "NONE"
    };

    this.records.set(
      request.reopenId,
      record
    );

    return this.result(record, now);
  }

  public reopen(
    reopenId: string,
    now = Date.now()
  ): SovereignIncidentReopenResult {
    const record =
      this.records.get(reopenId);

    if (!record) {
      return this.failure(
        reopenId,
        "",
        "",
        "INCIDENT_REOPEN_NOT_FOUND"
      );
    }

    if (
      record.state !== "READY" ||
      record.decision !== "VALIDATE"
    ) {
      return this.failure(
        record.reopenId,
        record.incidentId,
        record.target,
        "INCIDENT_NOT_READY_TO_REOPEN"
      );
    }

    record.state = "REOPENED";
    record.decision = "REOPEN";

    record.reopenedAt = now;
    record.updatedAt = now;

    record.reasons = [
      "INCIDENT_REOPENED",
      "RECURRENCE_LINK_PRESERVED",
      "PRIOR_EVIDENCE_PRESERVED"
    ];

    this.records.set(
      reopenId,
      record
    );

    return this.result(record, now);
  }

  public reject(
    reopenId: string,
    reason: string,
    now = Date.now()
  ): SovereignIncidentReopenResult {
    const record =
      this.records.get(reopenId);

    if (!record) {
      return this.failure(
        reopenId,
        "",
        "",
        "INCIDENT_REOPEN_NOT_FOUND"
      );
    }

    if (record.state === "REOPENED") {
      return this.failure(
        record.reopenId,
        record.incidentId,
        record.target,
        "INCIDENT_ALREADY_REOPENED"
      );
    }

    record.state = "REJECTED";
    record.decision = "REJECT";
    record.updatedAt = now;

    record.reasons = [
      reason || "INCIDENT_REOPEN_REJECTED"
    ];

    this.records.set(
      reopenId,
      record
    );

    return this.result(record, now);
  }

  private validateRequest(
    request: SovereignIncidentReopenRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.reopenId) {
      reasons.push("REOPEN_ID_REQUIRED");
    }

    if (!request.incidentId) {
      reasons.push("INCIDENT_ID_REQUIRED");
    }

    if (!request.previousClosureId) {
      reasons.push("PREVIOUS_CLOSURE_ID_REQUIRED");
    }

    if (!request.recurrenceMonitorId) {
      reasons.push("RECURRENCE_MONITOR_ID_REQUIRED");
    }

    if (!request.recurrenceResponseId) {
      reasons.push("RECURRENCE_RESPONSE_ID_REQUIRED");
    }

    if (!request.target) {
      reasons.push("TARGET_REQUIRED");
    }

    if (!request.requestedBy) {
      reasons.push("REQUESTER_REQUIRED");
    }

    if (!request.securityApproved) {
      reasons.push("SECURITY_APPROVAL_REQUIRED");
    }

    if (!request.policyApproved) {
      reasons.push("POLICY_APPROVAL_REQUIRED");
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
    evidence: SovereignIncidentReopenEvidence,
    policy: SovereignIncidentReopenPolicy
  ): string[] {
    const reasons: string[] = [];

    if (
      policy.requireOriginalClosure &&
      !evidence.originalIncidentClosed
    ) {
      reasons.push(
        "ORIGINAL_INCIDENT_NOT_CLOSED"
      );
    }

    if (
      policy.requireConfirmedRecurrence &&
      !evidence.recurrenceConfirmed
    ) {
      reasons.push(
        "RECURRENCE_NOT_CONFIRMED"
      );
    }

    if (
      policy.requireMonitorLink &&
      !evidence.recurrenceMonitorLinked
    ) {
      reasons.push(
        "RECURRENCE_MONITOR_NOT_LINKED"
      );
    }

    if (
      policy.requireResponseLink &&
      !evidence.recurrenceResponseLinked
    ) {
      reasons.push(
        "RECURRENCE_RESPONSE_NOT_LINKED"
      );
    }

    if (
      policy.requirePreviousCorrectiveActions &&
      !evidence.previousCorrectiveActionsPresent
    ) {
      reasons.push(
        "PREVIOUS_CORRECTIVE_ACTIONS_MISSING"
      );
    }

    if (
      policy.requirePreviousPreventionControls &&
      !evidence.previousPreventionControlsPresent
    ) {
      reasons.push(
        "PREVIOUS_PREVENTION_CONTROLS_MISSING"
      );
    }

    if (
      policy.requireAuditTrail &&
      !evidence.auditTrailAvailable
    ) {
      reasons.push(
        "AUDIT_TRAIL_NOT_AVAILABLE"
      );
    }

    if (
      policy.requireOriginalEvidence &&
      !evidence.originalEvidenceAvailable
    ) {
      reasons.push(
        "ORIGINAL_EVIDENCE_NOT_AVAILABLE"
      );
    }

    if (
      policy.reopenOnSecurityRisk &&
      evidence.securityRiskDetected
    ) {
      reasons.push(
        "SECURITY_RISK_REQUIRES_REOPEN"
      );
    }

    if (
      policy.reopenOnIntegrityRisk &&
      evidence.integrityRiskDetected
    ) {
      reasons.push(
        "INTEGRITY_RISK_REQUIRES_REOPEN"
      );
    }

    if (
      policy.reopenOnCriticalImpact &&
      evidence.criticalImpactDetected
    ) {
      reasons.push(
        "CRITICAL_IMPACT_REQUIRES_REOPEN"
      );
    }

    return reasons.filter(
      (reason) =>
        !reason.endsWith(
          "_REQUIRES_REOPEN"
        )
    );
  }

  private hasHardBlock(
    reasons: string[]
  ): boolean {
    const hardBlocks = new Set([
      "RECURRENCE_NOT_CONFIRMED",
      "RECURRENCE_MONITOR_NOT_LINKED",
      "RECURRENCE_RESPONSE_NOT_LINKED",
      "AUDIT_TRAIL_NOT_AVAILABLE",
      "ORIGINAL_EVIDENCE_NOT_AVAILABLE"
    ]);

    return reasons.some(
      (reason) => hardBlocks.has(reason)
    );
  }

  public getRecord(
    reopenId: string
  ): SovereignIncidentReopenRecord | undefined {
    const record =
      this.records.get(reopenId);

    return record
      ? {
          ...record,
          reasons: [...record.reasons]
        }
      : undefined;
  }

  public getReopenedIncidents():
    SovereignIncidentReopenRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state === "REOPENED"
      )
      .map((record) => ({
        ...record,
        reasons: [...record.reasons]
      }));
  }

  private result(
    record: SovereignIncidentReopenRecord,
    now: number
  ): SovereignIncidentReopenResult {
    return {
      reopenId: record.reopenId,
      incidentId: record.incidentId,
      target: record.target,

      accepted:
        record.decision === "VALIDATE" ||
        record.decision === "REOPEN",

      state: record.state,
      decision: record.decision,

      reasons: [...record.reasons],

      timestamp: now,

      authority: "NONE"
    };
  }

  private failure(
    reopenId: string,
    incidentId: string,
    target: string,
    reason: string
  ): SovereignIncidentReopenResult {
    return {
      reopenId,
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
      this.controllerCanIgnoreIntegrityRisk === false &&
      this.controllerCanErasePriorIncidentHistory === false &&
      this.controllerCanErasePriorEvidence === false &&
      this.controllerCanSuppressConfirmedRecurrence === false &&
      this.controllerCanDisableAudit === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsIncidentReopenController =
  new SovereignOperationsIncidentReopenController();

export default sovereignOperationsIncidentReopenController;
