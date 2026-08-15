// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-INCIDENT-REOPEN-VERIFIER-160.ts
// Sequence: 160
// Layer: OPERATIONS
// Purpose: Verify incident reopening before operational re-entry.
// ============================================================================

export const SOVEREIGN_OPERATIONS_INCIDENT_REOPEN_VERIFIER_ID =
  "SOVEREIGN-OPERATIONS-INCIDENT-REOPEN-VERIFIER-160";

export const SOVEREIGN_OPERATIONS_INCIDENT_REOPEN_VERIFIER_VERSION =
  "1.0.0";

export type IncidentReopenVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "BLOCKED";

export type IncidentReopenVerificationDecision =
  | "ALLOW_REOPEN"
  | "REJECT_REOPEN"
  | "BLOCK_REOPEN";

export interface IncidentReopenAuthority {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";
}

export interface IncidentReopenEvidence {
  incidentExists: boolean;
  incidentWasClosed: boolean;

  recurrenceConfirmed: boolean;

  recurrenceMonitorLinked: boolean;
  recurrenceResponseLinked: boolean;

  originalEvidencePreserved: boolean;
  auditTrailPreserved: boolean;

  correctiveActionsPreserved: boolean;
  preventiveControlsPreserved: boolean;

  securityValidated: boolean;
  integrityValidated: boolean;

  duplicateReopenDetected: boolean;
  evidenceTamperingDetected: boolean;
}

export interface IncidentReopenVerificationRequest {
  verificationId: string;

  reopenId: string;
  incidentId: string;

  target: string;

  reopenedBy: string;
  verifierId: string;

  authority: IncidentReopenAuthority;

  evidence: IncidentReopenEvidence;

  createdAt: number;
}

export interface IncidentReopenVerificationResult {
  verificationId: string;

  reopenId: string;
  incidentId: string;

  target: string;

  status: IncidentReopenVerificationStatus;
  decision: IncidentReopenVerificationDecision;

  verified: boolean;

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

  public readonly ownerAuthority = "SUPREME" as const;
  public readonly stewardAuthority = "DELEGATED" as const;

  // --------------------------------------------------------------------------
  // Sovereignty invariants
  // --------------------------------------------------------------------------

  public readonly canCreateAuthority = false;
  public readonly canEscalateAuthority = false;
  public readonly canOverrideOwner = false;

  public readonly canBypassSecurity = false;
  public readonly canBypassIntegrity = false;

  public readonly canDeleteEvidence = false;
  public readonly canRewriteHistory = false;
  public readonly canDisableAudit = false;

  public readonly canIgnoreTampering = false;
  public readonly canIgnoreDuplicateReopen = false;

  public readonly stewardCanOverrideOwner = false;

  private readonly verifications =
    new Map<string, IncidentReopenVerificationResult>();

  // --------------------------------------------------------------------------
  // Verify
  // --------------------------------------------------------------------------

  public verify(
    request: IncidentReopenVerificationRequest,
    now = Date.now()
  ): IncidentReopenVerificationResult {
    if (this.verifications.has(request.verificationId)) {
      return this.block(
        request,
        "VERIFICATION_ALREADY_EXISTS",
        now
      );
    }

    const requestErrors =
      this.validateRequest(request);

    if (requestErrors.length > 0) {
      return this.store({
        verificationId: request.verificationId,
        reopenId: request.reopenId,
        incidentId: request.incidentId,
        target: request.target,

        status: "BLOCKED",
        decision: "BLOCK_REOPEN",

        verified: false,

        reasons: requestErrors,

        timestamp: now,

        authority: "NONE"
      });
    }

    const evidenceErrors =
      this.validateEvidence(request.evidence);

    if (evidenceErrors.length > 0) {
      const hardBlock =
        this.containsHardFailure(evidenceErrors);

      return this.store({
        verificationId: request.verificationId,
        reopenId: request.reopenId,
        incidentId: request.incidentId,
        target: request.target,

        status: hardBlock
          ? "BLOCKED"
          : "REJECTED",

        decision: hardBlock
          ? "BLOCK_REOPEN"
          : "REJECT_REOPEN",

        verified: false,

        reasons: evidenceErrors,

        timestamp: now,

        authority: "NONE"
      });
    }

    return this.store({
      verificationId: request.verificationId,
      reopenId: request.reopenId,
      incidentId: request.incidentId,
      target: request.target,

      status: "VERIFIED",
      decision: "ALLOW_REOPEN",

      verified: true,

      reasons: [
        "INCIDENT_REOPEN_VERIFIED",
        "RECURRENCE_CONFIRMED",
        "EVIDENCE_PRESERVED",
        "AUDIT_TRAIL_PRESERVED",
        "SECURITY_VALIDATED",
        "INTEGRITY_VALIDATED"
      ],

      timestamp: now,

      authority: "NONE"
    });
  }

  // --------------------------------------------------------------------------
  // Request validation
  // --------------------------------------------------------------------------

  private validateRequest(
    request: IncidentReopenVerificationRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.verificationId) {
      reasons.push("VERIFICATION_ID_REQUIRED");
    }

    if (!request.reopenId) {
      reasons.push("REOPEN_ID_REQUIRED");
    }

    if (!request.incidentId) {
      reasons.push("INCIDENT_ID_REQUIRED");
    }

    if (!request.target) {
      reasons.push("TARGET_REQUIRED");
    }

    if (!request.reopenedBy) {
      reasons.push("REOPENED_BY_REQUIRED");
    }

    if (!request.verifierId) {
      reasons.push("VERIFIER_ID_REQUIRED");
    }

    if (
      request.reopenedBy &&
      request.verifierId &&
      request.reopenedBy === request.verifierId
    ) {
      reasons.push("SELF_VERIFICATION_PROHIBITED");
    }

    if (!request.authority.ownerId) {
      reasons.push("OWNER_ID_REQUIRED");
    }

    if (
      request.authority.ownerAuthority !== "SUPREME"
    ) {
      reasons.push("OWNER_AUTHORITY_INVALID");
    }

    if (
      request.authority.stewardAuthority !== "DELEGATED"
    ) {
      reasons.push("STEWARD_AUTHORITY_INVALID");
    }

    return reasons;
  }

  // --------------------------------------------------------------------------
  // Evidence validation
  // --------------------------------------------------------------------------

  private validateEvidence(
    evidence: IncidentReopenEvidence
  ): string[] {
    const reasons: string[] = [];

    if (!evidence.incidentExists) {
      reasons.push("INCIDENT_NOT_FOUND");
    }

    if (!evidence.incidentWasClosed) {
      reasons.push("INCIDENT_WAS_NOT_CLOSED");
    }

    if (!evidence.recurrenceConfirmed) {
      reasons.push("RECURRENCE_NOT_CONFIRMED");
    }

    if (!evidence.recurrenceMonitorLinked) {
      reasons.push("RECURRENCE_MONITOR_NOT_LINKED");
    }

    if (!evidence.recurrenceResponseLinked) {
      reasons.push("RECURRENCE_RESPONSE_NOT_LINKED");
    }

    if (!evidence.originalEvidencePreserved) {
      reasons.push("ORIGINAL_EVIDENCE_NOT_PRESERVED");
    }

    if (!evidence.auditTrailPreserved) {
      reasons.push("AUDIT_TRAIL_NOT_PRESERVED");
    }

    if (!evidence.correctiveActionsPreserved) {
      reasons.push("CORRECTIVE_ACTIONS_NOT_PRESERVED");
    }

    if (!evidence.preventiveControlsPreserved) {
      reasons.push("PREVENTIVE_CONTROLS_NOT_PRESERVED");
    }

    if (!evidence.securityValidated) {
      reasons.push("SECURITY_VALIDATION_FAILED");
    }

    if (!evidence.integrityValidated) {
      reasons.push("INTEGRITY_VALIDATION_FAILED");
    }

    if (evidence.duplicateReopenDetected) {
      reasons.push("DUPLICATE_REOPEN_DETECTED");
    }

    if (evidence.evidenceTamperingDetected) {
      reasons.push("EVIDENCE_TAMPERING_DETECTED");
    }

    return reasons;
  }

  // --------------------------------------------------------------------------
  // Hard failures
  // --------------------------------------------------------------------------

  private containsHardFailure(
    reasons: string[]
  ): boolean {
    const hardFailures = new Set<string>([
      "INCIDENT_NOT_FOUND",
      "RECURRENCE_NOT_CONFIRMED",
      "ORIGINAL_EVIDENCE_NOT_PRESERVED",
      "AUDIT_TRAIL_NOT_PRESERVED",
      "SECURITY_VALIDATION_FAILED",
      "INTEGRITY_VALIDATION_FAILED",
      "DUPLICATE_REOPEN_DETECTED",
      "EVIDENCE_TAMPERING_DETECTED"
    ]);

    return reasons.some((reason) =>
      hardFailures.has(reason)
    );
  }

  // --------------------------------------------------------------------------
  // Storage
  // --------------------------------------------------------------------------

  private store(
    result: IncidentReopenVerificationResult
  ): IncidentReopenVerificationResult {
    this.verifications.set(
      result.verificationId,
      {
        ...result,
        reasons: [...result.reasons]
      }
    );

    return {
      ...result,
      reasons: [...result.reasons]
    };
  }

  private block(
    request: IncidentReopenVerificationRequest,
    reason: string,
    now: number
  ): IncidentReopenVerificationResult {
    return {
      verificationId: request.verificationId,
      reopenId: request.reopenId,
      incidentId: request.incidentId,
      target: request.target,

      status: "BLOCKED",
      decision: "BLOCK_REOPEN",

      verified: false,

      reasons: [reason],

      timestamp: now,

      authority: "NONE"
    };
  }

  // --------------------------------------------------------------------------
  // Queries
  // --------------------------------------------------------------------------

  public getVerification(
    verificationId: string
  ): IncidentReopenVerificationResult | undefined {
    const result =
      this.verifications.get(verificationId);

    if (!result) {
      return undefined;
    }

    return {
      ...result,
      reasons: [...result.reasons]
    };
  }

  public isVerified(
    verificationId: string
  ): boolean {
    return (
      this.verifications.get(verificationId)
        ?.verified === true
    );
  }

  public getVerified():
    IncidentReopenVerificationResult[] {
    return [...this.verifications.values()]
      .filter((result) => result.verified)
      .map((result) => ({
        ...result,
        reasons: [...result.reasons]
      }));
  }

  public getBlocked():
    IncidentReopenVerificationResult[] {
    return [...this.verifications.values()]
      .filter(
        (result) =>
          result.status === "BLOCKED"
      )
      .map((result) => ({
        ...result,
        reasons: [...result.reasons]
      }));
  }

  // --------------------------------------------------------------------------
  // Sovereignty assertion
  // --------------------------------------------------------------------------

  public assertSovereignty(): boolean {
    return (
      this.authority === "NONE" &&
      this.ownerAuthority === "SUPREME" &&
      this.stewardAuthority === "DELEGATED" &&

      this.canCreateAuthority === false &&
      this.canEscalateAuthority === false &&
      this.canOverrideOwner === false &&

      this.canBypassSecurity === false &&
      this.canBypassIntegrity === false &&

      this.canDeleteEvidence === false &&
      this.canRewriteHistory === false &&
      this.canDisableAudit === false &&

      this.canIgnoreTampering === false &&
      this.canIgnoreDuplicateReopen === false &&

      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsIncidentReopenVerifier =
  new SovereignOperationsIncidentReopenVerifier();

export default sovereignOperationsIncidentReopenVerifier;
