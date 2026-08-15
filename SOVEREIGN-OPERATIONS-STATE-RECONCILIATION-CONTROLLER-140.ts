// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-STATE-RECONCILIATION-CONTROLLER-140.ts
// Sequence: 140
// Purpose: Sovereign Desired-State Reconciliation & Drift Correction Control
// ============================================================================

export const SOVEREIGN_OPERATIONS_STATE_RECONCILIATION_CONTROLLER_ID =
  "SOVEREIGN-OPERATIONS-STATE-RECONCILIATION-CONTROLLER-140";

export const SOVEREIGN_OPERATIONS_STATE_RECONCILIATION_CONTROLLER_VERSION =
  "1.0.0";

export type SovereignDesiredState =
  | "RUNNING"
  | "STOPPED"
  | "DEGRADED"
  | "MAINTENANCE"
  | "ISOLATED"
  | "RECOVERING";

export type SovereignObservedState =
  | "RUNNING"
  | "STOPPED"
  | "DEGRADED"
  | "MAINTENANCE"
  | "ISOLATED"
  | "RECOVERING"
  | "FAILED"
  | "UNKNOWN";

export type SovereignReconciliationDecision =
  | "NO_ACTION"
  | "RECONCILE"
  | "RESTART"
  | "RECOVER"
  | "ISOLATE"
  | "BLOCK";

export type SovereignReconciliationState =
  | "IN_SYNC"
  | "DRIFT_DETECTED"
  | "RECONCILING"
  | "VERIFYING"
  | "RECONCILED"
  | "RECOVERY_REQUIRED"
  | "BLOCKED";

export interface SovereignReconciliationAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignReconciliationPolicy {
  automaticReconciliationEnabled: boolean;

  maxReconciliationAttempts: number;

  reconcileTimeoutMs: number;

  allowRestart: boolean;
  allowRecovery: boolean;
  allowIsolation: boolean;

  blockOnUnknownState: boolean;
}

export interface SovereignStateReconciliationRequest {
  reconciliationId: string;

  target: string;

  requestedBy: string;

  authorityContext: SovereignReconciliationAuthorityContext;

  desiredState: SovereignDesiredState;

  policy: SovereignReconciliationPolicy;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignReconciliationAttempt {
  attempt: number;

  desiredState: SovereignDesiredState;
  observedState: SovereignObservedState;

  decision: SovereignReconciliationDecision;

  startedAt: number;
  completedAt?: number;

  successful?: boolean;

  reason?: string;
}

export interface SovereignStateReconciliationRecord {
  reconciliationId: string;

  target: string;

  desiredState: SovereignDesiredState;
  observedState: SovereignObservedState;

  state: SovereignReconciliationState;

  attempts: SovereignReconciliationAttempt[];

  currentAttempt: number;

  startedAt?: number;
  deadlineAt?: number;
  reconciledAt?: number;

  createdAt: number;
  updatedAt: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignStateReconciliationResult {
  reconciliationId: string;

  target: string;

  accepted: boolean;

  desiredState: SovereignDesiredState;
  observedState: SovereignObservedState;

  state: SovereignReconciliationState;

  decision: SovereignReconciliationDecision;

  currentAttempt: number;
  remainingAttempts: number;

  remainingMs?: number;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsStateReconciliationController {
  public readonly id =
    SOVEREIGN_OPERATIONS_STATE_RECONCILIATION_CONTROLLER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_STATE_RECONCILIATION_CONTROLLER_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly reconciliationCanCreateAuthority = false;
  public readonly reconciliationCanEscalateAuthority = false;
  public readonly reconciliationCanOverrideOwner = false;
  public readonly reconciliationCanBypassSecurity = false;
  public readonly reconciliationCanIgnoreDesiredState = false;
  public readonly reconciliationCanDisableAudit = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignStateReconciliationRecord>();

  private readonly requests =
    new Map<string, SovereignStateReconciliationRequest>();

  private validate(
    request: SovereignStateReconciliationRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.reconciliationId) {
      reasons.push("RECONCILIATION_ID_REQUIRED");
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
      !Number.isInteger(
        request.policy.maxReconciliationAttempts
      ) ||
      request.policy.maxReconciliationAttempts < 1
    ) {
      reasons.push(
        "INVALID_MAX_RECONCILIATION_ATTEMPTS"
      );
    }

    if (
      !Number.isFinite(
        request.policy.reconcileTimeoutMs
      ) ||
      request.policy.reconcileTimeoutMs < 1
    ) {
      reasons.push(
        "INVALID_RECONCILIATION_TIMEOUT"
      );
    }

    return reasons;
  }

  public register(
    request: SovereignStateReconciliationRequest
  ): SovereignStateReconciliationResult {
    const now = Date.now();

    if (
      this.records.has(
        request.reconciliationId
      )
    ) {
      return this.failure(
        request.reconciliationId,
        request.target,
        request.desiredState,
        "UNKNOWN",
        "RECONCILIATION_ALREADY_EXISTS"
      );
    }

    const reasons =
      this.validate(request);

    if (reasons.length > 0) {
      return {
        reconciliationId:
          request.reconciliationId,

        target: request.target,

        accepted: false,

        desiredState:
          request.desiredState,

        observedState: "UNKNOWN",

        state: "BLOCKED",

        decision: "BLOCK",

        currentAttempt: 0,
        remainingAttempts: 0,

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignStateReconciliationRecord = {
      reconciliationId:
        request.reconciliationId,

      target: request.target,

      desiredState:
        request.desiredState,

      observedState: "UNKNOWN",

      state: "DRIFT_DETECTED",

      attempts: [],

      currentAttempt: 0,

      createdAt: request.createdAt,
      updatedAt: now,

      reasons: [
        "INITIAL_STATE_RECONCILIATION_REQUIRED"
      ],

      authority: "NONE"
    };

    this.records.set(
      record.reconciliationId,
      record
    );

    this.requests.set(
      record.reconciliationId,
      this.cloneRequest(request)
    );

    return this.result(
      record,
      request,
      "RECONCILE",
      now
    );
  }

  public observe(
    reconciliationId: string,
    observedState: SovereignObservedState,
    now = Date.now()
  ): SovereignStateReconciliationResult {
    const record =
      this.records.get(reconciliationId);

    const request =
      this.requests.get(reconciliationId);

    if (!record || !request) {
      return this.failure(
        reconciliationId,
        "",
        "RUNNING",
        observedState,
        "RECONCILIATION_NOT_FOUND"
      );
    }

    record.observedState =
      observedState;

    record.updatedAt = now;

    if (
      this.matchesDesiredState(
        record.desiredState,
        observedState
      )
    ) {
      record.state = "IN_SYNC";

      record.reasons = [];

      this.records.set(
        reconciliationId,
        record
      );

      return this.result(
        record,
        request,
        "NO_ACTION",
        now
      );
    }

    if (
      observedState === "UNKNOWN" &&
      request.policy.blockOnUnknownState
    ) {
      record.state = "BLOCKED";

      record.reasons = [
        "OBSERVED_STATE_UNKNOWN"
      ];

      this.records.set(
        reconciliationId,
        record
      );

      return this.result(
        record,
        request,
        "BLOCK",
        now
      );
    }

    record.state =
      "DRIFT_DETECTED";

    record.reasons = [
      `STATE_DRIFT_${observedState}_TO_${record.desiredState}`
    ];

    this.records.set(
      reconciliationId,
      record
    );

    if (
      !request.policy
        .automaticReconciliationEnabled
    ) {
      return this.result(
        record,
        request,
        "RECONCILE",
        now
      );
    }

    return this.beginReconciliation(
      reconciliationId,
      now
    );
  }

  public beginReconciliation(
    reconciliationId: string,
    now = Date.now()
  ): SovereignStateReconciliationResult {
    const record =
      this.records.get(reconciliationId);

    const request =
      this.requests.get(reconciliationId);

    if (!record || !request) {
      return this.failure(
        reconciliationId,
        "",
        "RUNNING",
        "UNKNOWN",
        "RECONCILIATION_NOT_FOUND"
      );
    }

    if (
      record.currentAttempt >=
      request.policy.maxReconciliationAttempts
    ) {
      return this.exhausted(
        record,
        request,
        now
      );
    }

    const decision =
      this.chooseDecision(
        record,
        request
      );

    if (decision === "BLOCK") {
      record.state = "BLOCKED";

      record.reasons = [
        "NO_SAFE_RECONCILIATION_PATH"
      ];

      this.records.set(
        reconciliationId,
        record
      );

      return this.result(
        record,
        request,
        "BLOCK",
        now
      );
    }

    record.currentAttempt += 1;

    record.state =
      "RECONCILING";

    record.startedAt ??= now;

    record.deadlineAt =
      now +
      request.policy.reconcileTimeoutMs;

    record.attempts.push({
      attempt:
        record.currentAttempt,

      desiredState:
        record.desiredState,

      observedState:
        record.observedState,

      decision,

      startedAt: now
    });

    record.updatedAt = now;

    record.reasons = [
      `RECONCILIATION_ATTEMPT_${record.currentAttempt}`,
      `RECONCILIATION_DECISION_${decision}`
    ];

    this.records.set(
      reconciliationId,
      record
    );

    return this.result(
      record,
      request,
      decision,
      now
    );
  }

  public completeAttempt(
    reconciliationId: string,
    successful: boolean,
    reason?: string,
    now = Date.now()
  ): SovereignStateReconciliationResult {
    const record =
      this.records.get(reconciliationId);

    const request =
      this.requests.get(reconciliationId);

    if (!record || !request) {
      return this.failure(
        reconciliationId,
        "",
        "RUNNING",
        "UNKNOWN",
        "RECONCILIATION_NOT_FOUND"
      );
    }

    if (
      record.state !== "RECONCILING"
    ) {
      return this.failure(
        record.reconciliationId,
        record.target,
        record.desiredState,
        record.observedState,
        "RECONCILIATION_NOT_ACTIVE"
      );
    }

    const attempt =
      record.attempts[
        record.attempts.length - 1
      ];

    if (!attempt) {
      return this.failure(
        record.reconciliationId,
        record.target,
        record.desiredState,
        record.observedState,
        "RECONCILIATION_ATTEMPT_NOT_FOUND"
      );
    }

    attempt.completedAt = now;
    attempt.successful = successful;
    attempt.reason = reason;

    record.updatedAt = now;

    if (!successful) {
      if (
        record.currentAttempt >=
        request.policy
          .maxReconciliationAttempts
      ) {
        return this.exhausted(
          record,
          request,
          now
        );
      }

      record.state =
        "DRIFT_DETECTED";

      record.reasons = [
        reason ??
          "RECONCILIATION_ATTEMPT_FAILED"
      ];

      this.records.set(
        reconciliationId,
        record
      );

      return this.beginReconciliation(
        reconciliationId,
        now
      );
    }

    record.state = "VERIFYING";

    record.reasons = [
      "RECONCILIATION_ACTION_COMPLETED_VERIFY_STATE"
    ];

    this.records.set(
      reconciliationId,
      record
    );

    return this.result(
      record,
      request,
      "RECONCILE",
      now
    );
  }

  public verify(
    reconciliationId: string,
    observedState: SovereignObservedState,
    now = Date.now()
  ): SovereignStateReconciliationResult {
    const record =
      this.records.get(reconciliationId);

    const request =
      this.requests.get(reconciliationId);

    if (!record || !request) {
      return this.failure(
        reconciliationId,
        "",
        "RUNNING",
        observedState,
        "RECONCILIATION_NOT_FOUND"
      );
    }

    if (
      record.state !== "VERIFYING"
    ) {
      return this.failure(
        record.reconciliationId,
        record.target,
        record.desiredState,
        record.observedState,
        "RECONCILIATION_NOT_VERIFYING"
      );
    }

    if (
      record.deadlineAt !== undefined &&
      now >= record.deadlineAt
    ) {
      return this.exhausted(
        record,
        request,
        now
      );
    }

    record.observedState =
      observedState;

    if (
      !this.matchesDesiredState(
        record.desiredState,
        observedState
      )
    ) {
      record.state =
        "DRIFT_DETECTED";

      record.updatedAt = now;

      record.reasons = [
        "DESIRED_STATE_NOT_REACHED"
      ];

      this.records.set(
        reconciliationId,
        record
      );

      if (
        record.currentAttempt >=
        request.policy
          .maxReconciliationAttempts
      ) {
        return this.exhausted(
          record,
          request,
          now
        );
      }

      return this.beginReconciliation(
        reconciliationId,
        now
      );
    }

    record.state =
      "RECONCILED";

    record.reconciledAt = now;
    record.updatedAt = now;

    record.reasons = [
      "DESIRED_STATE_RESTORED"
    ];

    this.records.set(
      reconciliationId,
      record
    );

    return this.result(
      record,
      request,
      "NO_ACTION",
      now
    );
  }

  private chooseDecision(
    record: SovereignStateReconciliationRecord,
    request: SovereignStateReconciliationRequest
  ): SovereignReconciliationDecision {
    if (
      record.observedState === "FAILED"
    ) {
      if (request.policy.allowRecovery) {
        return "RECOVER";
      }

      if (request.policy.allowRestart) {
        return "RESTART";
      }

      return "BLOCK";
    }

    if (
      record.observedState === "UNKNOWN"
    ) {
      return request.policy.blockOnUnknownState
        ? "BLOCK"
        : "RECONCILE";
    }

    if (
      record.desiredState === "ISOLATED"
    ) {
      return request.policy.allowIsolation
        ? "ISOLATE"
        : "BLOCK";
    }

    if (
      record.desiredState === "RUNNING" &&
      record.observedState === "STOPPED"
    ) {
      return request.policy.allowRestart
        ? "RESTART"
        : "RECONCILE";
    }

    if (
      record.desiredState === "RECOVERING"
    ) {
      return request.policy.allowRecovery
        ? "RECOVER"
        : "BLOCK";
    }

    return "RECONCILE";
  }

  private matchesDesiredState(
    desired: SovereignDesiredState,
    observed: SovereignObservedState
  ): boolean {
    return desired === observed;
  }

  private exhausted(
    record: SovereignStateReconciliationRecord,
    request: SovereignStateReconciliationRequest,
    now: number
  ): SovereignStateReconciliationResult {
    record.state =
      request.policy.allowRecovery
        ? "RECOVERY_REQUIRED"
        : "BLOCKED";

    record.updatedAt = now;

    record.reasons = [
      "RECONCILIATION_ATTEMPTS_EXHAUSTED"
    ];

    this.records.set(
      record.reconciliationId,
      record
    );

    return this.result(
      record,
      request,
      request.policy.allowRecovery
        ? "RECOVER"
        : "BLOCK",
      now
    );
  }

  public getRecord(
    reconciliationId: string
  ): SovereignStateReconciliationRecord | undefined {
    const record =
      this.records.get(reconciliationId);

    return record
      ? {
          ...record,

          attempts:
            record.attempts.map(
              (attempt) => ({
                ...attempt
              })
            ),

          reasons: [...record.reasons]
        }
      : undefined;
  }

  public getDrifted():
    SovereignStateReconciliationRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state ===
            "DRIFT_DETECTED" ||
          record.state ===
            "RECONCILING" ||
          record.state ===
            "VERIFYING"
      )
      .map((record) => ({
        ...record,

        attempts:
          record.attempts.map(
            (attempt) => ({
              ...attempt
            })
          ),

        reasons: [...record.reasons]
      }));
  }

  private cloneRequest(
    request: SovereignStateReconciliationRequest
  ): SovereignStateReconciliationRequest {
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
    record: SovereignStateReconciliationRecord,
    request: SovereignStateReconciliationRequest,
    decision: SovereignReconciliationDecision,
    now: number
  ): SovereignStateReconciliationResult {
    return {
      reconciliationId:
        record.reconciliationId,

      target: record.target,

      accepted:
        decision !== "BLOCK",

      desiredState:
        record.desiredState,

      observedState:
        record.observedState,

      state: record.state,

      decision,

      currentAttempt:
        record.currentAttempt,

      remainingAttempts:
        Math.max(
          0,
          request.policy
            .maxReconciliationAttempts -
            record.currentAttempt
        ),

      remainingMs:
        record.deadlineAt !== undefined
          ? Math.max(
              0,
              record.deadlineAt - now
            )
          : undefined,

      reasons: [...record.reasons],

      timestamp: now,

      authority: "NONE"
    };
  }

  private failure(
    reconciliationId: string,
    target: string,
    desiredState: SovereignDesiredState,
    observedState: SovereignObservedState,
    reason: string
  ): SovereignStateReconciliationResult {
    return {
      reconciliationId,
      target,

      accepted: false,

      desiredState,
      observedState,

      state: "BLOCKED",

      decision: "BLOCK",

      currentAttempt: 0,
      remainingAttempts: 0,

      reasons: [reason],

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  public assertSovereignty(): boolean {
    return (
      this.authority === "NONE" &&
      this.ownerAuthority === "SUPREME" &&
      this.stewardAuthority === "DELEGATED" &&
      this.reconciliationCanCreateAuthority === false &&
      this.reconciliationCanEscalateAuthority === false &&
      this.reconciliationCanOverrideOwner === false &&
      this.reconciliationCanBypassSecurity === false &&
      this.reconciliationCanIgnoreDesired
