// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-INCIDENT-REOPEN-LIFECYCLE-162.ts
// Sequence: 162
// Purpose: Sovereign Reopened-Incident Lifecycle Management,
//          Controlled Progression, Recovery Enforcement & Safe Reclosure
// ============================================================================

export const SOVEREIGN_OPERATIONS_INCIDENT_REOPEN_LIFECYCLE_ID =
  "SOVEREIGN-OPERATIONS-INCIDENT-REOPEN-LIFECYCLE-162";

export const SOVEREIGN_OPERATIONS_INCIDENT_REOPEN_LIFECYCLE_VERSION =
  "1.0.0";

export type SovereignReopenedIncidentLifecycleState =
  | "REOPENED"
  | "ACTIVE"
  | "CONTAINING"
  | "CONTAINED"
  | "RECOVERING"
  | "VERIFYING"
  | "STABLE"
  | "READY_FOR_RECLOSURE"
  | "BLOCKED";

export type SovereignReopenedIncidentLifecycleDecision =
  | "ACTIVATE"
  | "CONTAIN"
  | "RECOVER"
  | "VERIFY"
  | "DECLARE_STABLE"
  | "PREPARE_RECLOSURE"
  | "BLOCK";

export interface SovereignReopenedIncidentAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignReopenedIncidentLifecycleSignals {
  recurrenceConfirmed: boolean;

  containmentRequired: boolean;
  containmentCompleted: boolean;

  recoveryRequired: boolean;
  recoveryCompleted: boolean;

  verificationRequired: boolean;
  verificationPassed: boolean;

  serviceStable: boolean;

  securityHealthy: boolean;
  integrityHealthy: boolean;

  monitoringHealthy: boolean;

  criticalRiskOpen: boolean;
  isolationRequired: boolean;
  regressionDetected: boolean;

  correctiveActionsUpdated: boolean;
  preventionControlsUpdated: boolean;

  auditCurrent: boolean;
}

export interface SovereignReopenedIncidentLifecyclePolicy {
  requireConfirmedRecurrence: boolean;

  requireContainmentWhenNeeded: boolean;
  requireRecoveryWhenNeeded: boolean;
  requireVerificationWhenNeeded: boolean;

  requireServiceStability: boolean;

  requireSecurityHealth: boolean;
  requireIntegrityHealth: boolean;
  requireMonitoringHealth: boolean;

  requireCorrectiveActionUpdate: boolean;
  requirePreventionControlUpdate: boolean;

  requireAuditContinuity: boolean;

  rejectCriticalRisk: boolean;
  rejectIsolationRequirement: boolean;
  rejectRegression: boolean;
}

export interface SovereignReopenedIncidentLifecycleRequest {
  lifecycleId: string;

  incidentId: string;
  reopenId: string;
  verificationId: string;
  auditId: string;

  target: string;
  requestedBy: string;

  authorityContext:
    SovereignReopenedIncidentAuthorityContext;

  policy:
    SovereignReopenedIncidentLifecyclePolicy;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignReopenedIncidentLifecycleRecord {
  lifecycleId: string;

  incidentId: string;
  reopenId: string;
  verificationId: string;
  auditId: string;

  target: string;

  state: SovereignReopenedIncidentLifecycleState;
  decision: SovereignReopenedIncidentLifecycleDecision;

  createdAt: number;
  updatedAt: number;

  activatedAt?: number;
  containedAt?: number;
  recoveredAt?: number;
  verifiedAt?: number;
  stableAt?: number;
  readyForReclosureAt?: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignReopenedIncidentLifecycleResult {
  lifecycleId: string;
  incidentId: string;

  target: string;

  accepted: boolean;

  state: SovereignReopenedIncidentLifecycleState;
  decision: SovereignReopenedIncidentLifecycleDecision;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsIncidentReopenLifecycle {
  public readonly id =
    SOVEREIGN_OPERATIONS_INCIDENT_REOPEN_LIFECYCLE_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_INCIDENT_REOPEN_LIFECYCLE_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly lifecycleCanCreateAuthority = false;
  public readonly lifecycleCanEscalateAuthority = false;
  public readonly lifecycleCanOverrideOwner = false;

  public readonly lifecycleCanBypassSecurity = false;
  public readonly lifecycleCanIgnoreIntegrityFailure = false;

  public readonly lifecycleCanSkipContainment = false;
  public readonly lifecycleCanSkipRecovery = false;
  public readonly lifecycleCanSkipVerification = false;

  public readonly lifecycleCanIgnoreRegression = false;
  public readonly lifecycleCanCloseCriticalRisk = false;
  public readonly lifecycleCanDisableAudit = false;

  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<
      string,
      SovereignReopenedIncidentLifecycleRecord
    >();

  private readonly requests =
    new Map<
      string,
      SovereignReopenedIncidentLifecycleRequest
    >();

  public register(
    request: SovereignReopenedIncidentLifecycleRequest,
    now = Date.now()
  ): SovereignReopenedIncidentLifecycleResult {
    if (
      this.records.has(request.lifecycleId)
    ) {
      return this.failure(
        request.lifecycleId,
        request.incidentId,
        request.target,
        "LIFECYCLE_ALREADY_EXISTS"
      );
    }

    const reasons =
      this.validateRequest(request);

    if (reasons.length > 0) {
      return {
        lifecycleId: request.lifecycleId,
        incidentId: request.incidentId,
        target: request.target,

        accepted: false,

        state: "BLOCKED",
        decision: "BLOCK",

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record:
      SovereignReopenedIncidentLifecycleRecord = {
        lifecycleId:
          request.lifecycleId,

        incidentId:
          request.incidentId,

        reopenId:
          request.reopenId,

        verificationId:
          request.verificationId,

        auditId:
          request.auditId,

        target:
          request.target,

        state: "REOPENED",
        decision: "ACTIVATE",

        createdAt:
          request.createdAt,

        updatedAt:
          now,

        reasons: [
          "REOPENED_INCIDENT_LIFECYCLE_REGISTERED"
        ],

        authority: "NONE"
      };

    this.records.set(
      request.lifecycleId,
      record
    );

    this.requests.set(
      request.lifecycleId,
      this.cloneRequest(request)
    );

    return this.result(
      record,
      now
    );
  }

  public evaluate(
    lifecycleId: string,
    signals: SovereignReopenedIncidentLifecycleSignals,
    now = Date.now()
  ): SovereignReopenedIncidentLifecycleResult {
    const record =
      this.records.get(lifecycleId);

    const request =
      this.requests.get(lifecycleId);

    if (!record || !request) {
      return this.failure(
        lifecycleId,
        "",
        "",
        "LIFECYCLE_NOT_FOUND"
      );
    }

    const hardFailures =
      this.collectHardFailures(
        signals,
        request.policy
      );

    if (hardFailures.length > 0) {
      record.state = "BLOCKED";
      record.decision = "BLOCK";
      record.updatedAt = now;
      record.reasons = hardFailures;

      this.records.set(
        lifecycleId,
        record
      );

      return this.result(
        record,
        now
      );
    }

    if (
      request.policy.requireConfirmedRecurrence &&
      !signals.recurrenceConfirmed
    ) {
      return this.blockRecord(
        record,
        "RECURRENCE_NOT_CONFIRMED",
        now
      );
    }

    if (record.state === "REOPENED") {
      record.state = "ACTIVE";
      record.decision = "ACTIVATE";
      record.activatedAt = now;
      record.updatedAt = now;

      record.reasons = [
        "REOPENED_INCIDENT_ACTIVATED"
      ];

      this.records.set(
        lifecycleId,
        record
      );

      return this.result(
        record,
        now
      );
    }

    if (
      signals.containmentRequired &&
      !signals.containmentCompleted
    ) {
      record.state = "CONTAINING";
      record.decision = "CONTAIN";
      record.updatedAt = now;

      record.reasons = [
        "INCIDENT_CONTAINMENT_REQUIRED"
      ];

      this.records.set(
        lifecycleId,
        record
      );

      return this.result(
        record,
        now
      );
    }

    if (
      signals.containmentRequired &&
      signals.containmentCompleted &&
      (
        record.state === "ACTIVE" ||
        record.state === "CONTAINING"
      )
    ) {
      record.state = "CONTAINED";
      record.containedAt = now;
      record.updatedAt = now;

      record.reasons = [
        "INCIDENT_CONTAINMENT_COMPLETED"
      ];
    }

    if (
      signals.recoveryRequired &&
      !signals.recoveryCompleted
    ) {
      record.state = "RECOVERING";
      record.decision = "RECOVER";
      record.updatedAt = now;

      record.reasons = [
        "INCIDENT_RECOVERY_REQUIRED"
      ];

      this.records.set(
        lifecycleId,
        record
      );

      return this.result(
        record,
        now
      );
    }

    if (
      signals.recoveryRequired &&
      signals.recoveryCompleted
    ) {
      record.recoveredAt ??= now;
    }

    if (
      signals.verificationRequired &&
      !signals.verificationPassed
    ) {
      record.state = "VERIFYING";
      record.decision = "VERIFY";
      record.updatedAt = now;

      record.reasons = [
        "POST_RECURRENCE_VERIFICATION_REQUIRED"
      ];

      this.records.set(
        lifecycleId,
        record
      );

      return this.result(
        record,
        now
      );
    }

    if (
      signals.verificationRequired &&
      signals.verificationPassed
    ) {
      record.verifiedAt ??= now;
    }

    const readinessFailures =
      this.collectReadinessFailures(
        signals,
        request.policy
      );

    if (readinessFailures.length > 0) {
      record.state = "ACTIVE";
      record.decision = "ACTIVATE";
      record.updatedAt = now;
      record.reasons = readinessFailures;

      this.records.set(
        lifecycleId,
        record
      );

      return this.result(
        record,
        now
      );
    }

    if (signals.serviceStable) {
      record.state = "STABLE";
      record.decision = "DECLARE_STABLE";
      record.stableAt ??= now;
      record.updatedAt = now;

      record.reasons = [
        "REOPENED_INCIDENT_STABILITY_CONFIRMED"
      ];
    }

    if (
      record.state === "STABLE" &&
      signals.correctiveActionsUpdated &&
      signals.preventionControlsUpdated &&
      signals.auditCurrent
    ) {
      record.state =
        "READY_FOR_RECLOSURE";

      record.decision =
        "PREPARE_RECLOSURE";

      record.readyForReclosureAt =
        now;

      record.updatedAt =
        now;

      record.reasons = [
        "REOPENED_INCIDENT_READY_FOR_RECLOSURE"
      ];
    }

    this.records.set(
      lifecycleId,
      record
    );

    return this.result(
      record,
      now
    );
  }

  private validateRequest(
    request: SovereignReopenedIncidentLifecycleRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.lifecycleId) {
      reasons.push(
        "LIFECYCLE_ID_REQUIRED"
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

    if (!request.verificationId) {
      reasons.push(
        "VERIFICATION_ID_REQUIRED"
      );
    }

    if (!request.auditId) {
      reasons.push(
        "AUDIT_ID_REQUIRED"
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

  private collectHardFailures(
    signals: SovereignReopenedIncidentLifecycleSignals
