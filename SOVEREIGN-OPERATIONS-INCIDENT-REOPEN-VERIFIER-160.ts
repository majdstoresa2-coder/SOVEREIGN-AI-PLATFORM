// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-INCIDENT-REOPEN-VERIFIER-160.ts
// Sequence: 160
// Purpose: Sovereign Incident Reopen Verification, Recurrence Validation,
//          Evidence Preservation & Independent Reopen Assurance
// ============================================================================

export const SOVEREIGN_OPERATIONS_INCIDENT_REOPEN_VERIFIER_ID =
  "SOVEREIGN-OPERATIONS-INCIDENT-REOPEN-VERIFIER-160";

export const SOVEREIGN_OPERATIONS_INCIDENT_REOPEN_VERIFIER_VERSION =
  "1.0.0";

export type SovereignIncidentReopenVerificationState =
  | "REGISTERED"
  | "VERIFYING"
  | "PASSED"
  | "FAILED"
  | "REJECTED"
  | "BLOCKED";

export type SovereignIncidentReopenVerificationDecision =
  | "VERIFY"
  | "PASS"
  | "FAIL"
  | "REJECT"
  | "BLOCK";

export interface SovereignIncidentReopenVerificationAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignIncidentReopenVerificationEvidence {
  originalIncidentExists: boolean;
  originalClosureExists: boolean;

  recurrenceConfirmed: boolean;
  recurrenceMonitorVerified: boolean;
  recurrenceResponseVerified: boolean;

  sameRootCauseConfirmed: boolean;
  sameFailurePatternConfirmed: boolean;

  originalEvidencePreserved: boolean;
  previousAuditTrailPreserved: boolean;

  previousCorrectiveActionsPreserved: boolean;
  previousPreventiveControlsPreserved: boolean;

  securityContextPreserved: boolean;
  integrityContextPreserved: boolean;

  reopenReasonDocumented: boolean;
  reopenTimestampRecorded: boolean;

  duplicateReopenDetected: boolean;
  evidenceTamperingDetected: boolean;
  auditGapDetected: boolean;
}

export interface SovereignIncidentReopenVerificationPolicy {
  requireOriginalIncident: boolean;
  requireOriginalClosure: boolean;

  requireConfirmedRecurrence: boolean;
  requireMonitorVerification: boolean;
  requireResponseVerification: boolean;

  requireRootCauseMatch: boolean;
  requireFailurePatternMatch: boolean;

  requireOriginalEvidencePreservation: boolean;
  requireAuditPreservation: boolean;

  requireCorrectiveActionPreservation: boolean;
  requirePreventiveControlPreservation: boolean;

  requireSecurityContext: boolean;
  requireIntegrityContext: boolean;

  requireReasonDocumentation: boolean;
  requireTimestamp: boolean;

  rejectDuplicateReopen: boolean;
  rejectEvidenceTampering: boolean;
  rejectAuditGap: boolean;
}

export interface SovereignIncidentReopenVerificationRequest {
  verificationId: string;

  reopenId: string;
  incidentId: string;

  target: string;

  reopenedBy: string;
  verifierId: string;

  authorityContext:
    SovereignIncidentReopenVerificationAuthorityContext;

  evidence:
    SovereignIncidentReopenVerificationEvidence;

  policy:
    SovereignIncidentReopenVerificationPolicy;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignIncidentReopenVerificationRecord {
  verificationId: string;

  reopenId: string;
  incidentId: string;

  target: string;

  reopenedBy: string;
  verifierId: string;

  state:
    SovereignIncidentReopenVerificationState;

  decision:
    SovereignIncidentReopenVerificationDecision;

  createdAt: number;
  evaluatedAt: number;
  completedAt?: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignIncidentReopenVerificationResult {
  verificationId: string;

  reopenId: string;
  incidentId: string;

  target: string;

  accepted: boolean;

  state:
    SovereignIncidentReopenVerificationState;

  decision:
    SovereignIncidentReopenVerificationDecision;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsIncidentReopenVerifier {
  public readonly id =
    SOVEREIGN_OPERATIONS_INCIDENT_REOPEN_VERIFIER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_INCIDENT_REOPEN_VERIFIER_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly verifierCanCreateAuthority = false;
  public readonly verifierCanEscalateAuthority = false;
  public readonly verifierCanOverrideOwner = false;

  public readonly verifierCanBypassSecurity = false;
  public readonly verifierCanIgnoreIntegrityFailure = false;

  public readonly verifierCanSelfVerify = false;

  public readonly verifierCanIgnoreDuplicateReopen = false;
  public readonly verifierCanIgnoreEvidenceTampering = false;
  public readonly verifierCanIgnoreAuditGap = false;

  public readonly verifierCanRewriteIncidentHistory = false;
  public readonly verifierCanDeleteEvidence = false;
  public readonly verifierCanDisableAudit = false;

  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<
      string,
      SovereignIncidentReopenVerificationRecord
    >();

  public verify(
    request: SovereignIncidentReopenVerificationRequest,
    now = Date.now()
  ): SovereignIncidentReopenVerificationResult {
    if (
      this.records.has(request.verificationId)
    ) {
      return this.failure(
        request.verificationId,
        request.reopenId,
        request.incidentId,
        request.target,
        "REOPEN_VERIFICATION_ALREADY_EXISTS"
      );
    }

    const requestFailures =
      this.validateRequest(request);

    if (requestFailures.length > 0) {
      return {
        verificationId:
          request.verificationId,

        reopenId:
          request.reopenId,

        incidentId:
          request.incidentId,

        target:
          request.target,

        accepted: false,

        state: "BLOCKED",
        decision: "BLOCK",

        reasons:
          requestFailures,

        timestamp: now,

        authority: "NONE"
      };
    }

    const evidenceFailures =
      this.validateEvidence(
        request.evidence,
        request.policy
      );

    let state:
      SovereignIncidentReopenVerificationState;

    let decision:
      SovereignIncidentReopenVerificationDecision;

    if (evidenceFailures.length === 0) {
      state = "PASSED";
      decision = "PASS";
    } else if (
      this.hasHardBlock(evidenceFailures)
    ) {
      state = "BLOCKED";
      decision = "BLOCK";
    } else {
      state = "FAILED";
      decision = "FAIL";
    }

    const record:
      SovereignIncidentReopenVerificationRecord = {
        verificationId:
          request.verificationId,

        reopenId:
          request.reopenId,

        incidentId:
          request.incidentId,

        target:
          request.target,

        reopenedBy:
          request.reopenedBy,

        verifierId:
          request.verifierId,

        state,
        decision,

        createdAt:
          request.createdAt,

        evaluatedAt:
          now,

        completedAt:
          state === "PASSED" ||
          state === "FAILED"
            ? now
            : undefined,

        reasons:
          evidenceFailures.length === 0
            ? [
                "INCIDENT_REOPEN_VERIFIED",
                "RECURRENCE_LINK_VERIFIED",
                "PRIOR_EVIDENCE_PRESERVATION_VERIFIED"
              ]
            : [
                ...evidenceFailures
              ],

        authority: "NONE"
      };

    this.records.set(
      request.verificationId,
      record
    );

    return this.result(
      record,
      now
    );
  }

  private validateRequest(
    request:
      SovereignIncidentReopenVerificationRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.verificationId) {
      reasons.push(
        "VERIFICATION_ID_REQUIRED"
      );
    }

    if (!request.reopenId) {
      reasons.push(
        "REOPEN_ID_REQUIRED"
      );
    }

    if (!request.incidentId) {
      reasons.push(
        "INCIDENT_ID_REQUIRED"
      );
    }

    if (!request.target) {
      reasons.push(
        "TARGET_REQUIRED"
      );
    }

    if (!request.reopenedBy) {
      reasons.push(
        "REOPENED_BY_REQUIRED"
      );
    }

    if (!request.verifierId) {
      reasons.push(
        "VERIFIER_ID_REQUIRED"
      );
    }

    if (
      request.reopenedBy &&
      request.verifierId &&
      request.reopenedBy ===
        request.verifierId
    ) {
      reasons.push(
        "SELF_VERIFICATION_PROHIBITED"
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
      request.authorityContext
        .ownerAuthority !== "SUPREME"
    ) {
      reasons.push(
        "OWNER_MUST_REMAIN_SUPREME"
      );
    }

    if (
      request.authorityContext
        .stewardAuthority !== "DELEGATED"
    ) {
      reasons.push(
        "STEWARD_MUST_REMAIN_DELEGATED"
      );
    }

    return reasons;
  }

  private validateEvidence(
    evidence:
      SovereignIncidentReopenVerificationEvidence,

    policy:
      SovereignIncidentReopenVerificationPolicy
  ): string[] {
    const reasons: string[] = [];

    if (
      policy.requireOriginalIncident &&
      !evidence.originalIncidentExists
    ) {
      reasons.push(
        "ORIGINAL_INCIDENT_NOT_FOUND"
      );
    }

    if (
      policy.requireOriginalClosure &&
      !evidence.originalClosureExists
    ) {
      reasons.push(
        "ORIGINAL_CLOSURE_NOT_FOUND"
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
      policy.requireMonitorVerification &&
      !evidence.recurrenceMonitorVerified
    ) {
      reasons.push(
        "RECURRENCE_MONITOR_NOT_VERIFIED"
      );
    }

    if (
      policy.requireResponseVerification &&
      !evidence.recurrenceResponseVerified
    ) {
      reasons.push(
        "RECURRENCE_RESPONSE_NOT_VERIFIED"
      );
    }

    if (
      policy.requireRootCauseMatch &&
      !evidence.sameRootCauseConfirmed
    ) {
      reasons.push(
        "ROOT_CAUSE_MATCH_NOT_CONFIRMED"
      );
    }

    if (
      policy.requireFailurePatternMatch &&
      !evidence.sameFailurePatternConfirmed
    ) {
      reasons.push(
        "FAILURE_PATTERN_MATCH_NOT_CONFIRMED"
      );
    }

    if (
      policy.requireOriginalEvidencePreservation &&
      !evidence.originalEvidencePreserved
    ) {
      reasons.push(
        "ORIGINAL_EVIDENCE_NOT_PRESERVED"
      );
    }

    if (
      policy.requireAuditPreservation &&
      !evidence.previousAuditTrailPreserved
    ) {
      reasons.push(
        "PREVIOUS_AUDIT_TRAIL_NOT_PRESERVED"
      );
    }

    if (
      policy.requireCorrectiveActionPreservation &&
      !evidence.previousCorrectiveActionsPreserved
    ) {
      reasons.push(
        "PREVIOUS_CORRECTIVE_ACTIONS_NOT_PRESERVED"
      );
    }

    if (
      policy.requirePreventiveControlPreservation &&
      !evidence.previousPreventiveControlsPreserved
    ) {
      reasons.push(
        "PREVIOUS_PREVENTIVE_CONTROLS_NOT_PRESERVED"
      );
    }

    if (
      policy.requireSecurityContext &&
      !evidence.securityContextPreserved
    ) {
      reasons.push(
        "SECURITY_CONTEXT_NOT_PRESERVED"
      );
    }

    if (
      policy.requireIntegrityContext &&
      !evidence.integrityContextPreserved
    ) {
      reasons.push(
        "INTEGRITY_CONTEXT_NOT_PRESERVED"
      );
    }

    if (
      policy.requireReasonDocumentation &&
      !evidence.reopenReasonDocumented
    ) {
      reasons.push(
        "REOPEN_REASON_NOT_DOCUMENTED"
      );
    }

    if (
      policy.requireTimestamp &&
      !evidence.reopenTimestampRecorded
    ) {
      reasons.push(
        "REOPEN_TIMESTAMP_NOT_RECORDED"
      );
    }

    if (
      policy.rejectDuplicateReopen &&
      evidence.duplicateReopenDetected
    ) {
      reasons.push(
        "DUPLICATE_REOPEN_DETECTED"
      );
    }

    if (
      policy.rejectEvidenceTampering &&
      evidence.evidenceTamperingDetected
    ) {
      reasons.push(
        "EVIDENCE_TAMPERING_DETECTED"
      );
    }

    if (
      policy.rejectAuditGap &&
      evidence.auditGapDetected
    ) {
      reasons.push(
        "AUDIT_GAP_DETECTED"
      );
    }

    return reasons;
  }

  private hasHardBlock(
    reasons: string[]
  ): boolean {
    const hardBlocks =
      new Set<string>([
        "ORIGINAL_INCIDENT_NOT_FOUND",
        "RECURRENCE_NOT_CONFIRMED",
        "ORIGINAL_EVIDENCE_NOT_PRESERVED",
        "PREVIOUS_AUDIT_TRAIL_NOT_PRESERVED",
        "SECURITY_CONTEXT_NOT_PRESERVED",
        "INTEGRITY_CONTEXT_NOT_PRESERVED",
        "DUPLICATE_REOPEN_DETECTED",
        "EVIDENCE_TAMPERING_DETECTED",
        "AUDIT_GAP_DETECTED"
      ]);

    return reasons.some(
      (reason) =>
        hardBlocks.has(reason)
    );
  }

  public reject(
    verificationId: string,
    reason: string,
    now = Date.now()
  ): SovereignIncidentReopenVerificationResult {
    const record =
      this.records.get(verificationId);

    if (!record) {
      return this.failure(
        verificationId,
        "",
        "",
        "",
        "REOPEN_VERIFICATION_NOT_FOUND"
      );
    }

    if (
      record.state === "PASSED"
    ) {
      return this.failure(
        record.verificationId,
        record.reopenId,
        record.incidentId,
        record.target,
        "REOPEN_VERIFICATION_ALREADY_PASSED"
      );
    }

    record.state =
      "REJECTED";

    record.decision =
      "REJECT";

    record.evaluatedAt =
      now;

    record.reasons = [
      reason ||
        "INCIDENT_REOPEN_VERIFICATION_REJECTED"
    ];

    this.records.set(
      verificationId,
      record
    );

    return this.result(
      record,
      now
    );
  }

  public getRecord(
    verificationId: string
  ):
    | SovereignIncidentReopenVerificationRecord
    | undefined {
    const record =
      this.records.get(
        verificationId
      );

    return record
      ? {
          ...record,
          reasons: [
            ...record.reasons
          ]
        }
      : undefined;
  }

  public getPassedVerifications():
    SovereignIncidentReopenVerificationRecord[] {
    return [
      ...this.records.values()
    ]
      .filter(
        (record) =>
          record.state === "PASSED"
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

  public getFailedVerifications():
    SovereignIncidentReopenVerificationRecord[] {
    return [
      ...this.records.values()
    ]
      .filter(
        (record) =>
          record.state === "FAILED" ||
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

  private result(
    record:
      SovereignIncidentReopenVerificationRecord,
    now: number
  ): SovereignIncidentReopenVerificationResult {
    return {
      verificationId:
        record.verificationId,

      reopenId:
        record.reopenId,

      incidentId:
        record.incidentId,

      target:
        record.target,

      accepted:
        record.decision === "PASS",

      state:
        record.state,

      decision:
        record.decision,

      reasons: [
        ...record.reasons
      ],

      timestamp:
        now,

      authority:
        "NONE"
    };
  }

  private failure(
    verificationId: string,
    reopenId: string,
    incidentId: string,
    target: string,
    reason: string
  ): SovereignIncidentReopenVerificationResult {
    return {
      verificationId,
      reopenId,
      incidentId,
      target,

      accepted:
        false,

      state:
        "BLOCKED",

      decision:
        "BLOCK",

      reasons: [
        reason
      ],

      timestamp:
        Date.now(),

      authority:
        "NONE"
    };
  }

  public assertSovereignty(): boolean {
    return (
      this.authority === "NONE" &&
      this.ownerAuthority === "SUPREME" &&
      this.stewardAuthority === "DELEGATED" &&
      this.verifierCanCreateAuthority === false &&
      this.verifierCanEscalateAuthority === false &&
      this.verifierCanOverrideOwner === false &&
      this.verifierCanBypassSecurity === false &&
      this.verifierCanIgnoreIntegrityFailure === false &&
      this.verifierCanSelfVerify === false &&
      this.verifierCanIgnoreDuplicateReopen === false &&
      this.verifierCanIgnoreEvidenceTampering === false &&
      this.verifierCanIgnoreAuditGap === false &&
      this.verifierCanRewriteIncidentHistory === false &&
      this.verifierCanDeleteEvidence === false &&
      this.verifierCanDisableAudit === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsIncidentReopenVerifier =
  new SovereignOperationsIncidentReopenVerifier();

export default sovereignOperationsIncidentReopenVerifier;
