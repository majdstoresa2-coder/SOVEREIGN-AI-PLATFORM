// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-CIRCUIT-BREAKER-119.ts
// Sequence: 119
// Purpose: Sovereign Circuit Breaker & Failure Isolation
// ============================================================================

export const SOVEREIGN_OPERATIONS_CIRCUIT_BREAKER_ID =
  "SOVEREIGN-OPERATIONS-CIRCUIT-BREAKER-119";

export const SOVEREIGN_OPERATIONS_CIRCUIT_BREAKER_VERSION =
  "1.0.0";

export type SovereignCircuitState =
  | "CLOSED"
  | "OPEN"
  | "HALF_OPEN";

export type SovereignCircuitDecision =
  | "ALLOW"
  | "PROBE"
  | "BLOCK";

export interface SovereignCircuitAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignCircuitPolicy {
  failureThreshold: number;
  successThreshold: number;

  openDurationMs: number;

  halfOpenMaxRequests: number;
}

export interface SovereignCircuitRegistration {
  circuitId: string;
  target: string;

  requestedBy: string;

  authorityContext: SovereignCircuitAuthorityContext;

  policy: SovereignCircuitPolicy;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignCircuitRecord {
  circuitId: string;
  target: string;

  state: SovereignCircuitState;

  consecutiveFailures: number;
  consecutiveSuccesses: number;

  halfOpenRequests: number;

  openedAt?: number;
  lastFailureAt?: number;
  lastSuccessAt?: number;

  createdAt: number;
  updatedAt: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignCircuitResult {
  circuitId: string;
  target: string;

  accepted: boolean;

  state: SovereignCircuitState;
  decision: SovereignCircuitDecision;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsCircuitBreaker {
  public readonly id =
    SOVEREIGN_OPERATIONS_CIRCUIT_BREAKER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_CIRCUIT_BREAKER_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly circuitBreakerCanCreateAuthority = false;
  public readonly circuitBreakerCanEscalateAuthority = false;
  public readonly circuitBreakerCanOverrideOwner = false;
  public readonly circuitBreakerCanBypassSecurity = false;
  public readonly circuitBreakerCanDisableAudit = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly circuits =
    new Map<string, SovereignCircuitRecord>();

  private readonly policies =
    new Map<string, SovereignCircuitPolicy>();

  private validate(
    registration: SovereignCircuitRegistration
  ): string[] {
    const reasons: string[] = [];

    if (!registration.circuitId) {
      reasons.push("CIRCUIT_ID_REQUIRED");
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
      !Number.isInteger(
        registration.policy.failureThreshold
      ) ||
      registration.policy.failureThreshold < 1
    ) {
      reasons.push("INVALID_FAILURE_THRESHOLD");
    }

    if (
      !Number.isInteger(
        registration.policy.successThreshold
      ) ||
      registration.policy.successThreshold < 1
    ) {
      reasons.push("INVALID_SUCCESS_THRESHOLD");
    }

    if (
      !Number.isFinite(
        registration.policy.openDurationMs
      ) ||
      registration.policy.openDurationMs < 1
    ) {
      reasons.push("INVALID_OPEN_DURATION");
    }

    if (
      !Number.isInteger(
        registration.policy.halfOpenMaxRequests
      ) ||
      registration.policy.halfOpenMaxRequests < 1
    ) {
      reasons.push("INVALID_HALF_OPEN_MAX_REQUESTS");
    }

    return reasons;
  }

  public register(
    registration: SovereignCircuitRegistration
  ): SovereignCircuitResult {
    const now = Date.now();

    if (
      this.circuits.has(
        registration.circuitId
      )
    ) {
      return this.failure(
        registration.circuitId,
        registration.target,
        "CIRCUIT_ALREADY_EXISTS"
      );
    }

    const reasons =
      this.validate(registration);

    if (reasons.length > 0) {
      return {
        circuitId: registration.circuitId,
        target: registration.target,

        accepted: false,

        state: "OPEN",
        decision: "BLOCK",

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignCircuitRecord = {
      circuitId: registration.circuitId,
      target: registration.target,

      state: "CLOSED",

      consecutiveFailures: 0,
      consecutiveSuccesses: 0,

      halfOpenRequests: 0,

      createdAt: registration.createdAt,
      updatedAt: now,

      reasons: [],

      authority: "NONE"
    };

    this.circuits.set(
      record.circuitId,
      record
    );

    this.policies.set(
      record.circuitId,
      { ...registration.policy }
    );

    return this.result(
      record,
      "ALLOW"
    );
  }

  public evaluate(
    circuitId: string,
    now = Date.now()
  ): SovereignCircuitResult {
    const record =
      this.circuits.get(circuitId);

    const policy =
      this.policies.get(circuitId);

    if (!record || !policy) {
      return this.failure(
        circuitId,
        "",
        "CIRCUIT_NOT_FOUND"
      );
    }

    if (record.state === "CLOSED") {
      return this.result(
        record,
        "ALLOW"
      );
    }

    if (record.state === "OPEN") {
      if (
        record.openedAt !== undefined &&
        now - record.openedAt >=
          policy.openDurationMs
      ) {
        record.state = "HALF_OPEN";
        record.halfOpenRequests = 0;
        record.consecutiveSuccesses = 0;
        record.updatedAt = now;
        record.reasons = [
          "CIRCUIT_PROBE_WINDOW_OPENED"
        ];

        this.circuits.set(
          circuitId,
          record
        );

        return this.result(
          record,
          "PROBE"
        );
      }

      return this.result(
        record,
        "BLOCK"
      );
    }

    if (
      record.halfOpenRequests >=
      policy.halfOpenMaxRequests
    ) {
      return this.result(
        record,
        "BLOCK"
      );
    }

    record.halfOpenRequests += 1;
    record.updatedAt = now;

    this.circuits.set(
      circuitId,
      record
    );

    return this.result(
      record,
      "PROBE"
    );
  }

  public recordSuccess(
    circuitId: string
  ): SovereignCircuitResult {
    const record =
      this.circuits.get(circuitId);

    const policy =
      this.policies.get(circuitId);

    if (!record || !policy) {
      return this.failure(
        circuitId,
        "",
        "CIRCUIT_NOT_FOUND"
      );
    }

    const now = Date.now();

    record.lastSuccessAt = now;
    record.updatedAt = now;

    record.consecutiveFailures = 0;
    record.consecutiveSuccesses += 1;

    if (
      record.state === "HALF_OPEN" &&
      record.consecutiveSuccesses >=
        policy.successThreshold
    ) {
      record.state = "CLOSED";

      record.consecutiveFailures = 0;
      record.consecutiveSuccesses = 0;
      record.halfOpenRequests = 0;

      record.openedAt = undefined;

      record.reasons = [
        "CIRCUIT_RECOVERED"
      ];
    } else {
      record.reasons = [];
    }

    this.circuits.set(
      circuitId,
      record
    );

    return this.result(
      record,
      record.state === "CLOSED"
        ? "ALLOW"
        : "PROBE"
    );
  }

  public recordFailure(
    circuitId: string,
    reason = "TARGET_FAILURE"
  ): SovereignCircuitResult {
    const record =
      this.circuits.get(circuitId);

    const policy =
      this.policies.get(circuitId);

    if (!record || !policy) {
      return this.failure(
        circuitId,
        "",
        "CIRCUIT_NOT_FOUND"
      );
    }

    const now = Date.now();

    record.lastFailureAt = now;
    record.updatedAt = now;

    record.consecutiveFailures += 1;
    record.consecutiveSuccesses = 0;

    if (record.state === "HALF_OPEN") {
      record.state = "OPEN";
      record.openedAt = now;
      record.halfOpenRequests = 0;

      record.reasons = [
        "HALF_OPEN_PROBE_FAILED",
        reason
      ];
    } else if (
      record.consecutiveFailures >=
      policy.failureThreshold
    ) {
      record.state = "OPEN";
      record.openedAt = now;
      record.halfOpenRequests = 0;

      record.reasons = [
        "FAILURE_THRESHOLD_REACHED",
        reason
      ];
    } else {
      record.reasons = [reason];
    }

    this.circuits.set(
      circuitId,
      record
    );

    return this.result(
      record,
      record.state === "OPEN"
        ? "BLOCK"
        : "ALLOW"
    );
  }

  public reset(
    circuitId: string
  ): Sovere
