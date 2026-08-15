// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-BULKHEAD-120.ts
// Sequence: 120
// Purpose: Sovereign Workload Isolation, Capacity Protection & Bulkheading
// ============================================================================

export const SOVEREIGN_OPERATIONS_BULKHEAD_ID =
  "SOVEREIGN-OPERATIONS-BULKHEAD-120";

export const SOVEREIGN_OPERATIONS_BULKHEAD_VERSION =
  "1.0.0";

export type SovereignBulkheadState =
  | "AVAILABLE"
  | "DEGRADED"
  | "SATURATED"
  | "ISOLATED"
  | "DISABLED";

export type SovereignBulkheadDecision =
  | "ALLOW"
  | "QUEUE"
  | "REJECT"
  | "ISOLATE";

export interface SovereignBulkheadAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignBulkheadPolicy {
  maxConcurrent: number;
  maxQueued: number;

  degradedThresholdPercent: number;
  saturationThresholdPercent: number;
}

export interface SovereignBulkheadRegistration {
  bulkheadId: string;
  partition: string;

  requestedBy: string;

  authorityContext: SovereignBulkheadAuthorityContext;

  policy: SovereignBulkheadPolicy;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignBulkheadRecord {
  bulkheadId: string;
  partition: string;

  state: SovereignBulkheadState;

  activeOperations: number;
  queuedOperations: number;

  totalAccepted: number;
  totalQueued: number;
  totalRejected: number;
  totalCompleted: number;
  totalFailed: number;

  createdAt: number;
  updatedAt: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignBulkheadResult {
  bulkheadId: string;
  partition: string;

  accepted: boolean;

  state: SovereignBulkheadState;
  decision: SovereignBulkheadDecision;

  activeOperations: number;
  queuedOperations: number;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsBulkhead {
  public readonly id =
    SOVEREIGN_OPERATIONS_BULKHEAD_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_BULKHEAD_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly bulkheadCanCreateAuthority = false;
  public readonly bulkheadCanEscalateAuthority = false;
  public readonly bulkheadCanOverrideOwner = false;
  public readonly bulkheadCanBypassSecurity = false;
  public readonly bulkheadCanDisableAudit = false;
  public readonly bulkheadCanExceedCapacity = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly bulkheads =
    new Map<string, SovereignBulkheadRecord>();

  private readonly policies =
    new Map<string, SovereignBulkheadPolicy>();

  private validate(
    registration: SovereignBulkheadRegistration
  ): string[] {
    const reasons: string[] = [];

    if (!registration.bulkheadId) {
      reasons.push("BULKHEAD_ID_REQUIRED");
    }

    if (!registration.partition) {
      reasons.push("PARTITION_REQUIRED");
    }

    if (!registration.requestedBy) {
      reasons.push("REQUESTER_REQUIRED");
    }

    if (!registration.authorityContext.ownerId) {
      reasons.push("OWNER_ID_REQUIRED");
    }

    if (
      registration.authorityContext.ownerAuthority !==
      "SUPREME"
    ) {
      reasons.push("OWNER_MUST_REMAIN_SUPREME");
    }

    if (
      registration.authorityContext.stewardAuthority !==
      "DELEGATED"
    ) {
      reasons.push("STEWARD_MUST_REMAIN_DELEGATED");
    }

    if (!registration.securityApproved) {
      reasons.push("SECURITY_APPROVAL_REQUIRED");
    }

    if (!registration.policyApproved) {
      reasons.push("POLICY_APPROVAL_REQUIRED");
    }

    const policy = registration.policy;

    if (
      !Number.isInteger(policy.maxConcurrent) ||
      policy.maxConcurrent < 1
    ) {
      reasons.push("INVALID_MAX_CONCURRENT");
    }

    if (
      !Number.isInteger(policy.maxQueued) ||
      policy.maxQueued < 0
    ) {
      reasons.push("INVALID_MAX_QUEUED");
    }

    if (
      !Number.isFinite(
        policy.degradedThresholdPercent
      ) ||
      policy.degradedThresholdPercent <= 0 ||
      policy.degradedThresholdPercent > 100
    ) {
      reasons.push(
        "INVALID_DEGRADED_THRESHOLD"
      );
    }

    if (
      !Number.isFinite(
        policy.saturationThresholdPercent
      ) ||
      policy.saturationThresholdPercent <=
        policy.degradedThresholdPercent ||
      policy.saturationThresholdPercent > 100
    ) {
      reasons.push(
        "INVALID_SATURATION_THRESHOLD"
      );
    }

    return reasons;
  }

  public register(
    registration: SovereignBulkheadRegistration
  ): SovereignBulkheadResult {
    const now = Date.now();

    if (
      this.bulkheads.has(
        registration.bulkheadId
      )
    ) {
      return this.failure(
        registration.bulkheadId,
        registration.partition,
        "BULKHEAD_ALREADY_EXISTS"
      );
    }

    const reasons =
      this.validate(registration);

    if (reasons.length > 0) {
      return {
        bulkheadId: registration.bulkheadId,
        partition: registration.partition,

        accepted: false,

        state: "DISABLED",
        decision: "REJECT",

        activeOperations: 0,
        queuedOperations: 0,

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignBulkheadRecord = {
      bulkheadId: registration.bulkheadId,
      partition: registration.partition,

      state: "AVAILABLE",

      activeOperations: 0,
      queuedOperations: 0,

      totalAccepted: 0,
      totalQueued: 0,
      totalRejected: 0,
      totalCompleted: 0,
      totalFailed: 0,

      createdAt: registration.createdAt,
      updatedAt: now,

      reasons: [],

      authority: "NONE"
    };

    this.bulkheads.set(
      record.bulkheadId,
      record
    );

    this.policies.set(
      record.bulkheadId,
      { ...registration.policy }
    );

    return this.result(
      record,
      "ALLOW"
    );
  }

  private calculateState(
    record: SovereignBulkheadRecord,
    policy: SovereignBulkheadPolicy
  ): SovereignBulkheadState {
    if (record.state === "ISOLATED") {
      return "ISOLATED";
    }

    if (record.state === "DISABLED") {
      return "DISABLED";
    }

    const utilization =
      (
        record.activeOperations /
        policy.maxConcurrent
      ) * 100;

    if (
      record.activeOperations >=
        policy.maxConcurrent &&
      record.queuedOperations >=
        policy.maxQueued
    ) {
      return "SATURATED";
    }

    if (
      utilization >=
      policy.saturationThresholdPercent
    ) {
      return "SATURATED";
    }

    if (
      utilization >=
      policy.degradedThresholdPercent
    ) {
      return "DEGRADED";
    }

    return "AVAILABLE";
  }

  public acquire(
    bulkheadId: string
  ): SovereignBulkheadResult {
    const record =
      this.bulkheads.get(bulkheadId);

    const policy =
      this.policies.get(bulkheadId);

    if (!record || !policy) {
      return this.failure(
        bulkheadId,
        "",
        "BULKHEAD_NOT_FOUND"
      );
    }

    if (
      record.state === "ISOLATED" ||
      record.state === "DISABLED"
    ) {
      record.totalRejected += 1;

      return this.result(
        record,
        "REJECT"
      );
    }

    if (
      record.activeOperations <
      policy.maxConcurrent
    ) {
      record.activeOperations += 1;
      record.totalAccepted += 1;
      record.updatedAt = Date.now();

      record.state =
        this.calculateState(
          record,
          policy
        );

      record.reasons = [];

      this.bulkheads.set(
        bulkheadId,
        record
      );

      return this.result(
        record,
        "ALLOW"
      );
    }

    if (
      record.queuedOperations <
      policy.maxQueued
    ) {
      record.queuedOperations += 1;
      record.totalQueued += 1;
      record.updatedAt = Date.now();

      record.state =
        this.calculateState(
          record,
          policy
        );

      record.reasons = [
        "OPERATION_QUEUED_BY_BULKHEAD"
      ];

      this.bulkheads.set(
        bulkheadId,
        record
      );

      return this.result(
        record,
        "QUEUE"
      );
    }

    record.totalRejected += 1;
    record.state = "SATURATED";
    record.updatedAt = Date.now();

    record.reasons = [
      "BULKHEAD_CAPACITY_EXHAUSTED"
    ];

    this.bulkheads.set(
      bulkheadId,
      record
    );

    return this.result(
      record,
      "REJECT"
    );
  }

  public release(
    bulkheadId: string,
    successful = true
  ): SovereignBulkheadResult {
    const record =
      this.bulkheads.get(bulkheadId);

    const policy =
      this.policies.get(bulkheadId);

    if (!record || !policy) {
      return this.failure(
        bulkheadId,
        "",
        "BULKHEAD_NOT_FOUND"
      );
    }

    if (record.activeOperations > 0) {
      record.activeOperations -= 1;
    }

    if (successful) {
      record.totalCompleted += 1;
    } else {
      record.totalFailed += 1;
    }

    if (
      record.queuedOperations > 0 &&
      record.activeOperations <
        policy.maxConcurrent
    ) {
      record.queuedOperations -= 1;
      record.activeOperations += 1;
      record.totalAccepted += 1;
    }

    record.updatedAt = Date.now();

    record.state =
      this.calculateState(
        record,
        policy
      );

    record.reasons = [];

    this.bulkheads.set(
      bulkheadId,
      record
    );

    return this.result(
      record,
      "ALLOW"
    );
  }

  public isolate(
    bulkheadId: string,
    reason = "PARTITION_ISOLATED"
  ): SovereignBulkheadResult {
    const record =
      this.bulkheads.get(bulkheadId);

    if (!record) {
      return this.failure(
        bulkheadId,
        "",
        "BULKHEAD_NOT_FOUND"
      );
    }

    record.state = "ISOLATED";
    record.updatedAt = Date.now();
    record.reasons = [reason];

    this.bulkheads.set(
      bulkheadId,
      record
    );

    return this.result(
      record,
      "ISOLATE"
    );
  }

  public restore(
    bulkheadId: string
  ): SovereignBulkheadResult {
    const record =
      this.bulkheads.get(bulkheadId);

    const policy =
      this.policies.get(bulkheadId);

    if (!record || !policy) {
      return this.failure(
        bulkheadId,
        "",
        "BULKHEAD_NOT_FOUND"
      );
    }

    record.state =
      this.calculate
