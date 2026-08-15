// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-TIMEOUT-CONTROLLER-123.ts
// Sequence: 123
// Purpose: Sovereign Operation Timeout Control, Deadline Safety & Recovery Handoff
// ============================================================================

export const SOVEREIGN_OPERATIONS_TIMEOUT_CONTROLLER_ID =
  "SOVEREIGN-OPERATIONS-TIMEOUT-CONTROLLER-123";

export const SOVEREIGN_OPERATIONS_TIMEOUT_CONTROLLER_VERSION =
  "1.0.0";

export type SovereignTimeoutState =
  | "REGISTERED"
  | "RUNNING"
  | "WARNING"
  | "TIMED_OUT"
  | "COMPLETED"
  | "CANCELLED"
  | "BLOCKED";

export type SovereignTimeoutDecision =
  | "CONTINUE"
  | "WARN"
  | "HANDOFF_RETRY"
  | "HANDOFF_RECOVERY"
  | "COMPLETE"
  | "BLOCK";

export interface SovereignTimeoutAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignTimeoutPolicy {
  timeoutMs: number;

  warningBeforeMs: number;

  retryOnTimeout: boolean;

  maxTimeoutExtensions: number;
  extensionMs: number;
}

export interface SovereignTimeoutRequest {
  timeoutId: string;
  operationId: string;

  requestedBy: string;
  target: string;

  authorityContext: SovereignTimeoutAuthorityContext;

  policy: SovereignTimeoutPolicy;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignTimeoutRecord {
  timeoutId: string;
  operationId: string;

  requestedBy: string;
  target: string;

  state: SovereignTimeoutState;

  startedAt?: number;
  deadlineAt?: number;
  warningAt?: number;
  completedAt?: number;

  extensionsUsed: number;

  createdAt: number;
  updatedAt: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignTimeoutResult {
  timeoutId: string;
  operationId: string;

  accepted: boolean;

  state: SovereignTimeoutState;
  decision: SovereignTimeoutDecision;

  deadlineAt?: number;
  remainingMs?: number;

  extensionsUsed: number;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsTimeoutController {
  public readonly id =
    SOVEREIGN_OPERATIONS_TIMEOUT_CONTROLLER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_TIMEOUT_CONTROLLER_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly timeoutControllerCanCreateAuthority = false;
  public readonly timeoutControllerCanEscalateAuthority = false;
  public readonly timeoutControllerCanOverrideOwner = false;
  public readonly timeoutControllerCanBypassSecurity = false;
  public readonly timeoutControllerCanRunForever = false;
  public readonly timeoutControllerCanDisableAudit = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignTimeoutRecord>();

  private readonly policies =
    new Map<string, SovereignTimeoutPolicy>();

  private validate(
    request: SovereignTimeoutRequest
  ): string[] {
    const reasons: string[] = [];
    const policy = request.policy;

    if (!request.timeoutId) {
      reasons.push("TIMEOUT_ID_REQUIRED");
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
      !Number.isFinite(policy.timeoutMs) ||
      policy.timeoutMs < 1
    ) {
      reasons.push("INVALID_TIMEOUT");
    }

    if (
      !Number.isFinite(policy.warningBeforeMs) ||
      policy.warningBeforeMs < 0 ||
      policy.warningBeforeMs >= policy.timeoutMs
    ) {
      reasons.push("INVALID_WARNING_WINDOW");
    }

    if (
      !Number.isInteger(policy.maxTimeoutExtensions) ||
      policy.maxTimeoutExtensions < 0
    ) {
      reasons.push("INVALID_MAX_TIMEOUT_EXTENSIONS");
    }

    if (
      !Number.isFinite(policy.extensionMs) ||
      policy.extensionMs < 0
    ) {
      reasons.push("INVALID_EXTENSION_DURATION");
    }

    return reasons;
  }

  public register(
    request: SovereignTimeoutRequest
  ): SovereignTimeoutResult {
    const now = Date.now();

    if (this.records.has(request.timeoutId)) {
      return this.failure(
        request.timeoutId,
        request.operationId,
        "TIMEOUT_ALREADY_EXISTS"
      );
    }

    const reasons = this.validate(request);

    if (reasons.length > 0) {
      return {
        timeoutId: request.timeoutId,
        operationId: request.operationId,

        accepted: false,

        state: "BLOCKED",
        decision: "BLOCK",

        extensionsUsed: 0,

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignTimeoutRecord = {
      timeoutId: request.timeoutId,
      operationId: request.operationId,

      requestedBy: request.requestedBy,
      target: request.target,

      state: "REGISTERED",

      extensionsUsed: 0,

      createdAt: request.createdAt,
      updatedAt: now,

      reasons: [],

      authority: "NONE"
    };

    this.records.set(
      request.timeoutId,
      record
    );

    this.policies.set(
      request.timeoutId,
      { ...request.policy }
    );

    return this.result(
      record,
      "CONTINUE",
      now
    );
  }

  public start(
    timeoutId: string,
    now = Date.now()
  ): SovereignTimeoutResult {
    const record = this.records.get(timeoutId);
    const policy = this.policies.get(timeoutId);

    if (!record || !policy) {
      return this.failure(
        timeoutId,
        "",
        "TIMEOUT_NOT_FOUND"
      );
    }

    if (record.state !== "REGISTERED") {
      return this.failure(
        record.timeoutId,
        record.operationId,
        "TIMEOUT_NOT_REGISTERED"
      );
    }

    record.state = "RUNNING";
    record.startedAt = now;

    record.deadlineAt =
      now + policy.timeoutMs;

    record.warningAt =
      record.deadlineAt -
      policy.warningBeforeMs;

    record.updatedAt = now;
    record.reasons = [];

    this.records.set(
      timeoutId,
      record
    );

    return this.result(
      record,
      "CONTINUE",
      now
    );
  }

  public evaluate(
    timeoutId: string,
    now = Date.now()
  ): SovereignTimeoutResult {
    const record = this.records.get(timeoutId);
    const policy = this.policies.get(timeoutId);

    if (!record || !policy) {
      return this.failure(
        timeoutId,
        "",
        "TIMEOUT_NOT_FOUND"
      );
    }

    if (
      record.state === "COMPLETED" ||
      record.state === "CANCELLED" ||
      record.state === "TIMED_OUT"
    ) {
      return this.result(
        record,
        record.state === "COMPLETED"
          ? "COMPLETE"
          : "BLOCK",
        now
      );
    }

    if (
      record.deadlineAt === undefined
    ) {
      return this.failure(
        record.timeoutId,
        record.operationId,
        "TIMEOUT_NOT_STARTED"
      );
    }

    if (now >= record.deadlineAt) {
      record.state = "TIMED_OUT";
      record.updatedAt = now;

      record.reasons = [
        "OPERATION_TIMEOUT_EXCEEDED"
      ];

      this.records.set(
        timeoutId,
        record
      );

      return this.result(
        record,
        policy.retryOnTimeout
          ? "HANDOFF_RETRY"
          : "HANDOFF_RECOVERY",
        now
      );
    }

    if (
      record.warningAt !== undefined &&
      now >= record.warningAt
    ) {
      record.state = "WARNING";
      record.updatedAt = now;

      record.reasons = [
        "OPERATION_APPROACHING_TIMEOUT"
      ];

      this.records.set(
        timeoutId,
        record
      );

      return this.result(
        record,
        "WARN",
        now
      );
    }

    record.state = "RUNNING";
    record.updatedAt = now;
    record.reasons = [];

    return this.result(
      record,
      "CONTINUE",
      now
    );
  }

  public extend(
    timeoutId: string,
    now = Date.now()
  ): SovereignTimeoutResult {
    const record = this.records.get(timeoutId);
    const policy = this.policies.get(timeoutId);

    if (!record || !policy) {
      return this.failure(
        timeoutId,
        "",
        "TIMEOUT_NOT_FOUND"
      );
    }

    if (
      record.state !== "RUNNING" &&
      record.state !== "WARNING"
    ) {
      return this.failure(
        record.timeoutId,
        record.operationId,
        "TIMEOUT_CANNOT_BE_EXTENDED"
      );
    }

    if (
      record.extensionsUsed >=
