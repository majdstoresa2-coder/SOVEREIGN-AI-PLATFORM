// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-LIFECYCLE-MANAGER-131.ts
// Sequence: 131
// Purpose: Sovereign Runtime/Service Lifecycle State & Transition Management
// ============================================================================

export const SOVEREIGN_OPERATIONS_LIFECYCLE_MANAGER_ID =
  "SOVEREIGN-OPERATIONS-LIFECYCLE-MANAGER-131";

export const SOVEREIGN_OPERATIONS_LIFECYCLE_MANAGER_VERSION =
  "1.0.0";

export type SovereignLifecycleState =
  | "REGISTERED"
  | "INITIALIZING"
  | "STARTING"
  | "RUNNING"
  | "DEGRADED"
  | "MAINTENANCE"
  | "DRAINING"
  | "STOPPING"
  | "STOPPED"
  | "FAILED"
  | "RECOVERING"
  | "BLOCKED";

export type SovereignLifecycleTargetType =
  | "PLATFORM"
  | "RUNTIME"
  | "SERVICE"
  | "WORKER"
  | "AGENT"
  | "CAPABILITY"
  | "DATABASE"
  | "QUEUE"
  | "MODEL"
  | "OTHER";

export type SovereignLifecycleDecision =
  | "TRANSITION"
  | "NO_CHANGE"
  | "RECOVER"
  | "BLOCK";

export interface SovereignLifecycleAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignLifecycleRegistration {
  lifecycleId: string;

  targetId: string;
  targetType: SovereignLifecycleTargetType;

  requestedBy: string;

  authorityContext: SovereignLifecycleAuthorityContext;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignLifecycleTransitionRequest {
  lifecycleId: string;

  requestedBy: string;

  nextState: SovereignLifecycleState;

  reason: string;

  securityApproved: boolean;
  policyApproved: boolean;

  timestamp?: number;
}

export interface SovereignLifecycleTransition {
  from: SovereignLifecycleState;
  to: SovereignLifecycleState;

  requestedBy: string;
  reason: string;

  timestamp: number;
}

export interface SovereignLifecycleRecord {
  lifecycleId: string;

  targetId: string;
  targetType: SovereignLifecycleTargetType;

  state: SovereignLifecycleState;

  createdAt: number;
  updatedAt: number;

  transitions: SovereignLifecycleTransition[];

  reasons: string[];

  authority: "NONE";
}

export interface SovereignLifecycleResult {
  lifecycleId: string;
  targetId: string;

  accepted: boolean;

  state: SovereignLifecycleState;
  decision: SovereignLifecycleDecision;

  previousState?: SovereignLifecycleState;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsLifecycleManager {
  public readonly id =
    SOVEREIGN_OPERATIONS_LIFECYCLE_MANAGER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_LIFECYCLE_MANAGER_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly lifecycleManagerCanCreateAuthority = false;
  public readonly lifecycleManagerCanEscalateAuthority = false;
  public readonly lifecycleManagerCanOverrideOwner = false;
  public readonly lifecycleManagerCanBypassSecurity = false;
  public readonly lifecycleManagerCanSkipInvalidTransitions = false;
  public readonly lifecycleManagerCanDisableAudit = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignLifecycleRecord>();

  private readonly authorityContexts =
    new Map<string, SovereignLifecycleAuthorityContext>();

  private readonly allowedTransitions:
    Record<SovereignLifecycleState, SovereignLifecycleState[]> = {
      REGISTERED: [
        "INITIALIZING",
        "BLOCKED"
      ],

      INITIALIZING: [
        "STARTING",
        "FAILED",
        "BLOCKED"
      ],

      STARTING: [
        "RUNNING",
        "FAILED",
        "RECOVERING",
        "BLOCKED"
      ],

      RUNNING: [
        "DEGRADED",
        "MAINTENANCE",
        "DRAINING",
        "FAILED"
      ],

      DEGRADED: [
        "RUNNING",
        "MAINTENANCE",
        "DRAINING",
        "FAILED",
        "RECOVERING"
      ],

      MAINTENANCE: [
        "STARTING",
        "RUNNING",
        "DRAINING",
        "FAILED"
      ],

      DRAINING: [
        "STOPPING",
        "FAILED",
        "RECOVERING"
      ],

      STOPPING: [
        "STOPPED",
        "FAILED",
        "RECOVERING"
      ],

      STOPPED: [
        "INITIALIZING",
        "STARTING",
        "BLOCKED"
      ],

      FAILED: [
        "RECOVERING",
        "BLOCKED"
      ],

      RECOVERING: [
        "STARTING",
        "RUNNING",
        "DEGRADED",
        "FAILED",
        "BLOCKED"
      ],

      BLOCKED: [
        "REGISTERED",
        "STOPPED"
      ]
    };

  private validateRegistration(
    registration: SovereignLifecycleRegistration
  ): string[] {
    const reasons: string[] = [];

    if (!registration.lifecycleId) {
      reasons.push("LIFECYCLE_ID_REQUIRED");
    }

    if (!registration.targetId) {
      reasons.push("TARGET_ID_REQUIRED");
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

    return reasons;
  }

  public register(
    registration: SovereignLifecycleRegistration
  ): SovereignLifecycleResult {
    const now = Date.now();

    if (
      this.records.has(registration.lifecycleId)
    ) {
      return this.failure(
        registration.lifecycleId,
        registration.targetId,
        "LIFECYCLE_ALREADY_EXISTS"
      );
    }

    const reasons =
      this.validateRegistration(registration);

    if (reasons.length > 0) {
      return {
        lifecycleId: registration.lifecycleId,
        targetId: registration.targetId,

        accepted: false,

        state: "BLOCKED",
        decision: "BLOCK",

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignLifecycleRecord = {
      lifecycleId: registration.lifecycleId,

      targetId: registration.targetId,
      targetType: registration.targetType,

      state: "REGISTERED",

      createdAt: registration.createdAt,
      updatedAt: now,

      transitions: [],

      reasons: [],

      authority: "NONE"
    };

    this.records.set(
      record.lifecycleId,
      record
    );

    this.authorityContexts.set(
      record.lifecycleId,
      {
        ...registration.authorityContext,
        delegationScope: [
          ...registration.authorityContext.delegationScope
        ]
      }
    );

    return this.result(
      record,
      "TRANSITION",
      now
    );
  }

  public transition(
    request: SovereignLifecycleTransitionRequest
  ): SovereignLifecycleResult {
    const record =
      this.records.get(request.lifecycleId);

    if (!record) {
      return this.failure(
        request.lifecycleId,
        "",
        "LIFECYCLE_NOT_FOUND"
      );
    }

    if (!request.requestedBy) {
      return this.failure(
        record.lifecycleId,
        record.targetId,
        "REQUESTER_REQUIRED"
      );
    }

    if (!request.reason) {
      return this.failure(
        record.lifecycleId,
        record.targetId,
        "TRANSITION_REASON_REQUIRED"
      );
    }

    if (!request.securityApproved) {
      return this.failure(
        record.lifecycleId,
        record.targetId,
        "SECURITY_APPROVAL_REQUIRED"
      );
    }

    if (!request.policyApproved) {
      return this.failure(
        record.lifecycleId,
        record.targetId,
        "POLICY_APPROVAL_REQUIRED"
      );
    }

    if (record.state === request.nextState) {
      return this.result(
        record,
        "NO_CHANGE",
        request.timestamp ?? Date.now()
      );
    }

    const allowed =
      this.allowedTransitions[
        record.state
      ];

    if (
      !allowed.includes(request.nextState)
    ) {
      return this.failure(
        record.lifecycleId,
        record.targetId,
        `INVALID_TRANSITION_${record.state}_TO_${request.nextState}`
      );
    }

    const now =
      request.timestamp ?? Date.now();

    const previousState =
      record.state;

    record.state =
      request.nextState;

    record.updatedAt = now;

    record.transitions.push({
      from: previousState,
      to: request.nextState,

      requestedBy: request.requestedBy,
      reason: request.reason,

      timestamp: now
    });

    record.reasons = [
      request.reason
    ];

    this.records.set(
      record.lifecycleId,
      record
    );

    const decision:
      SovereignLifecycleDecision =
      request.nextState === "RECOVERING"
        ? "RECOVER"
        : request.nextState === "BLOCKED"
          ? "BLOCK"
          : "TRANSITION";

    return this.result(
      record,
      decision,
      now,
      previousState
    );
  }

  public markFailed(
    lifecycleId: string,
    requestedBy: string,
    reason: string
  ): SovereignLifecycleResult {
    const record =
      this.records.get(lifecycleId);

    if (!record) {
      return this.failure(
        lifecycleId,
        "",
        "LIFECYCLE_NOT_FOUND"
      );
    }

    if (
      record.state === "FAILED"
    ) {
      return this.result(
        record,
        "NO_CHANGE",
        Date.now()
      );
    }

    const allowed =
      this.allowedTransitions[
        record.state
      ];

    if (!allowed.includes("FAILED")) {
      return this.failure(
        record.lifecycleId,
        record.targetId,
        `FAILURE_TRANSITION_NOT_ALLOWED_FROM_${record.state}`
      );
    }

    return this.transition({
      lifecycleId,
      requestedBy,
      nextState: "FAILED",
      reason,
      securityApproved: true,
      policyApproved: true
    });
  }

  public beginRecovery(
    lifecycleId: string,
    requestedBy: string,
    reason = "RECOVERY_STARTED"
  ): SovereignLifecycleResult {
    const record =
      this.records.get(lifecycleId);

    if (!record) {
      return this.failure(
        lifecycleId,
        "",
        "LIFECYCLE_NOT_FOUND"
      );
    }

    return this.transition({
      lifecycleId,
      requestedBy,
      nextState: "RECOVERING",
      reason,
      securityApproved: true,
      policyApproved: true
    });
  }

  public getRecord(
    lifecycleId: string
  ): SovereignLifecycleRecord | undefined {
    const record =
      this.records.get(lifecycleId);

    return record
      ? this.cloneRecord(record)
      : undefined;
  }

  public getByState(
    state: SovereignLifecycleState
  ): SovereignLifecycleRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state === state
      )
      .map(
        (record) =>
          this.cloneRecord(record)
      );
  }

  public getRunning():
    SovereignLifecycleRecord[] {
    return this.getByState("RUNNING");
  }

  public getDegraded():
    SovereignLifecycleRecord[] {
    return this.getByState("DEGRADED");
  }

  public getFailed():
    SovereignLifecycleRecord[] {
    return this.getByState("FAILED");
  }

  public getRecovering():
    SovereignLifecycleRecord[] {
    return this.getByState("RECOVERING");
  }

  private cloneRecord(
    record: SovereignLifecycleRecord
  ): SovereignLifecycleRecord {
    return {
      ...record,

      transitions:
        record.transitions.map(
          (transition) => ({
            ...transition
          })
        ),

      reasons: [
        ...record.reasons
      ]
    };
  }

  private result(
    record: SovereignLifecycleRecord,
    decision: SovereignLifecycleDecision,
    now: number,
    previousState?: SovereignLifecycleState
  ): SovereignLifecycleResult {
    return {
      lifecycleId: record.lifecycleId,
      targetId: record.targetId,

      accepted:
        decision !== "BLOCK",

      state: record.state,
      decision,

      previousState,

      reasons: [
        ...record.reasons
      ],

      timestamp: now,

      authority: "NONE"
    };
  }

  private failure(
    lifecycleId: string,
    targetId: string,
    reason: string
  ): SovereignLifecycleResult {
    return {
      lifecycleId,
      targetId,

      accepted: false,

      state: "BLOCKED",
      decision: "BLOCK",

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
      this.lifecycleManagerCanCreateAuthority === false &&
      this.lifecycleManagerCanEscalateAuthority === false &&
      this.lifecycleManagerCanOverrideOwner === false &&
      this.lifecycleManagerCanBypassSecurity === false &&
      this.lifecycleManagerCanSkipInvalidTransitions === false &&
      this.lifecycleManagerCanDisableAudit === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsLifecycleManager =
  new SovereignOperationsLifecycleManager();

export default sovereignOperationsLifecycleManager;
