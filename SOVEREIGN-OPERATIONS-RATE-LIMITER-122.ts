// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-RATE-LIMITER-122.ts
// Sequence: 122
// Purpose: Sovereign Operations Rate Limiting, Burst Control & Admission Safety
// ============================================================================

export const SOVEREIGN_OPERATIONS_RATE_LIMITER_ID =
  "SOVEREIGN-OPERATIONS-RATE-LIMITER-122";

export const SOVEREIGN_OPERATIONS_RATE_LIMITER_VERSION =
  "1.0.0";

export type SovereignRateLimitState =
  | "AVAILABLE"
  | "ELEVATED"
  | "LIMITED"
  | "EXHAUSTED"
  | "BLOCKED";

export type SovereignRateLimitDecision =
  | "ALLOW"
  | "ALLOW_BURST"
  | "THROTTLE"
  | "REJECT";

export interface SovereignRateLimitAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignRateLimitPolicy {
  maxRequests: number;
  windowMs: number;

  burstCapacity: number;

  elevatedThresholdPercent: number;
  limitedThresholdPercent: number;
}

export interface SovereignRateLimitRegistration {
  limiterId: string;
  target: string;

  requestedBy: string;

  authorityContext: SovereignRateLimitAuthorityContext;

  policy: SovereignRateLimitPolicy;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignRateLimitRecord {
  limiterId: string;
  target: string;

  state: SovereignRateLimitState;

  windowStartedAt: number;

  requestsInWindow: number;
  burstUsed: number;

  totalAllowed: number;
  totalBurstAllowed: number;
  totalThrottled: number;
  totalRejected: number;

  createdAt: number;
  updatedAt: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignRateLimitResult {
  limiterId: string;
  target: string;

  accepted: boolean;

  state: SovereignRateLimitState;
  decision: SovereignRateLimitDecision;

  remaining: number;
  burstRemaining: number;

  resetAt: number;
  retryAfterMs?: number;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsRateLimiter {
  public readonly id =
    SOVEREIGN_OPERATIONS_RATE_LIMITER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_RATE_LIMITER_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly limiterCanCreateAuthority = false;
  public readonly limiterCanEscalateAuthority = false;
  public readonly limiterCanOverrideOwner = false;
  public readonly limiterCanBypassSecurity = false;
  public readonly limiterCanIgnoreLimits = false;
  public readonly limiterCanDisableAudit = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignRateLimitRecord>();

  private readonly policies =
    new Map<string, SovereignRateLimitPolicy>();

  private validate(
    registration: SovereignRateLimitRegistration
  ): string[] {
    const reasons: string[] = [];

    const policy = registration.policy;

    if (!registration.limiterId) {
      reasons.push("LIMITER_ID_REQUIRED");
    }

    if (!registration.target) {
      reasons.push("TARGET_REQUIRED");
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

    if (
      !Number.isInteger(policy.maxRequests) ||
      policy.maxRequests < 1
    ) {
      reasons.push("INVALID_MAX_REQUESTS");
    }

    if (
      !Number.isFinite(policy.windowMs) ||
      policy.windowMs < 1
    ) {
      reasons.push("INVALID_WINDOW");
    }

    if (
      !Number.isInteger(policy.burstCapacity) ||
      policy.burstCapacity < 0
    ) {
      reasons.push("INVALID_BURST_CAPACITY");
    }

    if (
      !Number.isFinite(
        policy.elevatedThresholdPercent
      ) ||
      policy.elevatedThresholdPercent <= 0 ||
      policy.elevatedThresholdPercent >= 100
    ) {
      reasons.push(
        "INVALID_ELEVATED_THRESHOLD"
      );
    }

    if (
      !Number.isFinite(
        policy.limitedThresholdPercent
      ) ||
      policy.limitedThresholdPercent <=
        policy.elevatedThresholdPercent ||
      policy.limitedThresholdPercent > 100
    ) {
      reasons.push(
        "INVALID_LIMITED_THRESHOLD"
      );
    }

    return reasons;
  }

  public register(
    registration: SovereignRateLimitRegistration
  ): SovereignRateLimitResult {
    const now = Date.now();

    if (
      this.records.has(
        registration.limiterId
      )
    ) {
      return this.failure(
        registration.limiterId,
        registration.target,
        "RATE_LIMITER_ALREADY_EXISTS"
      );
    }

    const reasons =
      this.validate(registration);

    if (reasons.length > 0) {
      return {
        limiterId: registration.limiterId,
        target: registration.target,

        accepted: false,

        state: "BLOCKED",
        decision: "REJECT",

        remaining: 0,
        burstRemaining: 0,

        resetAt: now,

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignRateLimitRecord = {
      limiterId: registration.limiterId,
      target: registration.target,

      state: "AVAILABLE",

      windowStartedAt: now,

      requestsInWindow: 0,
      burstUsed: 0,

      totalAllowed: 0,
      totalBurstAllowed: 0,
      totalThrottled: 0,
      totalRejected: 0,

      createdAt: registration.createdAt,
      updatedAt: now,

      reasons: [],

      authority: "NONE"
    };

    this.records.set(
      record.limiterId,
      record
    );

    this.policies.set(
      record.limiterId,
      { ...registration.policy }
    );

    return this.result(
      record,
      registration.policy,
      "ALLOW",
      now
    );
  }

  private resetWindowIfNeeded(
    record: SovereignRateLimitRecord,
    policy: SovereignRateLimitPolicy,
    now: number
  ): void {
    if (
      now - record.windowStartedAt >=
      policy.windowMs
    ) {
      record.windowStartedAt = now;

      record.requestsInWindow = 0;
      record.burstUsed = 0;

      record.state = "AVAILABLE";
      record.reasons = [];
    }
  }

  private calculateState(
    record: SovereignRateLimitRecord,
    policy: SovereignRateLimitPolicy
  ): SovereignRateLimitState {
    if (record.state === "BLOCKED") {
      return "BLOCKED";
    }

    const usage =
      (
        record.requestsInWindow /
        policy.maxRequests
      ) * 100;

    if (
      record.requestsInWindow >=
        policy.maxRequests &&
      record.burstUsed >=
        policy.burstCapacity
    ) {
      return "EXHAUSTED";
    }

    if (
      usage >=
      policy.limitedThresholdPercent
    ) {
      return "LIMITED";
    }

    if (
      usage >=
      policy.elevatedThresholdPercent
    ) {
      return "ELEVATED";
    }

    return "AVAILABLE";
  }

  public acquire(
    limiterId: string,
    now = Date.now()
  ): SovereignRateLimitResult {
    const record =
      this.records.get(limiterId);

    const policy =
      this.policies.get(limiterId);

    if (!record || !policy) {
      return this.failure(
        limiterId,
        "",
        "RATE_LIMITER_NOT_FOUND"
      );
    }

    if (record.state === "BLOCKED") {
      record.totalRejected += 1;
      record.updatedAt = now;

      return this.result(
        record,
        policy,
        "REJECT",
        now
      );
    }

    this.resetWindowIfNeeded(
      record,
      policy,
      now
    );

    if (
      record.requestsInWindow <
      policy.maxRequests
    ) {
      record.requestsInWindow += 1;
      record.totalAllowed += 1;
      record.updatedAt = now;

      record.state =
        this.calculateState(
          record,
          policy
        );

      record.reasons = [];

      this.records.set(
        limiterId,
        record
      );

      return this.result(
        record,
        policy,
        "ALLOW",
        now
      );
    }

    if (
      record.burstUsed <
      policy.burstCapacity
    ) {
      record.burstUsed += 1;
      record.totalBurstAllowed += 1;
      record.updatedAt = now;

      record.state = "LIMITED";

      record.reasons = [
        "BURST_CAPACITY_USED"
      ];

      this.records.set(
        limiterId,
        record
      );

      return this.result(
        record,
        policy,
        "ALLOW_BURST",
        now
      );
    }

    const resetAt =
      record.windowStartedAt +
      policy.windowMs;

    const retryAfterMs =
      Math.max(
        0,
        resetAt - now
      );

    record.state = "EXHAUSTED";
    record.totalThrottled += 1;
    record.updatedAt = now;

    record.reasons = [
      "RATE_LIMIT_EXHAUSTED"
    ];

    this.records.set(
      limiterId,
      record
    );

    return this.result(
      record,
      policy,
      "THROTTLE",
      now,
      retryAfterMs
    );
  }

  public reject(
    limiterId: string,
    reason = "RATE_LIMIT_REQUEST_REJECTED"
  ): SovereignRateLimitResult {
    const record =
      this.records.get(limiterId);

    const policy =
      this.policies.get(limiterId);

    if (!record || !policy) {
      return this.failure(
        limiterId,
        "",
        "RATE_LIMITER_NOT_FOUND"
      );
    }

    record.totalRejected += 1;
    record.updatedAt = Date.now();

    record.reasons = [reason];

    this.records.set(
      limiterId,
      record
    );

    return this.result(
      record,
      policy,
      "REJECT",
      Date.now()
    );
  }

  public block(
    limiterId: string,
    reason = "RATE_LIMITER_BLOCKED"
  ): SovereignRateLimitResult {
    const record =
      this.records.get(limiterId);

    const policy =
      this.policies.get(limiterId);

    if (!record || !policy) {
      return this.failure(
        limiterId,
        "",
        "RATE_LIMITER_NOT_FOUND"
      );
    }

    record.state = "BLOCKED";
    record.updatedAt = Date.now();

    record.reasons = [reason];

    this.records.set(
      limiterId,
      record
    );

    return this.result(
      record,
      policy,
      "REJECT",
      Date
