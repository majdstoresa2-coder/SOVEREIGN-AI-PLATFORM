// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-OBSERVER-114.ts
// Sequence: 114
// Purpose: Sovereign Operations Observation, Health & Execution Visibility
// ============================================================================

export const SOVEREIGN_OPERATIONS_OBSERVER_ID =
  "SOVEREIGN-OPERATIONS-OBSERVER-114";

export const SOVEREIGN_OPERATIONS_OBSERVER_VERSION = "1.0.0";

export type SovereignObservedOperationState =
  | "CREATED"
  | "QUEUED"
  | "SCHEDULED"
  | "DISPATCHED"
  | "EXECUTING"
  | "VERIFYING"
  | "COMPLETED"
  | "FAILED"
  | "RECOVERING"
  | "ROLLED_BACK"
  | "CANCELLED";

export type SovereignOperationHealth =
  | "HEALTHY"
  | "DEGRADED"
  | "STALLED"
  | "CRITICAL"
  | "UNKNOWN";

export interface SovereignObserverAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignOperationObservation {
  observationId: string;
  operationId: string;

  lifecycleId?: string;
  coordinationId?: string;
  dispatchId?: string;
  workerId?: string;

  requestedBy: string;
  target: string;

  state: SovereignObservedOperationState;
  health: SovereignOperationHealth;

  authorityContext: SovereignObserverAuthorityContext;

  progress?: number;

  startedAt?: number;
  lastActivityAt: number;
  observedAt: number;

  failureReason?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignOperationHealthPolicy {
  degradedAfterMs: number;
  stalledAfterMs: number;
  criticalAfterMs: number;
}

export interface SovereignObserverResult {
  observationId: string;
  operationId: string;

  accepted: boolean;

  state: SovereignObservedOperationState;
  health: SovereignOperationHealth;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export interface SovereignOperationsSnapshot {
  total: number;

  healthy: number;
  degraded: number;
  stalled: number;
  critical: number;
  unknown: number;

  executing: number;
  completed: number;
  failed: number;
  recovering: number;

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsObserver {
  public readonly id =
    SOVEREIGN_OPERATIONS_OBSERVER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_OBSERVER_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly observerCanCreateAuthority = false;
  public readonly observerCanEscalateAuthority = false;
  public readonly observerCanOverrideOwner = false;
  public readonly observerCanExecuteOperations = false;
  public readonly observerCanModifyOperations = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly observations =
    new Map<string, SovereignOperationObservation>();

  private readonly policy: SovereignOperationHealthPolicy;

  constructor(
    policy: SovereignOperationHealthPolicy = {
      degradedAfterMs: 60_000,
      stalledAfterMs: 180_000,
      criticalAfterMs: 300_000
    }
  ) {
    this.policy = this.validatePolicy(policy);
  }

  private validatePolicy(
    policy: SovereignOperationHealthPolicy
  ): SovereignOperationHealthPolicy {
    if (
      policy.degradedAfterMs <= 0 ||
      policy.stalledAfterMs <=
        policy.degradedAfterMs ||
      policy.criticalAfterMs <=
        policy.stalledAfterMs
    ) {
      throw new Error(
        "INVALID_OPERATION_HEALTH_POLICY"
      );
    }

    return { ...policy };
  }

  private validateAuthority(
    observation: SovereignOperationObservation
  ): string[] {
    const reasons: string[] = [];

    if (!observation.authorityContext.ownerId) {
      reasons.push("OWNER_ID_REQUIRED");
    }

    if (
      observation.authorityContext.ownerAuthority !==
      "SUPREME"
    ) {
      reasons.push("OWNER_MUST_REMAIN_SUPREME");
    }

    if (
      observation.authorityContext.stewardAuthority !==
      "DELEGATED"
    ) {
      reasons.push("STEWARD_MUST_REMAIN_DELEGATED");
    }

    if (!observation.requestedBy) {
      reasons.push("REQUESTER_REQUIRED");
    }

    return reasons;
  }

  private calculateHealth(
    observation: SovereignOperationObservation,
    now = Date.now()
  ): SovereignOperationHealth {
    if (
      observation.state === "COMPLETED" ||
      observation.state === "ROLLED_BACK"
    ) {
      return "HEALTHY";
    }

    if (
      observation.state === "FAILED"
    ) {
      return "CRITICAL";
    }

    if (
      observation.state === "CANCELLED"
    ) {
      return "UNKNOWN";
    }

    const inactivity =
      Math.max(
        0,
        now - observation.lastActivityAt
      );

    if (
      inactivity >=
      this.policy.criticalAfterMs
    ) {
      return "CRITICAL";
    }

    if (
      inactivity >=
      this.policy.stalledAfterMs
    ) {
      return "STALLED";
    }

    if (
      inactivity >=
      this.policy.degradedAfterMs
    ) {
      return "DEGRADED";
    }

    return "HEALTHY";
  }

  public observe(
    observation: SovereignOperationObservation
  ): SovereignObserverResult {
    const now = Date.now();

    const reasons =
      this.validateAuthority(observation);

    if (!observation.observationId) {
      reasons.push("OBSERVATION_ID_REQUIRED");
    }

    if (!observation.operationId) {
      reasons.push("OPERATION_ID_REQUIRED");
    }

    if (!observation.target) {
      reasons.push("TARGET_REQUIRED");
    }

    if (
      observation.progress !== undefined &&
      (
        !Number.isFinite(observation.progress) ||
        observation.progress < 0 ||
        observation.progress > 100
      )
    ) {
      reasons.push("INVALID_PROGRESS");
    }

    if (
      this.observations.has(
        observation.observationId
      )
    ) {
      reasons.push("OBSERVATION_ALREADY_EXISTS");
    }

    if (reasons.length > 0) {
      return {
        observationId:
          observation.observationId,

        operationId:
          observation.operationId,

        accepted: false,

        state: observation.state,
        health: "UNKNOWN",

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignOperationObservation = {
      ...observation,

      authorityContext: {
        ...observation.authorityContext,
        delegationScope: [
          ...observation.authorityContext
            .delegationScope
        ]
      },

      metadata: observation.metadata
        ? { ...observation.metadata }
        : undefined,

      health: this.calculateHealth(
        observation,
        now
      ),

      observedAt: now
    };

    this.observations.set(
      record.observationId,
      record
    );

    return this.success(record);
  }

  public update(
    observationId: string,
    state: SovereignObservedOperationState,
    progress?: number,
    failureReason?: string
  ): SovereignObserverResult {
    const record =
      this.observations.get(observationId);

    if (!record) {
      return this.failure(
        observationId,
        "",
        "OBSERVATION_NOT_FOUND"
      );
    }

    if (
      progress !== undefined &&
      (
        !Number.isFinite(progress) ||
        progress < 0 ||
        progress > 100
      )
    ) {
      return this.failure(
        record.observationId,
        record.operationId,
        "INVALID_PROGRESS"
      );
    }

    const now = Date.now();

    record.state = state;
    record.progress =
      progress ?? record.progress;

    record.failureReason =
      failureReason;

    record.lastActivityAt = now;
    record.observedAt = now;

    record.health =
      this.calculateHealth(record, now);

    this.observations.set(
      record.observationId,
      record
    );

    return this.success(record);
  }

  public heartbeat(
    observationId: string
  ): SovereignObserverResult {
    const record =
      this.observations.get(observationId);

    if (!record) {
      return this.failure(
        observationId,
        "",
        "OBSERVATION_NOT_FOUND"
      );
    }

    const now = Date.now();

    record.lastActivityAt = now;
    record.observedAt = now;

    record.health =
      this.calculateHealth(record, now);

    this.observations.set(
      record.observationId,
      record
    );

    return this.success(record);
  }

  public evaluate(
    now = Date.now()
  ): SovereignOperationObservation[] {
    for (
      const record of
      this.observations.values()
    ) {
      record.health =
        this.calculateHealth(record, now);

      record.observedAt = now;
    }

    return this.getAll();
  }

  public getObservation(
    observationId: string
  ): SovereignOperationObservation | undefined {
    const record =
      this.observations.get(observationId);

    return record
      ? this.clone(record)
      : undefined;
  }

  public getByOperation(
    operationId: string
  ): SovereignOperationObservation[] {
    return [...this.observations.values()]
      .filter(
        (record) =>
          record.operationId === operationId
      )
      .map((record) =>
        this.clone(record)
      );
  }

  public getUnhealthy():
    SovereignOperationObservation[] {
    this.evaluate();

    return [...this.observations.values()]
      .filter(
