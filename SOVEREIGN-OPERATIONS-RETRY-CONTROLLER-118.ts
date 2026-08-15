// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-RETRY-CONTROLLER-118.ts
// Sequence: 118
// Purpose: Sovereign Retry Control, Backoff, Retry Budget & Recovery Handoff
// ============================================================================

export const SOVEREIGN_OPERATIONS_RETRY_CONTROLLER_ID =
  "SOVEREIGN-OPERATIONS-RETRY-CONTROLLER-118";

export const SOVEREIGN_OPERATIONS_RETRY_CONTROLLER_VERSION =
  "1.0.0";

export type SovereignRetryState =
  | "REGISTERED"
  | "READY"
  | "WAITING"
  | "RETRYING"
  | "SUCCEEDED"
  | "EXHAUSTED"
  | "BLOCKED"
  | "CANCELLED";

export type SovereignRetryDecision =
  | "RETRY_NOW"
  | "RETRY_LATER"
  | "HANDOFF_RECOVERY"
  | "BLOCK"
  | "COMPLETE";

export type SovereignRetryBackoff =
  | "FIXED"
  | "LINEAR"
  | "EXPONENTIAL";

export interface SovereignRetryAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignRetryPolicy {
  maxAttempts: number;

  baseDelayMs: number;
  maxDelayMs: number;

  backoff: SovereignRetryBackoff;

  retryableReasons: string[];
  nonRetryableReasons: string[];
}

export interface SovereignRetryRequest {
  retryId: string;
  operationId: string;

  requestedBy: string;
  target: string;

  authorityContext: SovereignRetryAuthorityContext;

  policy: SovereignRetryPolicy;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignRetryRecord {
  retryId: string;
  operationId: string;

  requestedBy: string;
  target: string;

  state: SovereignRetryState;

  attempts: number;

  nextRetryAt?: number;
  lastAttemptAt?: number;

  lastFailureReason?: string;

  createdAt: number;
  updatedAt: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignRetryResult {
  retryId: string;
  operationId: string;

  accepted: boolean;

  state: SovereignRetryState;
  decision: SovereignRetryDecision;

  attempts: number;
  remainingAttempts: number;

  nextRetryAt?: number;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsRetryController {
  public readonly id =
    SOVEREIGN_OPERATIONS_RETRY_CONTROLLER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_RETRY_CONTROLLER_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly retryControllerCanCreateAuthority = false;
  public readonly retryControllerCanEscalateAuthority = false;
  public readonly retryControllerCanOverrideOwner = false;
  public readonly retryControllerCanBypassSecurity = false;
  public readonly retryControllerCanRetryForever = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignRetryRecord>();

  private readonly policies =
    new Map<string, SovereignRetryPolicy>();

  private validate(
    request: SovereignRetryRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.retryId) {
      reasons.push("RETRY_ID_REQUIRED");
    }

    if (!request.operationId) {
      reasons.push("OPERATION_ID_REQUIRED");
    }

    if (!request.requestedBy) {
      reasons.push("REQUESTER_REQUIRED");
    }

    if (!request.target) {
      reasons.push("TARGET_REQUIRED");
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
      !Number.isInteger(request.policy.maxAttempts) ||
      request.policy.maxAttempts < 1
    ) {
      reasons.push("INVALID_MAX_ATTEMPTS");
    }

    if (
      request.policy.baseDelayMs < 0 ||
      request.policy.maxDelayMs <
        request.policy.baseDelayMs
    ) {
      reasons.push("INVALID_RETRY_DELAY");
    }

    return reasons;
  }

  public register(
    request: SovereignRetryRequest
  ): SovereignRetryResult {
    const now = Date.now();

    if (this.records.has(request.retryId)) {
      return this.failure(
        request.retryId,
        request.operationId,
        "RETRY_ALREADY_EXISTS"
      );
    }

    const reasons = this.validate(request);

    if (reasons.length > 0) {
      return {
        retryId: request.retryId,
        operationId: request.operationId,

        accepted: false,

        state: "BLOCKED",
        decision: "BLOCK",

        attempts: 0,
        remainingAttempts: 0,

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignRetryRecord = {
      retryId: request.retryId,
      operationId: request.operationId,

      requestedBy: request.requestedBy,
      target: request.target,

      state: "READY",

      attempts: 0,

      createdAt: request.createdAt,
      updatedAt: now,

      reasons: [],

      authority: "NONE"
    };

    this.records.set(
      record.retryId,
      record
    );

    this.policies.set(
      record.retryId,
      {
        ...request.policy,
        retryableReasons: [
          ...request.policy.retryableReasons
        ],
        nonRetryableReasons: [
          ...request.policy.nonRetryableReasons
        ]
      }
    );

    return this.result(
      record,
      "RETRY_NOW"
    );
  }

  private calculateDelay(
    policy: SovereignRetryPolicy,
    attempt: number
  ): number {
    let delay: number;

    switch (policy.backoff) {
      case "FIXED":
        delay = policy.baseDelayMs;
        break;

      case "LINEAR":
        delay =
          policy.baseDelayMs * attempt;
        break;

      case "EXPONENTIAL":
        delay =
          policy.baseDelayMs *
          Math.pow(2, Math.max(0, attempt - 1));
        break;

      default:
        delay = policy.baseDelayMs;
    }

    return Math.min(
      delay,
      policy.maxDelayMs
    );
  }

  private isRetryable(
    policy: SovereignRetryPolicy,
    reason: string
  ): boolean {
    if (
      policy.nonRetryableReasons.includes(reason)
    ) {
      return false;
    }

    if (
      policy.retryableReasons.length === 0
    ) {
      return true;
    }

    return policy.retryableReasons.includes(reason);
  }

  public recordFailure(
    retryId: string,
    failureReason: string
  ): SovereignRetryResult {
    const record =
      this.records.get(retryId);

    const policy =
      this.policies.get(retryId);

    if (!record || !policy) {
      return this.failure(
        retryId,
        "",
        "RETRY_NOT_FOUND"
      );
    }

    if (
      record.state === "SUCCEEDED" ||
      record.state === "EXHAUSTED" ||
      record.state === "CANCELLED"
    ) {
      return this.failure(
        record.retryId,
        record.operationId,
        "RETRY_TERMINAL_STATE"
      );
    }

    const now = Date.now();

    record.attempts += 1;
    record.lastAttemptAt = now;
    record.lastFailureReason =
      failureReason;
    record.updatedAt = now;

    if (
      !this.isRetryable(
        policy,
        failureReason
      )
    ) {
      record.state = "EXHAUSTED";
      record.reasons = [
        "NON_RETRYABLE_FAILURE",
        failureReason
      ];

      this.records.set(
        retryId,
        record
      );

      return this.result(
        record,
        "HANDOFF_RECOVERY"
      );
    }

    if (
      record.attempts >=
      policy.maxAttempts
    ) {
      record.state = "EXHAUSTED";
      record.reasons = [
        "RETRY_BUDGET_EXHAUSTED"
      ];

      this.records.set(
        retryId,
        record
      );

      return this.result(
        record,
        "HANDOFF_RECOVERY"
      );
    }

    const delay =
      this.calculateDelay(
        policy,
        record.attempts
      );

    record.nextRetryAt =
      now + delay;

    record.state =
      delay === 0
        ? "READY"
        : "WAITING";

    record.reasons = [
      "RETRY_SCHEDULED"
    ];

    this.records.set(
      retryId,
      record
    );

    return this.result(
      record,
      delay === 0
        ? "RETRY_NOW"
        : "RETRY_LATER"
    );
  }

  public beginRetry(
    retryId: string,
    now = Date.now()
  ): SovereignRetryResult {
    const record =
      this.records.get(retryId);

    const policy =
      this.policies.get(retryId);

    if (!record || !policy) {
      return this.failure(
        retryId,
        "",
        "RETRY_NOT_FOUND"
      );
    }

    if (
      record.state !== "READY" &&
      record.state !== "WAITING"
    ) {
      return this.failure(
        record.retryId,
        record.operationId,
        "RETRY_NOT_READY"
      );
    }

    if (
      record.nextRetryAt !== undefined &&
      now < record.nextRetryAt
    ) {
      return this.result(
        record,
        "RETRY_LATER"
      );
    }

    if (
      record.attempts >=
      policy.maxAttempts
    ) {
      record.state = "EXHAUSTED";
      record.updatedAt = now;
      record.reasons = [
        "RETRY_BUDGET_EXHAUSTED"
      ];

      return this.result(
        record,
        "HANDOFF_RECOVERY"
      );
    }

    record.state = "RETRYING
