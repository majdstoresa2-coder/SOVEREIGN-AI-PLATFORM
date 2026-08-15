// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-RECOVERY-STABILITY-MONITOR-150.ts
// Sequence: 150
// Purpose: Post-Recovery Stability Monitoring, Regression Detection,
//          Health Observation & Safe Recovery Closure
// ============================================================================

export const SOVEREIGN_OPERATIONS_RECOVERY_STABILITY_MONITOR_ID =
  "SOVEREIGN-OPERATIONS-RECOVERY-STABILITY-MONITOR-150";

export const SOVEREIGN_OPERATIONS_RECOVERY_STABILITY_MONITOR_VERSION =
  "1.0.0";

export type SovereignRecoveryStabilityState =
  | "REGISTERED"
  | "MONITORING"
  | "STABLE"
  | "DEGRADED"
  | "UNSTABLE"
  | "RECOVERY_REQUIRED"
  | "ISOLATION_REQUIRED"
  | "BLOCKED";

export type SovereignRecoveryStabilityDecision =
  | "MONITOR"
  | "CONTINUE"
  | "DECLARE_STABLE"
  | "RECOVER"
  | "ISOLATE"
  | "BLOCK";

export type SovereignRecoveryStabilitySeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SovereignRecoveryStabilityAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignRecoveryStabilitySignals {
  targetReachable: boolean;

  processHealthy: boolean;
  runtimeHealthy: boolean;
  workersHealthy: boolean;

  databaseHealthy: boolean;
  storageHealthy: boolean;
  queueHealthy: boolean;
  networkHealthy: boolean;

  securityHealthy: boolean;
  dataIntegrityHealthy: boolean;

  stateConsistent: boolean;

  errorRateHealthy: boolean;
  latencyHealthy: boolean;
  throughputHealthy: boolean;

  cpuHealthy: boolean;
  memoryHealthy: boolean;
  capacityHealthy: boolean;

  synchronizationHealthy: boolean;

  regressionDetected: boolean;
  repeatedFailureDetected: boolean;
}

export interface SovereignRecoveryStabilityPolicy {
  observationWindowMs: number;

  minimumHealthyObservations: number;
  maximumUnhealthyObservations: number;

  requireSecurityHealth: boolean;
  requireDataIntegrity: boolean;
  requireStateConsistency: boolean;

  requirePerformanceHealth: boolean;
  requireResourceHealth: boolean;

  rejectRegression: boolean;
  rejectRepeatedFailure: boolean;

  isolateOnCriticalFailure: boolean;
  recoveryOnInstability: boolean;
}

export interface SovereignRecoveryStabilityRequest {
  monitorId: string;

  recoveryId: string;
  verificationId: string;
  reentryId: string;

  target: string;

  requestedBy: string;

  authorityContext: SovereignRecoveryStabilityAuthorityContext;

  policy: SovereignRecoveryStabilityPolicy;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignRecoveryStabilityObservation {
  observationId: string;

  timestamp: number;

  healthy: boolean;

  severity: SovereignRecoveryStabilitySeverity;

  reasons: string[];
}

export interface SovereignRecoveryStabilityRecord {
  monitorId: string;

  recoveryId: string;
  verificationId: string;
  reentryId: string;

  target: string;

  state: SovereignRecoveryStabilityState;

  observations: SovereignRecoveryStabilityObservation[];

  healthyObservations: number;
  unhealthyObservations: number;

  startedAt?: number;
  deadlineAt?: number;
  completedAt?: number;

  createdAt: number;
  updatedAt: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignRecoveryStabilityResult {
  monitorId: string;

  recoveryId: string;
  target: string;

  accepted: boolean;

  state: SovereignRecoveryStabilityState;

  decision: SovereignRecoveryStabilityDecision;

  healthyObservations: number;
  unhealthyObservations: number;

  remainingMs?: number;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsRecoveryStabilityMonitor {
  public readonly id =
    SOVEREIGN_OPERATIONS_RECOVERY_STABILITY_MONITOR_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_RECOVERY_STABILITY_MONITOR_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly monitorCanCreateAuthority = false;
  public readonly monitorCanEscalateAuthority = false;
  public readonly monitorCanOverrideOwner = false;
  public readonly monitorCanBypassSecurity = false;
  public readonly monitorCanIgnoreIntegrityFailure = false;
  public readonly monitorCanIgnoreRegression = false;
  public readonly monitorCanFalsifyStability = false;
  public readonly monitorCanDisableAudit = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignRecoveryStabilityRecord>();

  private readonly requests =
    new Map<string, SovereignRecoveryStabilityRequest>();

  private validate(
    request: SovereignRecoveryStabilityRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.monitorId) {
      reasons.push("MONITOR_ID_REQUIRED");
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

    if (
      !Number.isFinite(
        request.policy.observationWindowMs
      ) ||
      request.policy.observationWindowMs < 1
    ) {
      reasons.push(
        "INVALID_OBSERVATION_WINDOW"
      );
    }

    if (
      !Number.isInteger(
        request.policy.minimumHealthyObservations
      ) ||
      request.policy.minimumHealthyObservations < 1
    ) {
      reasons.push(
        "INVALID_MINIMUM_HEALTHY_OBSERVATIONS"
      );
    }

    if (
      !Number.isInteger(
        request.policy.maximumUnhealthyObservations
      ) ||
      request.policy.maximumUnhealthyObservations < 0
    ) {
      reasons.push(
        "INVALID_MAXIMUM_UNHEALTHY_OBSERVATIONS"
      );
    }

    return reasons;
  }

  public register(
    request: SovereignRecoveryStabilityRequest,
    now = Date.now()
  ): SovereignRecoveryStabilityResult {
    if (
      this.records.has(request.monitorId)
    ) {
      return this.failure(
        request.monitorId,
        request.recoveryId,
        request.target,
        "MONITOR_ALREADY_EXISTS"
      );
    }

    const reasons =
      this.validate(request);

    if (reasons.length > 0) {
      return {
        monitorId: request.monitorId,
        recoveryId: request.recoveryId,
        target: request.target,

        accepted: false,

        state: "BLOCKED",
        decision: "BLOCK",

        healthyObservations: 0,
        unhealthyObservations: 0,

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignRecoveryStabilityRecord = {
      monitorId:
        request.monitorId,

      recoveryId:
        request.recoveryId,

      verificationId:
        request.verificationId,

      reentryId:
        request.reentryId,

      target:
        request.target,

      state: "MONITORING",

      observations: [],

      healthyObservations: 0,
      unhealthyObservations: 0,

      startedAt: now,

      deadlineAt:
        now +
        request.policy.observationWindowMs,

      createdAt:
        request.createdAt,

      updatedAt: now,

      reasons: [
        "POST_RECOVERY_STABILITY_MONITORING_STARTED"
      ],

      authority: "NONE"
    };

    this.records.set(
      request.monitorId,
      record
    );

    this.requests.set(
      request.monitorId,
      this.cloneRequest(request)
    );

    return this.result(
      record,
      "MONITOR",
      now
    );
  }

  public observe(
    monitorId: string,
    observationId: string,
    signals: SovereignRecoveryStabilitySignals,
    now = Date.now()
  ): SovereignRecoveryStabilityResult {
    const record =
      this.records.get(monitorId);

    const request =
      this.requests.get(monitorId);

    if (!record || !request) {
      return this.failure(
        monitorId,
        "",
        "",
        "MONITOR_NOT_FOUND"
      );
    }

    if (
      record.state !== "MONITORING" &&
      record.state !== "DEGRADED"
    ) {
      return this.failure(
        record.monitorId,
        record.recoveryId,
        record.target,
        "MONITOR_NOT_ACTIVE"
      );
    }

    if (!observationId) {
      return this.failure(
        record.monitorId,
        record.recoveryId,
        record.target,
        "OBSERVATION_ID_REQUIRED"
      );
    }

    if (
      record.observations.some(
        (observation) =>
          observation.observationId ===
          observationId
      )
    ) {
      return this.failure(
        record.monitorId,
        record.recoveryId,
        record.target,
        "DUPLICATE_OBSERVATION_ID"
      );
    }

    const reasons =
      this.collectFailures(
        signals,
        request.policy
      );

    const severity =
      this.determineSeverity(
        signals,
        request.policy
      );

    const healthy =
      reasons.length === 0;

    record.observations.push({
      observationId,
      timestamp: now,
      healthy,
      severity,
      reasons: [...reasons]
    });

    if (healthy) {
      record.healthyObservations += 1;
    } else {
      record.unhealthyObservations += 1;
    }

    record.updatedAt = now;

    if (
      severity === "CRITICAL" &&
      request.policy.isolateOnCriticalFailure
    ) {
      record.state =
        "ISOLATION_REQUIRED";

      record.reasons = [
        ...reasons,
        "CRITICAL_INSTABILITY_DETECTED",
        "TARGET_ISOLATION_REQUIRED"
      ];

      this.records.set(
        monitorId,
        record
      );

      return this.result(
        record,
        "ISOLATE",
        now
      );
    }

    if (
      record.unhealthyObservations >
      request.policy.maximumUnhealthyObservations
    ) {
      if (
        request.policy.recoveryOnInstability
      ) {
        record.state =
          "RECOVERY_REQUIRED";

        record.reasons = [
          ...reasons,
          "POST_RECOVERY_INSTABILITY_THRESHOLD_EXCEEDED"
        ];

        this.records.set(
          monitorId,
          record
        );

        return this.result(
          record,
          "RECOVER",
          now
        );
      }

      record.state = "UNSTABLE";

      record.reasons = [
        ...reasons,
        "TARGET_DECLARED_UNSTABLE"
      ];

      this.records.set(
        monitorId,
        record
      );

      return this.result(
        record,
        "BLOCK",
        now
      );
    }

    if (!healthy) {
      record.state = "DEGRADED";

      record.reasons = [
        ...reasons,
        "STABILITY_DEGRADATION_DETECTED"
      ];
    } else {
      record.state = "MONITORING";

      record.reasons = [
        "HEALTHY_STABILITY_OBSERVATION"
      ];
    }

    this.records.set(
      monitorId,
      record
    );

    if (
      record.deadlineAt !== undefined &&
      now >= record.deadlineAt
    ) {
      return this.finalize(
        monitorId,
        now
      );
    }

    return this.result(
      record,
      "CONTINUE",
      now
    );
  }

  public finalize(
    monitorId: string,
    now = Date.now()
  ): SovereignRecoveryStabilityResult {
    const record =
      this.records.get(monitorId);

    const request =
      this.requests.get(monitorId);

    if (!record || !request) {
      return this.failure(
        monitorId,
        "",
        "",
        "MONITOR_NOT_FOUND"
      );
    }

    if (
      record.state ===
        "ISOLATION_REQUIRED" ||
      record.state ===
        "RECOVERY_REQUIRED" ||
      record.state === "BLOCKED"
    ) {
      return this.result(
        record,
        record.state ===
          "ISOLATION_REQUIRED"
          ? "ISOLATE"
          : "RECOVER",
        now
      );
    }

    if (
      record.healthyObservations <
      request.policy.minimumHealthyObservations
    ) {
      record.state = "UNSTABLE";

      record.updatedAt = now;

      record.reasons = [
        "INSUFFICIENT_HEALTHY_OBSERVATIONS"
      ];

      this.records.set(
        monitorId,
        record
      );

      if (
        request.policy.recoveryOnInstability
      ) {
        record.state =
          "RECOVERY_REQUIRED";

        return this.result(
          record,
          "RECOVER",
          now
        );
      }

      return this.result(
        record,
        "BLOCK",
        now
      );
    }

    if (
      record.unhealthyObservations >
      request.policy.maximumUnhealthyObservations
    ) {
      record.state =
        request.policy.recoveryOnInstability
          ? "RECOVERY_REQUIRED"
          : "UNSTABLE";

      record.updatedAt = now;

      record.reasons = [
        "UNHEALTHY_OBSERVATION_LIMIT_EXCEEDED"
      ];

      this.records.set(
        monitorId,
        record
      );

      return this.result(
        record,
        request.policy.recoveryOnInstability
          ? "RECOVER"
          : "BLOCK",
        now
      );
    }

    record.state = "STABLE";

    record.completedAt = now;
    record.updatedAt = now;

    record.reasons = [
      "POST_RECOVERY_STABILITY_CONFIRMED",
      "RECOVERY_SAFE_TO_CLOSE"
    ];

    this.records.set(
      monitorId,
      record
    );

    return this.result(
      record,
      "DECLARE_STABLE",
      now
    );
  }

  private collectFailures(
    signals: SovereignRecoveryStabilitySignals,
    policy: SovereignRecoveryStabilityPolicy
  ): string[] {
    const reasons: string[] = [];

    if (!signals.targetReachable) {
      reasons.push("TARGET_UNREACHABLE");
    }

    if (
      !signals.processHealthy ||
      !signals.runtimeHealthy ||
      !signals.workersHealthy
    ) {
      reasons.push(
        "EXECUTION_HEALTH_FAILED"
      );
    }

    if (
      !signals.databaseHealthy ||
      !signals.storageHealthy ||
      !signals.queueHealthy ||
      !signals.networkHealthy
    ) {
      reasons.push(
        "DEPENDENCY_HEALTH_FAILED"
      );
    }

    if (
      policy.requireSecurityHealth &&
      !signals.securityHealthy
    ) {
      reasons.push(
        "SECURITY_HEALTH_FAILED"
      );
    }

    if (
      policy.requireDataIntegrity &&
      !signals.dataIntegrityHealthy
    ) {
      reasons.push(
        "DATA_INTEGRITY_FAILED"
      );
    }

    if (
      policy.requireStateConsistency &&
      !signals.stateConsistent
    ) {
      reasons.push(
        "STATE_CONSISTENCY_FAILED"
      );
    }

    if (
      policy.requirePerformanceHealth &&
      (
        !signals.errorRateHealthy ||
        !signals.latencyHealthy ||
        !signals.throughputHealthy
      )
    ) {
      reasons.push(
        "PERFORMANCE_STABILITY_FAILED"
      );
    }

    if (
      policy.requireResourceHealth &&
      (
        !signals.cpuHealthy ||
        !signals.memoryHealthy ||
        !signals.capacityHealthy
      )
    ) {
      reasons.push(
        "RESOURCE_STABILITY_FAILED"
      );
    }

    if (!signals.synchronizationHealthy) {
      reasons.push(
        "SYNCHRONIZATION_UNHEALTHY"
      );
    }

    if (
      policy.rejectRegression &&
      signals.regressionDetected
    ) {
      reasons.push(
        "REGRESSION_DETECTED"
      );
    }

    if (
      policy.rejectRepeatedFailure &&
      signals.repeatedFailureDetected
    ) {
      reasons.push(
        "REPEATED_FAILURE_DETECTED"
      );
    }

    return reasons;
  }

  private determineSeverity(
    signals: SovereignRecoveryStabilitySignals,
    policy: SovereignRecoveryStabilityPolicy
  ): SovereignRecoveryStabilitySeverity {
    if (
      (
        policy.requireSecurityHealth &&
        !signals.securityHealthy
      ) ||
      (
        policy.requireDataIntegrity &&
        !signals.dataIntegrityHealthy
      )
    ) {
      return "CRITICAL";
    }

    if (
      !signals.targetReachable ||
      signals.regressionDetected ||
      signals.repeatedFailureDetected ||
      !signals.runtimeHealthy
    ) {
      return "HIGH";
    }

    if (
      !signals.stateConsistent ||
      !signals.databaseHealthy ||
      !signals.storageHealthy
    ) {
      return "MEDIUM";
    }

    return "LOW";
  }

  public getRecord(
    monitorId: string
  ): SovereignRecoveryStabilityRecord | undefined {
    const record =
      this.records.get(monitorId);

    return record
      ? this.cloneRecord(record)
      : undefined;
  }

  public getStableTargets():
    SovereignRecoveryStabilityRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state === "STABLE"
      )
      .map(
        (record) =>
          this.cloneRecord(record)
      );
  }

  public getRecoveryRequired():
    SovereignRecoveryStabilityRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state ===
          "RECOVERY_REQUIRED"
      )
      .map(
        (record) =>
          this.cloneRecord(record)
      );
  }

  public getIsolationRequired():
    SovereignRecoveryStabilityRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state ===
          "ISOLATION_REQUIRED"
      )
      .map(
        (record) =>
          this.cloneRecord(record)
      );
  }

  private cloneRecord(
    record: SovereignRecoveryStabilityRecord
  ): SovereignRecoveryStabilityRecord {
    return {
      ...record,

      observations:
        record.observations.map(
          (observation) => ({
            ...observation,

            reasons: [
              ...observation.reasons
            ]
          })
        ),

      reasons: [
        ...record.reasons
      ]
    };
  }

  private cloneRequest(
    request: SovereignRecoveryStabilityRequest
  ): SovereignRecoveryStabilityRequest {
    return {
      ...request,

      authorityContext: {
        ...request.authorityContext,

        delegationScope: [
          ...request.authorityContext
            .delegationScope
        ]
      },

      policy: {
        ...request.policy
      },

      metadata:
        request.metadata
          ? { ...request.metadata }
          : undefined
    };
  }

  private result(
    record: SovereignRecoveryStabilityRecord,
    decision: SovereignRecoveryStabilityDecision,
    now: number
  ): SovereignRecoveryStabilityResult {
    return {
      monitorId:
        record.monitorId,

      recoveryId:
        record.recoveryId,

      target:
        record.target,

      accepted:
        decision !== "BLOCK",

      state:
        record.state,

      decision,

      healthyObservations:
        record.healthyObserv
