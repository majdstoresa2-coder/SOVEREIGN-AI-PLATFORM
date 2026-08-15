// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-CORRECTIVE-ACTION-VERIFIER-155.ts
// Sequence: 155
// Purpose: Independent Corrective Action Verification,
//          Evidence Validation, Recurrence Testing & Sovereign Assurance
// ============================================================================

export const SOVEREIGN_OPERATIONS_CORRECTIVE_ACTION_VERIFIER_ID =
  "SOVEREIGN-OPERATIONS-CORRECTIVE-ACTION-VERIFIER-155";

export const SOVEREIGN_OPERATIONS_CORRECTIVE_ACTION_VERIFIER_VERSION =
  "1.0.0";

export type SovereignCorrectiveVerificationState =
  | "REGISTERED"
  | "VERIFYING"
  | "PASSED"
  | "FAILED"
  | "REJECTED"
  | "BLOCKED";

export type SovereignCorrectiveVerificationDecision =
  | "VERIFY"
  | "PASS"
  | "FAIL"
  | "REJECT"
  | "BLOCK";

export interface SovereignCorrectiveVerificationAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignCorrectiveVerificationEvidence {
  implementationExists: boolean;
  implementationMatchesAction: boolean;

  rootCauseAddressed: boolean;
  rootCauseLinkVerified: boolean;

  functionalTestsPassed: boolean;
  regressionTestsPassed: boolean;

  securityTestsPassed: boolean;
  integrityTestsPassed: boolean;
  operationalTestsPassed: boolean;

  recurrenceControlExists: boolean;
  recurrenceControlEffective: boolean;

  monitoringCoveragePresent: boolean;
  auditEvidencePresent: boolean;

  unresolvedCriticalRisk: boolean;
  unresolvedSecurityRisk: boolean;
  unresolvedIntegrityRisk: boolean;

  regressionDetected: boolean;
  recurrenceDetected: boolean;
}

export interface SovereignCorrectiveVerificationPolicy {
  requireImplementation: boolean;
  requireActionMatch: boolean;

  requireRootCauseResolution: boolean;
  requireRootCauseLink: boolean;

  requireFunctionalTests: boolean;
  requireRegressionTests: boolean;

  requireSecurityTests: boolean;
  requireIntegrityTests: boolean;
  requireOperationalTests: boolean;

  requireRecurrenceControl: boolean;
  requireRecurrenceEffectiveness: boolean;

  requireMonitoringCoverage: boolean;
  requireAuditEvidence: boolean;

  rejectCriticalRisk: boolean;
  rejectSecurityRisk: boolean;
  rejectIntegrityRisk: boolean;

  rejectRegression: boolean;
  rejectRecurrence: boolean;
}

export interface SovereignCorrectiveVerificationRequest {
  verificationId: string;

  actionId: string;
  incidentId: string;
  reviewId: string;

  target: string;

  actionOwner: string;
  verifierId: string;

  authorityContext:
    SovereignCorrectiveVerificationAuthorityContext;

  evidence:
    SovereignCorrectiveVerificationEvidence;

  policy:
    SovereignCorrectiveVerificationPolicy;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignCorrectiveVerificationRecord {
  verificationId: string;

  actionId: string;
  incidentId: string;
  reviewId: string;

  target: string;

  actionOwner: string;
  verifierId: string;

  state: SovereignCorrectiveVerificationState;
  decision: SovereignCorrectiveVerificationDecision;

  createdAt: number;
  evaluatedAt: number;
  completedAt?: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignCorrectiveVerificationResult {
  verificationId: string;
  actionId: string;

  target: string;

  accepted: boolean;

  state: SovereignCorrectiveVerificationState;
  decision: SovereignCorrectiveVerificationDecision;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsCorrectiveActionVerifier {
  public readonly id =
    SOVEREIGN_OPERATIONS_CORRECTIVE_ACTION_VERIFIER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_CORRECTIVE_ACTION_VERIFIER_VERSION;

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
  public readonly verifierCanIgnoreCriticalRisk = false;

  public readonly verifierCanIgnoreRegression = false;
  public readonly verifierCanIgnoreRecurrence = false;

  public readonly verifierCanFalsifyEvidence = false;
  public readonly verifierCanDisableAudit = false;

  public readonly verifierCanSelfVerify = false;

  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<
      string,
      SovereignCorrectiveVerificationRecord
    >();

  public verify(
    request: SovereignCorrectiveVerificationRequest,
    now = Date.now()
  ): SovereignCorrectiveVerificationResult {
    if (
      this.records.has(request.verificationId)
    ) {
      return this.failure(
        request.verificationId,
        request.actionId,
        request.target,
        "VERIFICATION_ALREADY_EXISTS"
      );
    }

    const requestFailures =
      this.validateRequest(request);

    if (requestFailures.length > 0) {
      return {
        verificationId:
          request.verificationId,

        actionId: request.actionId,
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

    let state:
      SovereignCorrectiveVerificationState;

    let decision:
      SovereignCorrectiveVerificationDecision;

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
      SovereignCorrectiveVerificationRecord = {
        verificationId:
          request.verificationId,

        actionId: request.actionId,
        incidentId: request.incidentId,
        reviewId: request.reviewId,

        target: request.target,

        actionOwner: request.actionOwner,
        verifierId: request.verifierId,

        state,
        decision,

        createdAt: request.createdAt,
        evaluatedAt: now,

        completedAt:
          state === "PASSED" ||
          state === "FAILED"
            ? now
            : undefined,

        reasons:
          evidenceFailures.length === 0
            ? [
                "CORRECTIVE_ACTION_VERIFIED",
                "RECURRENCE_CONTROLS_VERIFIED"
              ]
            : [...evidenceFailures],

        authority: "NONE"
      };

    this.records.set(
      request.verificationId,
      record
    );

    return this.result(record, now);
  }

  private validateRequest(
    request: SovereignCorrectiveVerificationRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.verificationId) {
      reasons.push("VERIFICATION_ID_REQUIRED");
    }

    if (!request.actionId) {
      reasons.push("ACTION_ID_REQUIRED");
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

    if (!request.actionOwner) {
      reasons.push("ACTION_OWNER_REQUIRED");
    }

    if (!request.verifierId) {
      reasons.push("VERIFIER_ID_REQUIRED");
    }

    if (
      request.actionOwner &&
      request.verifierId &&
      request.actionOwner ===
        request.verifierId
    ) {
      reasons.push(
        "SELF_VERIFICATION_PROHIBITED"
      );
    }

    if (!request.authorityContext.ownerId) {
      reasons.push("OWNER_ID_REQUIRED");
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
      SovereignCorrectiveVerificationEvidence,

    policy:
      SovereignCorrectiveVerificationPolicy
  ): string[] {
    const reasons: string[] = [];

    if (
      policy.requireImplementation &&
      !evidence.implementationExists
    ) {
      reasons.push(
        "IMPLEMENTATION_NOT_FOUND"
      );
    }

    if (
      policy.requireActionMatch &&
      !evidence.implementationMatchesAction
    ) {
      reasons.push(
        "IMPLEMENTATION_DOES_NOT_MATCH_ACTION"
      );
    }

    if (
      policy.requireRootCauseResolution &&
      !evidence.rootCauseAddressed
    ) {
      reasons.push(
        "ROOT_CAUSE_NOT_ADDRESSED"
      );
    }

    if (
      policy.requireRootCauseLink &&
      !evidence.rootCauseLinkVerified
    ) {
      reasons.push(
        "ROOT_CAUSE_LINK_NOT_VERIFIED"
      );
    }

    if (
      policy.requireFunctionalTests &&
      !evidence.functionalTestsPassed
    ) {
      reasons.push(
        "FUNCTIONAL_TESTS_FAILED"
      );
    }

    if (
      policy.requireRegressionTests &&
      !evidence.regressionTestsPassed
    ) {
      reasons.push(
        "REGRESSION_TESTS_FAILED"
      );
    }

    if (
      policy.requireSecurityTests &&
      !evidence.securityTestsPassed
    ) {
      reasons.push(
        "SECURITY_TESTS_FAILED"
      );
    }

    if (
      policy.requireIntegrityTests &&
      !evidence.integrityTestsPassed
    ) {
      reasons.push(
        "INTEGRITY_TESTS_FAILED"
      );
    }

    if (
      policy.requireOperationalTests &&
      !evidence.operationalTestsPassed
    ) {
      reasons.push(
        "OPERATIONAL_TESTS_FAILED"
      );
    }

    if (
      policy.requireRecurrenceControl &&
      !evidence.recurrenceControlExists
    ) {
      reasons.push(
        "RECURRENCE_CONTROL_MISSING"
      );
    }

    if (
      policy.requireRecurrenceEffectiveness &&
      !evidence.recurrenceControlEffective
    ) {
      reasons.push(
        "RECURRENCE_CONTROL_INEFFECTIVE"
      );
    }

    if (
      policy.requireMonitoringCoverage &&
      !evidence.monitoringCoveragePresent
    ) {
      reasons.push(
        "MONITORING_COVERAGE_MISSING"
      );
    }

    if (
      policy.requireAuditEvidence &&
      !evidence.auditEvidencePresent
    ) {
      reasons.push(
        "AUDIT_EVIDENCE_MISSING"
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
     
