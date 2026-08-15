// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-BACKPRESSURE-121.ts
// Sequence: 121
// Purpose: Sovereign Backpressure, Load Regulation & Overload Protection
// ============================================================================

export const SOVEREIGN_OPERATIONS_BACKPRESSURE_ID =
  "SOVEREIGN-OPERATIONS-BACKPRESSURE-121";

export const SOVEREIGN_OPERATIONS_BACKPRESSURE_VERSION =
  "1.0.0";

export type SovereignBackpressureState =
  | "NORMAL"
  | "ELEVATED"
  | "HIGH"
  | "CRITICAL"
  | "ISOLATED";

export type SovereignBackpressureDecision =
  | "ACCEPT"
  | "THROTTLE"
  | "DEFER"
  | "REJECT";

export interface SovereignBackpressureAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignBackpressurePolicy {
  maxActiveOperations: number;
  maxQueueDepth: number;

  elevatedThresholdPercent: number;
  highThresholdPercent: number;
  criticalThresholdPercent: number;

  throttleDelayMs: number;
}

export interface SovereignBackpressureMetrics {
  activeOperations: number;
  queueDepth: number;
  healthyWorkers: number;
  totalWorkers: number;

  averageLatencyMs?: number;
  errorRatePercent?: number;
}

export interface SovereignBackpressureRequest {
  controllerId: string;
  target: string;

  requestedBy: string;

  authorityContext: SovereignBackpressureAuthorityContext;

  policy: SovereignBackpressurePolicy;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;
}

export interface SovereignBackpressureRecord {
  controllerId: string;
  target: string;

  state: SovereignBackpressureState;

  lastLoadPercent: number;

  accepted: number;
  throttled: number;
  deferred: number;
  rejected: number;

  createdAt: number;
  updatedAt: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignBackpressureResult {
  controllerId: string;
  target: string;

  accepted: boolean;

  state: SovereignBackpressureState;
  decision: SovereignBackpressureDecision;

  loadPercent: number;

  retryAfterMs?: number;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsBackpressure {
  public readonly id =
    SOVEREIGN_OPERATIONS_BACKPRESSURE_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_BACKPRESSURE_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly backpressureCanCreateAuthority = false;
  public readonly backpressureCanEscalateAuthority = false;
  public readonly backpressureCanOverrideOwner = false;
  public readonly backpressureCanBypassSecurity = false;
  public readonly backpressureCanIgnoreCapacity = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignBackpressureRecord>();

  private readonly policies =
    new Map<string, SovereignBackpressurePolicy>();

  private validate(
    request: SovereignBackpressureRequest
  ): string[] {
    const reasons: string[] = [];
    const policy = request.policy;

    if (!request.controllerId) {
      reasons.push("CONTROLLER_ID_REQUIRED");
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
      !Number.isInteger(policy.maxActiveOperations) ||
      policy.maxActiveOperations < 1
    ) {
      reasons.push("INVALID_MAX_ACTIVE_OPERATIONS");
    }

    if (
      !Number.isInteger(policy.maxQueueDepth) ||
      policy.maxQueueDepth < 1
    ) {
      reasons.push("INVALID_MAX_QUEUE_DEPTH");
    }

    if (
      policy.elevatedThresholdPercent <= 0 ||
      policy.highThresholdPercent <=
        policy.elevatedThresholdPercent ||
      policy.criticalThresholdPercent <=
        policy.highThresholdPercent ||
      policy.criticalThresholdPercent > 100
    ) {
      reasons.push("INVALID_PRESSURE_THRESHOLDS");
    }

    if (policy.throttleDelayMs < 0) {
      reasons.push("INVALID_THROTTLE_DELAY");
    }

    return reasons;
  }

  public register(
    request: SovereignBackpressureRequest
  ): SovereignBackpressureResult {
    const now = Date.now();

    if (this.records.has(request.controllerId)) {
      return this.failure(
        request.controllerId,
        request.target,
        "BACKPRESSURE_CONTROLLER_ALREADY_EXISTS"
      );
    }

    const reasons = this.validate(request);

    if (reasons.length > 0) {
      return {
        controllerId: request.controllerId,
        target: request.target,

        accepted: false,

        state: "ISOLATED",
        decision: "REJECT",

        loadPercent: 100,

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignBackpressureRecord = {
      controllerId: request.controllerId,
      target: request.target,

      state: "NORMAL",

      lastLoadPercent: 0,

      accepted: 0,
      throttled: 0,
      deferred: 0,
      rejected: 0,

      createdAt: request.createdAt,
      updatedAt: now,

      reasons: [],

      authority: "NONE"
    };

    this.records.set(request.controllerId, record);
    this.policies.set(request.controllerId, {
      ...request.policy
    });

    return this.result(
      record,
      "ACCEPT",
      0
    );
  }

  private calculateLoad(
    metrics: SovereignBackpressureMetrics,
    policy: SovereignBackpressurePolicy
  ): number {
    const activeLoad =
      (metrics.activeOperations /
        policy.maxActiveOperations) *
      100;

    const queueLoad =
      (metrics.queueDepth /
        policy.maxQueueDepth) *
      100;

    const workerLoad =
      metrics.totalWorkers <= 0
        ? 100
        : (
            1 -
            metrics.healthyWorkers /
              metrics.totalWorkers
          ) * 100;

    const errorLoad =
      metrics.errorRatePercent ?? 0;

    return Math.max(
      0,
      Math.min(
        100,
        Math.max(
          activeLoad,
          queueLoad,
          workerLoad,
          errorLoad
        )
      )
    );
  }

  private stateForLoad(
    load: number,
    policy: SovereignBackpressurePolicy
  ): SovereignBackpressureState {
    if (
      load >=
      policy.criticalThresholdPercent
    ) {
      return "CRITICAL";
    }

    if (
      load >=
      policy.highThresholdPercent
    ) {
      return "HIGH";
    }

    if (
      load >=
      policy.elevatedThresholdPercent
    ) {
      return "ELEVATED";
    }

    return "NORMAL";
  }

  private decisionForState(
    state: SovereignBackpressureState
  ): SovereignBackpressureDecision {
    switch (state) {
      case "NORMAL":
        return "ACCEPT";

      case "ELEVATED":
        return "THROTTLE";

      case "HIGH":
        return "DEFER";

      case "CRITICAL":
      case "ISOLATED":
        return "REJECT";
    }
  }

  public evaluate(
    controllerId: string,
    metrics: SovereignBackpressureMetrics
  ): SovereignBackpressureResult {
    const record =
      this.records.get(controllerId);

    const policy =
      this.policies.get(controllerId);

    if (!record || !policy) {
      return this.failure(
        controllerId,
        "",
        "BACKPRESSURE_CONTROLLER_NOT_FOUND"
      );
    }

    if (
      metrics.activeOperations < 0 ||
      metrics.queueDepth < 0 ||
      metrics.healthyWorkers < 0 ||
      metrics.totalWorkers < 0 ||
      metrics.healthyWorkers > metrics.totalWorkers
    ) {
      return this.failure(
        record.controllerId,
        record.target,
        "INVALID_BACKPRESSURE_METRICS"
      );
    }

    const load =
      this.calculateLoad(metrics, policy);

    const state =
      this.stateForLoad(load, policy);

    const decision =
      this.decisionForState(state);

    record.state = state;
    record.lastLoadPercent = load;
    record.updatedAt = Date.now();

    record.reasons = [];

    switch (decision) {
      case "ACCEPT":
        record.accepted += 1;
        break;

      case "THROTTLE":
        record.throttled += 1;
        record.reasons.push(
          "LOAD_ELEVATED"
        );
        break;

      case "DEFER":
        record.deferred += 1;
        record.reasons.push(
          "LOAD_HIGH"
        );
        break;

      case "REJECT":
        record.rejected += 1;
        record.reasons.push(
          "LOAD_CRITICAL"
        );
        break;
    }

    this.records.set(
      controllerId,
      record
    );

    return this.result(
      record,
      decision,
      load,
      decision === "THROTTLE" ||
      decision === "DEFER"
        ? policy.throttleDelayMs
        : undefined
    );
  }

  public isolate(
    controllerId: string,
    reason = "TARGET_ISOLATED"
  ): SovereignBackpressureResult {
    const record =
      this.records.get(controllerId);

    if (!record) {
      return this.failure(
        controllerId,
        "",
        "BACKPRESSURE_CONTROLLER_NOT_FOUND"
      );
    }

    record.state = "ISOLATED";
    record.updatedAt = Date.now();
    record.reasons = [reason];
    record.rejected += 1;

    this.records.set(
      controllerId,
      record
    );

    return this.result(
      record,
      "REJECT",
      100
    );
  }

  public restore(
    controllerId: string
  ): SovereignBackpressureResult {
    const record =
      this.records.get(controllerId);

    if (!record) {
      return this.failure(
        controllerId,
        "",
       
