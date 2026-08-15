// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-POST-INCIDENT-REVIEW-153.ts
// Sequence: 153
// Purpose: Sovereign Post-Incident Review, Root-Cause Validation,
//          Corrective Actions, Lessons Learned & Recurrence Prevention
// ============================================================================

export const SOVEREIGN_OPERATIONS_POST_INCIDENT_REVIEW_ID =
  "SOVEREIGN-OPERATIONS-POST-INCIDENT-REVIEW-153";

export const SOVEREIGN_OPERATIONS_POST_INCIDENT_REVIEW_VERSION =
  "1.0.0";

export type SovereignPostIncidentReviewState =
  | "REGISTERED"
  | "REVIEWING"
  | "INCOMPLETE"
  | "READY"
  | "APPROVED"
  | "REJECTED"
  | "BLOCKED";

export type SovereignPostIncidentReviewDecision =
  | "REVIEW"
  | "COMPLETE"
  | "REMEDIATE"
  | "APPROVE"
  | "REJECT"
  | "BLOCK";

export type SovereignPostIncidentReviewSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SovereignPostIncidentAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignPostIncidentFinding {
  findingId: string;

  category:
    | "ROOT_CAUSE"
    | "SECURITY"
    | "DATA"
    | "RUNTIME"
    | "PROCESS"
    | "DEPENDENCY"
    | "MONITORING"
    | "RECOVERY"
    | "GOVERNANCE"
    | "OTHER";

  severity: SovereignPostIncidentReviewSeverity;

  description: string;

  evidence: string[];

  resolved: boolean;
}

export interface SovereignCorrectiveAction {
  actionId: string;

  findingId?: string;

  description: string;

  owner: string;

  priority:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  status:
    | "OPEN"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "VERIFIED"
    | "REJECTED";

  preventsRecurrence: boolean;

  createdAt: number;
  completedAt?: number;
  verifiedAt?: number;
}

export interface SovereignPostIncidentReviewEvidence {
  incidentClosed: boolean;

  timelineComplete: boolean;
  impactAnalysisComplete: boolean;
  rootCauseIdentified: boolean;
  rootCauseVerified: boolean;

  recoveryReviewed: boolean;
  monitoringReviewed: boolean;
  securityReviewed: boolean;
  dataIntegrityReviewed: boolean;

  correctiveActionsDefined: boolean;
  criticalActionsCompleted: boolean;

  recurrenceControlsDefined: boolean;

  documentationStored: boolean;
  auditTrailComplete: boolean;

  unresolvedCriticalRisk: boolean;
  unresolvedSecurityRisk: boolean;
  unresolvedIntegrityRisk: boolean;
}

export interface SovereignPostIncidentReviewPolicy {
  requireIncidentClosure: boolean;

  requireTimeline: boolean;
  requireImpactAnalysis: boolean;

  requireRootCause: boolean;
  requireVerifiedRootCause: boolean;

  requireRecoveryReview: boolean;
  requireMonitoringReview: boolean;
  requireSecurityReview: boolean;
  requireDataIntegrityReview: boolean;

  requireCorrectiveActions: boolean;
  requireCriticalActionCompletion: boolean;

  requireRecurrenceControls: boolean;

  requireDocumentation: boolean;
  requireAuditTrail: boolean;

  rejectCriticalRisk: boolean;
  rejectSecurityRisk: boolean;
  rejectIntegrityRisk: boolean;
}

export interface SovereignPostIncidentReviewRequest {
  reviewId: string;

  incidentId: string;
  incidentClosureId: string;

  target: string;

  requestedBy: string;

  authorityContext: SovereignPostIncidentAuthorityContext;

  evidence: SovereignPostIncidentReviewEvidence;

  findings: SovereignPostIncidentFinding[];
  correctiveActions: SovereignCorrectiveAction[];

  policy: SovereignPostIncidentReviewPolicy;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignPostIncidentReviewRecord {
  reviewId: string;

  incidentId: string;
  incidentClosureId: string;

  target: string;

  state: SovereignPostIncidentReviewState;
  decision: SovereignPostIncidentReviewDecision;

  findings: SovereignPostIncidentFinding[];
  correctiveActions: SovereignCorrectiveAction[];

  createdAt: number;
  updatedAt: number;
  approvedAt?: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignPostIncidentReviewResult {
  reviewId: string;
  incidentId: string;

  target: string;

  accepted: boolean;

  state: SovereignPostIncidentReviewState;
  decision: SovereignPostIncidentReviewDecision;

  unresolvedFindings: number;
  openCorrectiveActions: number;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsPostIncidentReview {
  public readonly id =
    SOVEREIGN_OPERATIONS_POST_INCIDENT_REVIEW_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_POST_INCIDENT_REVIEW_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly reviewCanCreateAuthority = false;
  public readonly reviewCanEscalateAuthority = false;
  public readonly reviewCanOverrideOwner = false;

  public readonly reviewCanBypassSecurity = false;
  public readonly reviewCanIgnoreIntegrityRisk = false;
  public readonly reviewCanIgnoreCriticalRisk = false;

  public readonly reviewCanFalsifyRootCause = false;
  public readonly reviewCanHideFindings = false;
  public readonly reviewCanDeleteAuditEvidence = false;
  public readonly reviewCanDisableAudit = false;

  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignPostIncidentReviewRecord>();

  private validateRequest(
    request: SovereignPostIncidentReviewRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.reviewId) {
      reasons.push("REVIEW_ID_REQUIRED");
    }

    if (!request.incidentId) {
      reasons.push("INCIDENT_ID_REQUIRED");
    }

    if (!request.incidentClosureId) {
      reasons.push("INCIDENT_CLOSURE_ID_REQUIRED");
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
    evidence: SovereignPostIncidentReviewEvidence,
    policy: SovereignPostIncidentReviewPolicy
  ): string[] {
    const reasons: string[] = [];

    if (
      policy.requireIncidentClosure &&
      !evidence.incidentClosed
    ) {
      reasons.push("INCIDENT_NOT_CLOSED");
    }

    if (
      policy.requireTimeline &&
      !evidence.timelineComplete
    ) {
      reasons.push("TIMELINE_INCOMPLETE");
    }

    if (
      policy.requireImpactAnalysis &&
      !evidence.impactAnalysisComplete
    ) {
      reasons.push("IMPACT_ANALYSIS_INCOMPLETE");
    }

    if (
      policy.requireRootCause &&
      !evidence.rootCauseIdentified
    ) {
      reasons.push("ROOT_CAUSE_NOT_IDENTIFIED");
    }

    if (
      policy.requireVerifiedRootCause &&
      !evidence.rootCauseVerified
    ) {
      reasons.push("ROOT_CAUSE_NOT_VERIFIED");
    }

    if (
      policy.requireRecoveryReview &&
      !evidence.recoveryReviewed
    ) {
      reasons.push("RECOVERY_NOT_REVIEWED");
    }

    if (
      policy.requireMonitoringReview &&
      !evidence.monitoringReviewed
    ) {
      reasons.push("MONITORING_NOT_REVIEWED");
    }

    if (
      policy.requireSecurityReview &&
      !evidence.securityReviewed
    ) {
      reasons.push("SECURITY_NOT_REVIEWED");
    }

    if (
      policy.requireDataIntegrityReview &&
      !evidence.dataIntegrityReviewed
    ) {
      reasons.push("DATA_INTEGRITY_NOT_REVIEWED");
    }

    if (
      policy.requireCorrectiveActions &&
      !evidence.correctiveActionsDefined
    ) {
      reasons.push("CORRECTIVE_ACTIONS_NOT_DEFINED");
    }

    if (
      policy.requireCriticalActionCompletion &&
      !evidence.criticalActionsCompleted
    ) {
      reasons.push("CRITICAL_ACTIONS_INCOMPLETE");
    }

    if (
      policy.requireRecurrenceControls &&
      !evidence.recurrenceControlsDefined
    ) {
      reasons.push("RECURRENCE_CONTROLS_NOT_DEFINED");
    }

    if (
      policy.requireDocumentation &&
      !evidence.documentationStored
    ) {
      reasons.push("REVIEW_DOCUMENTATION_NOT_STORED");
    }

    if (
      policy.requireAuditTrail &&
      !evidence.auditTrailComplete
    ) {
      reasons.push("AUDIT_TRAIL_INCOMPLETE");
    }

    if (
      policy.rejectCriticalRisk &&
      evidence.unresolvedCriticalRisk
    ) {
      reasons.push("UNRESOLVED_CRITICAL_RISK");
    }

    if (
      policy.rejectSecurityRisk &&
      evidence.unresolvedSecurityRisk
    ) {
      reasons.push("UNRESOLVED_SECURITY_RISK");
    }

    if (
      policy.rejectIntegrityRisk &&
      evidence.unresolvedIntegrityRisk
    ) {
      reasons.push("UNRESOLVED_INTEGRITY_RISK");
    }

    return reasons;
  }

  private validateFindings(
    findings: SovereignPostIncidentFinding[]
  ): string[] {
    const reasons: string[] = [];

    for (const finding of findings) {
      if (!finding.findingId) {
        reasons.push("FINDING_ID_REQUIRED");
      }

      if (!finding.description) {
        reasons.push(
          `FINDING_DESCRIPTION_REQUIRED:${finding.findingId}`
        );
      }

      if (
        finding.severity === "CRITICAL" &&
        !finding.resolved
      ) {
        reasons.push(
          `UNRESOLVED_CRITICAL_FINDING:${finding.findingId}`
        );
      }
    }

    return reasons;
  }

  private validateActions(
    actions: SovereignCorrectiveAction[]
  ): string[] {
    const reasons: string[] = [];

    for (const action of actions) {
      if (!action.actionId) {
        reasons.push("ACTION_ID_REQUIRED");
      }

      if (!action.description) {
        reasons.push(
          `ACTION_DESCRIPTION_REQUIRED:${action.actionId}`
        );
      }

      if (!action.owner) {
        reasons.push(
          `ACTION_OWNER_REQUIRED:${action.actionId}`
        );
      }

      if (
        action.priority === "CRITICAL" &&
        action.status !== "COMPLETED" &&
        action.status !== "VERIFIED"
      ) {
        reasons.push(
          `CRITICAL_ACTION_NOT_COMPLETED:${action.actionId}`
        );
      }
    }

    return reasons;
  }

  private isHardBlock(
    reasons: string[]
  ): boolean {
    return reasons.some(
      (reason) =>
        reason === "INCIDENT_NOT_CLOSED" ||
        reason === "UNRESOLVED_CRITICAL_RISK" ||
        reason === "UNRESOLVED_SECURITY_RISK" ||
        reason === "UNRESOLVED_INTEGRITY_RISK" ||
        reason.startsWith(
          "UNRESOLVED_CRITICAL_FINDING:"
        )
    );
  }

  public evaluate(
    request: SovereignPostIncidentReviewRequest,
    now = Date.now()
  ): SovereignPostIncidentReviewResult {
    if (this.records.has(request.reviewId)) {
      return this.failure(
        request.reviewId,
        request.incidentId,
        request.target,
        "POST_INCIDENT_REVIEW_ALREADY_EXISTS"
      );
    }

    const reasons = [
      ...this.validateRequest(request),
      ...this.validateEvidence(
        request.evidence,
        request.policy
      ),
      ...this.validateFindings(
        request.findings
      ),
      ...this.validateActions(
        request.correctiveActions
      )
    ];

    let state: SovereignPostIncidentReviewState;
    let decision: SovereignPostIncidentReviewDecision;

    if (reasons.length === 0) {
      state = "READY";
      decision = "COMPLETE";
    } else if (this.isHardBlock(reasons)) {
      state = "BLOCKED";
      decision = "BLOCK";
    } else {
      state = "INCOMPLETE";
      decision = "REMEDIATE";
    }

    const record: SovereignPostIncidentReviewRecord = {
      reviewId: request.reviewId,

      incidentId: request.incidentId,
      incidentClosureId:
        request.incidentClosureId,

      target: request.target,

      state,
      decision,

      findings: request.findings.map(
        (finding) => ({
          ...finding,
          evidence: [...finding.evidence]
        })
      ),

      correctiveActions:
        request.correctiveActions.map(
          (action) => ({ ...action })
        ),

      createdAt: request.createdAt,
      updatedAt: now,

      reasons:
        reasons.length === 0
          ? ["POST_INCIDENT_REVIEW_READY"]
          : reasons,

      authority: "NONE"
    };

    this.records.set(
      request.reviewId,
      record
    );

    return this.result(record, now);
  }

  public approve(
    reviewId: string,
    now = Date.now()
  ): SovereignPostIncidentReviewResult {
    const record =
      this.records.get(reviewId);

    if (!record) {
      return this.failure(
        reviewId,
        "",
        "",
        "POST_INCIDENT_REVIEW_NOT_FOUND"
      );
    }

    if (
      record.state !== "READY" ||
      record.decision !== "COMPLETE"
    ) {
      return this.failure(
        record
